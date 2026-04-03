import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { parseGeminiJSON } from "@/lib/parse-gemini-json";

export async function POST(req: NextRequest) {
  const { error, session } = await requireApiRole(["CLIENT"]);
  if (error || !session) return error;

  try {
    const { option, feedback } = await req.json();
    if (option !== "A" && option !== "B") {
      return NextResponse.json({ error: "Opción inválida" }, { status: 400 });
    }

    const userId = session.user.id;
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        companyAnalysis: true,
        businessName: true, businessDescription: true, businessIndustry: true,
        targetAudience: true, hasBranding: true, brandColors: true,
        brandStyle: true, website: true, socialMedia: true,
      },
    });

    const analysis = user?.companyAnalysis as Record<string, unknown> | null;
    if (analysis?.status !== "pending_selection" || !analysis?.options) {
      return NextResponse.json({ error: "No tienes opciones pendientes" }, { status: 400 });
    }

    const options = analysis.options as Record<string, unknown>;
    const chosen = (option === "A" ? options.optionA : options.optionB) as Record<string, unknown>;
    if (!chosen) {
      return NextResponse.json({ error: "Opción no encontrada" }, { status: 400 });
    }

    const sm = user?.socialMedia as Record<string, string> | null;
    const socialStr = sm ? Object.entries(sm).map(([k, v]) => `${k}: ${v}`).join(", ") : "No tiene";

    const prompt = `Eres un consultor de negocios experto en pequeñas empresas latinas en Estados Unidos.

NEGOCIO: ${user?.businessName || ""}
INDUSTRIA: ${user?.businessIndustry || ""}
DESCRIPCIÓN: ${user?.businessDescription || ""}
PÚBLICO: ${user?.targetAudience || ""}
MARCA: ${user?.hasBranding ? "Sí" : "No"} / Colores: ${user?.brandColors || "N/A"} / Estilo: ${user?.brandStyle || "N/A"}
WEB: ${user?.website || "No tiene"} | REDES: ${socialStr}

EL CLIENTE ELIGIÓ ESTE PERFIL:
- Label: ${chosen.label}
- Descripción: ${chosen.description}
- Propuesta de valor: ${chosen.valueProposition}
- Tono: ${chosen.tone}
${feedback ? `\nFEEDBACK DEL CLIENTE: "${feedback}"` : ""}

Ahora genera el ANÁLISIS COMPLETO de este perfil. Incluye:
1. description: descripción ejecutiva expandida (4-5 oraciones)
2. valueProposition: propuesta de valor detallada
3. targetAudience: público objetivo detallado (demografía, psicografía)
4. competitors: 3-5 competidores del mismo mercado
5. swot: análisis FODA centrado en presencia digital (strengths, opportunities, weaknesses, threats — 3 items cada uno)
6. recommendations: 3 acciones prioritarias en diseño, web y marketing
7. tone: tono de comunicación

IMPORTANTE: Responde ÚNICAMENTE con JSON puro. Sin markdown, sin backticks.
{"description":"...","valueProposition":"...","targetAudience":"...","competitors":["..."],"swot":{"strengths":["..."],"opportunities":["..."],"weaknesses":["..."],"threats":["..."]},"recommendations":["..."],"tone":"..."}`;

    let result = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          generationConfig: { maxOutputTokens: 4096, temperature: 0.7 },
        });
        const genResult = await model.generateContent(prompt);
        const text = genResult.response.text();
        console.log(`[ANALYSIS_GENERATE] Attempt ${attempt + 1}:`, text.substring(0, 300));
        result = parseGeminiJSON(text);
        if (result) break;
      } catch (e) {
        console.error(`[ANALYSIS_GENERATE] Attempt ${attempt + 1} failed:`, e);
      }
    }

    if (!result) {
      return NextResponse.json({ error: "No se pudo completar el análisis. Intenta de nuevo." }, { status: 500 });
    }

    // Merge chosen label/tone with full analysis
    const fullAnalysis = { ...(result as Record<string, unknown>), label: chosen.label };

    await db.user.update({
      where: { id: userId },
      data: {
        companyAnalysis: JSON.parse(JSON.stringify({
          status: "complete",
          options: analysis.options,
          selectedOption: option,
          selected: fullAnalysis,
        })),
      },
    });

    return NextResponse.json({ analysis: fullAnalysis });
  } catch (err) {
    console.error("[ANALYSIS_GENERATE]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
