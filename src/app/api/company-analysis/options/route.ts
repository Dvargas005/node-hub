import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { parseGeminiJSON } from "@/lib/parse-gemini-json";

const ANALYSIS_COST = 10;

function buildBusinessContext(user: Record<string, unknown>, webContent: string) {
  const sm = user.socialMedia as Record<string, string> | null;
  const socialStr = sm ? Object.entries(sm).map(([k, v]) => `${k}: ${v}`).join(", ") : "No tiene";

  return `- Nombre: ${user.businessName || "No especificado"}
- Industria: ${user.businessIndustry || "No especificado"}
- Descripción: ${user.businessDescription || "No especificado"}
- Público: ${user.targetAudience || "No especificado"}
- Marca existente: ${user.hasBranding ? "Sí" : "No"} / Colores: ${user.brandColors || "N/A"} / Estilo: ${user.brandStyle || "N/A"}
- Sitio web: ${user.website || "No tiene"}
- Redes: ${socialStr}
${webContent ? `- Contenido del sitio web: ${webContent}` : ""}`;
}

async function fetchWebContent(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NODEBot/1.0)", Accept: "text/html" },
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    });
    const html = await res.text();
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 2000);
  } catch {
    return "";
  }
}

export async function POST() {
  const { error, session } = await requireApiRole(["CLIENT"]);
  if (error || !session) return error;

  try {
    const userId = session.user.id;

    // Check if user already has pending options (don't charge again)
    const existingUser = await db.user.findUnique({
      where: { id: userId },
      select: { companyAnalysis: true, companyAnalysisAt: true },
    });
    const existing = existingUser?.companyAnalysis as Record<string, unknown> | null;
    if (existing?.status === "pending_selection" && existing?.options) {
      return NextResponse.json({ options: existing.options });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        freeCredits: true, businessName: true, businessDescription: true,
        businessIndustry: true, targetAudience: true, hasBranding: true,
        brandColors: true, brandStyle: true, website: true, socialMedia: true,
        companyAnalysisAt: true,
      },
    });

    const subscription = await db.subscription.findUnique({
      where: { userId },
      select: { id: true, creditsRemaining: true, currentPeriodStart: true },
    });

    // Free renewal: if subscription renewed after last analysis
    const isFreeRenewal = !!(
      user?.companyAnalysisAt &&
      subscription?.currentPeriodStart &&
      new Date(subscription.currentPeriodStart) > new Date(user.companyAnalysisAt)
    );

    const freeCredits = user?.freeCredits || 0;
    const planCredits = subscription?.creditsRemaining || 0;
    if (!isFreeRenewal && freeCredits + planCredits < ANALYSIS_COST) {
      return NextResponse.json(
        { error: `Necesitas ${ANALYSIS_COST} créditos. Tienes ${freeCredits + planCredits}.` },
        { status: 400 }
      );
    }

    // Deduct credits (skip if free renewal)
    if (isFreeRenewal) {
      console.log("[ANALYSIS_OPTIONS] Free renewal for user:", userId);
    }
    let deductRemaining = isFreeRenewal ? 0 : ANALYSIS_COST;
    if (deductRemaining > 0) await db.$transaction(async (tx) => {
      if (freeCredits > 0) {
        const fromFree = Math.min(freeCredits, deductRemaining);
        await tx.user.update({ where: { id: userId }, data: { freeCredits: { decrement: fromFree } } });
        deductRemaining -= fromFree;
      }
      if (deductRemaining > 0 && subscription) {
        await tx.subscription.update({ where: { id: subscription.id }, data: { creditsRemaining: { decrement: deductRemaining } } });
      }
    });

    const webContent = user?.website ? await fetchWebContent(user.website as string) : "";
    const context = buildBusinessContext(user as unknown as Record<string, unknown>, webContent);

    const prompt = `Eres un consultor de negocios experto en pequeñas empresas latinas en Estados Unidos.

INFORMACIÓN DEL NEGOCIO:
${context}

Genera DOS opciones de perfil de empresa. Cada opción tiene SOLO:
- label: nombre del perfil
- description: descripción ejecutiva en 3 oraciones
- valueProposition: propuesta de valor en 1 oración
- tone: tono de comunicación sugerido

OPCIÓN A: Enfoque conservador/profesional
OPCIÓN B: Enfoque moderno/atrevido

IMPORTANTE: Responde ÚNICAMENTE con JSON puro. Sin markdown, sin backticks, sin texto adicional.
{"optionA":{"label":"...","description":"...","valueProposition":"...","tone":"..."},"optionB":{"label":"...","description":"...","valueProposition":"...","tone":"..."}}`;

    let options = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          generationConfig: { maxOutputTokens: 2048, temperature: 0.7 },
        });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        console.log(`[ANALYSIS_OPTIONS] Attempt ${attempt + 1}:`, text.substring(0, 300));
        options = parseGeminiJSON(text);
        if (options) break;
      } catch (e) {
        console.error(`[ANALYSIS_OPTIONS] Attempt ${attempt + 1} failed:`, e);
      }
    }

    if (!options) {
      // Refund
      let refund = ANALYSIS_COST;
      await db.$transaction(async (tx) => {
        if (freeCredits > 0) {
          const r = Math.min(ANALYSIS_COST, ANALYSIS_COST);
          await tx.user.update({ where: { id: userId }, data: { freeCredits: { increment: Math.min(r, ANALYSIS_COST - (user?.freeCredits || 0) + freeCredits) } } });
          refund = 0;
        }
        if (refund > 0 && subscription) {
          await tx.subscription.update({ where: { id: subscription.id }, data: { creditsRemaining: { increment: refund } } });
        }
      });
      return NextResponse.json({ error: "No se pudo generar el análisis. Se reembolsaron tus créditos." }, { status: 500 });
    }

    await db.user.update({
      where: { id: userId },
      data: {
        companyAnalysis: JSON.parse(JSON.stringify({ status: "pending_selection", options })),
        companyAnalysisAt: new Date(),
      },
    });

    return NextResponse.json({ options });
  } catch (err) {
    console.error("[ANALYSIS_OPTIONS]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
