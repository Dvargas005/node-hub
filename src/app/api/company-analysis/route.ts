import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { getGeminiModel } from "@/lib/gemini";

const ANALYSIS_COST = 10;

export async function POST() {
  const { error, session } = await requireApiRole(["CLIENT"]);
  if (error || !session) return error;

  try {
    const userId = session.user.id;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        freeCredits: true,
        businessName: true,
        businessDescription: true,
        businessIndustry: true,
        targetAudience: true,
        hasBranding: true,
        brandColors: true,
        brandStyle: true,
        website: true,
        socialMedia: true,
      },
    });

    const subscription = await db.subscription.findUnique({
      where: { userId },
      select: { id: true, creditsRemaining: true },
    });

    const freeCredits = user?.freeCredits || 0;
    const planCredits = subscription?.creditsRemaining || 0;
    if (freeCredits + planCredits < ANALYSIS_COST) {
      return NextResponse.json(
        { error: `Necesitas ${ANALYSIS_COST} créditos. Tienes ${freeCredits + planCredits}.` },
        { status: 400 }
      );
    }

    // Deduct credits BEFORE calling Gemini
    let remaining = ANALYSIS_COST;
    await db.$transaction(async (tx) => {
      if (freeCredits > 0) {
        const fromFree = Math.min(freeCredits, remaining);
        await tx.user.update({ where: { id: userId }, data: { freeCredits: { decrement: fromFree } } });
        remaining -= fromFree;
      }
      if (remaining > 0 && subscription) {
        await tx.subscription.update({ where: { id: subscription.id }, data: { creditsRemaining: { decrement: remaining } } });
      }
    });

    // Fetch website content if available
    let webContent = "";
    if (user?.website) {
      try {
        const res = await fetch(user.website, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; NODEBot/1.0)", Accept: "text/html" },
          signal: AbortSignal.timeout(8000),
          redirect: "follow",
        });
        const html = await res.text();
        webContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 2000);
      } catch {
        // Continue without web content
      }
    }

    const sm = user?.socialMedia as Record<string, string> | null;
    const socialStr = sm ? Object.entries(sm).map(([k, v]) => `${k}: ${v}`).join(", ") : "No tiene";

    const prompt = `Eres un consultor de negocios experto en pequeñas empresas y emprendimientos latinos en Estados Unidos.

INFORMACIÓN DEL NEGOCIO:
- Nombre: ${user?.businessName || "No especificado"}
- Industria: ${user?.businessIndustry || "No especificado"}
- Descripción: ${user?.businessDescription || "No especificado"}
- Público: ${user?.targetAudience || "No especificado"}
- Marca existente: ${user?.hasBranding ? "Sí" : "No"} / Colores: ${user?.brandColors || "N/A"} / Estilo: ${user?.brandStyle || "N/A"}
- Sitio web: ${user?.website || "No tiene"}
- Redes: ${socialStr}
${webContent ? `- Contenido del sitio web: ${webContent}` : ""}

GENERA DOS OPCIONES de perfil de empresa. Cada opción incluye:
1. Descripción ejecutiva (3-4 oraciones)
2. Propuesta de valor
3. Público objetivo detallado
4. Competidores principales (3-5)
5. Análisis FODA centrado en presencia digital
6. Recomendaciones inmediatas (3 acciones en diseño, web y marketing)
7. Tono de comunicación sugerido

OPCIÓN A: Enfoque conservador/profesional
OPCIÓN B: Enfoque moderno/atrevido

IMPORTANTE: Responde ÚNICAMENTE con el JSON. Sin explicación, sin markdown, sin backticks, sin texto antes ni después. Solo el JSON puro.
{
  "optionA": {
    "label": "Perfil Profesional",
    "description": "...",
    "valueProposition": "...",
    "targetAudience": "...",
    "competitors": ["..."],
    "swot": { "strengths": ["..."], "opportunities": ["..."], "weaknesses": ["..."], "threats": ["..."] },
    "recommendations": ["..."],
    "tone": "..."
  },
  "optionB": {
    "label": "Perfil Moderno",
    "description": "...",
    "valueProposition": "...",
    "targetAudience": "...",
    "competitors": ["..."],
    "swot": { "strengths": ["..."], "opportunities": ["..."], "weaknesses": ["..."], "threats": ["..."] },
    "recommendations": ["..."],
    "tone": "..."
  }
}`;

    let analysis;
    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { maxOutputTokens: 4096, temperature: 0.7 },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      console.log("[COMPANY_ANALYSIS] Raw response:", text.substring(0, 500));

      // Strip markdown code blocks, then parse
      const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      try {
        analysis = JSON.parse(cleaned);
      } catch {
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error("[COMPANY_ANALYSIS] Could not parse:", cleaned.substring(0, 200));
          throw new Error("No JSON in response");
        }
        analysis = JSON.parse(jsonMatch[0]);
      }
    } catch (aiErr) {
      console.error("[COMPANY_ANALYSIS] Gemini failed, refunding credits:", aiErr);
      // Refund credits
      let refund = ANALYSIS_COST;
      await db.$transaction(async (tx) => {
        const currentUser = await tx.user.findUnique({ where: { id: userId }, select: { freeCredits: true } });
        const maxFreeRefund = Math.min(refund, ANALYSIS_COST - (currentUser?.freeCredits || 0));
        if (maxFreeRefund > 0) {
          await tx.user.update({ where: { id: userId }, data: { freeCredits: { increment: maxFreeRefund } } });
          refund -= maxFreeRefund;
        }
        if (refund > 0 && subscription) {
          await tx.subscription.update({ where: { id: subscription.id }, data: { creditsRemaining: { increment: refund } } });
        }
      });
      return NextResponse.json({ error: "Error al generar el análisis. Se reembolsaron tus créditos." }, { status: 500 });
    }

    // Save analysis (both options, user picks later)
    await db.user.update({
      where: { id: userId },
      data: {
        companyAnalysis: JSON.parse(JSON.stringify({ options: analysis, selected: null })),
        companyAnalysisAt: new Date(),
      },
    });

    return NextResponse.json({ analysis });
  } catch (err) {
    console.error("[COMPANY_ANALYSIS]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
