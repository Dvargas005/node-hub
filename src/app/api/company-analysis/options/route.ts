import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { parseGeminiJSON } from "@/lib/parse-gemini-json";
import { cookies } from "next/headers";
import { t, DEFAULT_LANG } from "@/lib/i18n";

const ANALYSIS_COST = 10;

// S3: Sanitize user inputs before injecting into prompts
function sanitize(str: unknown): string {
  if (typeof str !== "string") return "";
  return str.replace(/[<>{}]/g, "").substring(0, 500);
}

function buildBusinessContext(user: Record<string, unknown>, webContent: string) {
  const sm = user.socialMedia as Record<string, string> | null;
  const socialStr = sm ? Object.entries(sm).map(([k, v]: [string, any]) => `${k}: ${sanitize(String(v))}`).join(", ") : "No tiene";

  return `- Nombre: ${sanitize(user.businessName) || "No especificado"}
- Industria: ${sanitize(user.businessIndustry) || "No especificado"}
- Descripción: ${sanitize(user.businessDescription) || "No especificado"}
- Público: ${sanitize(user.targetAudience) || "No especificado"}
- Marca existente: ${user.hasBranding ? "Sí" : "No"} / Colores: ${sanitize(user.brandColors) || "N/A"} / Estilo: ${sanitize(user.brandStyle) || "N/A"}
- Sitio web: ${sanitize(user.website) || "No tiene"}
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
  } catch (e) {
    console.error("[ANALYSIS] fetchWebContent failed (non-blocking):", e);
    return "";
  }
}

async function refundCredits(userId: string, freeDeducted: number, planDeducted: number, subscriptionId?: string) {
  await db.$transaction(async (tx: any) => {
    if (freeDeducted > 0) {
      await tx.user.update({ where: { id: userId }, data: { freeCredits: { increment: freeDeducted } } });
    }
    if (planDeducted > 0 && subscriptionId) {
      await tx.subscription.update({ where: { id: subscriptionId }, data: { creditsRemaining: { increment: planDeducted } } });
    }
  });
}

export async function POST() {
  const lang = (await cookies()).get("node-language")?.value || DEFAULT_LANG;
  const { error, session } = await requireApiRole(["CLIENT"]);
  if (error || !session) return error;

  // Fail fast (and BEFORE charging credits) if the AI provider isn't configured.
  if (!process.env.GEMINI_API_KEY) {
    console.error("[ANALYSIS_OPTIONS] GEMINI_API_KEY is not configured");
    return NextResponse.json({ error: t("api.error.aiUnavailable", lang) }, { status: 503 });
  }

  const userId = session.user.id;
  let creditsDeducted = false;
  let freeDeducted = 0;
  let planDeducted = 0;
  let subscriptionId: string | undefined;

  try {
    // Check if user already has pending options (don't charge again)
    const existingUser = await db.user.findUnique({
      where: { id: userId },
      select: { companyAnalysis: true, companyAnalysisAt: true },
    });
    const existing = existingUser?.companyAnalysis as Record<string, unknown> | null;
    if (existing?.status === "pending_selection" && existing?.options) {
      return NextResponse.json({ options: existing.options });
    }

    // Load user data for prompt
    const userData = await db.user.findUnique({
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
    subscriptionId = subscription?.id;

    // Free renewal: if subscription renewed after last analysis
    const isFreeRenewal = !!(
      userData?.companyAnalysisAt &&
      subscription?.currentPeriodStart &&
      new Date(subscription.currentPeriodStart) > new Date(userData.companyAnalysisAt)
    );

    // C10: Atomic balance check + deduction inside transaction
    if (!isFreeRenewal) {
      await db.$transaction(async (tx: any) => {
        const user = await tx.user.findUnique({ where: { id: userId }, select: { freeCredits: true } });
        const sub = await tx.subscription.findUnique({ where: { userId }, select: { id: true, creditsRemaining: true } });
        const freeCredits = user?.freeCredits || 0;
        const planCredits = sub?.creditsRemaining || 0;

        if (freeCredits + planCredits < ANALYSIS_COST) {
          throw new Error(`INSUFFICIENT:${freeCredits + planCredits}`);
        }

        freeDeducted = Math.min(freeCredits, ANALYSIS_COST);
        planDeducted = ANALYSIS_COST - freeDeducted;

        if (freeDeducted > 0) {
          await tx.user.update({ where: { id: userId }, data: { freeCredits: { decrement: freeDeducted } } });
        }
        if (planDeducted > 0 && sub) {
          await tx.subscription.update({ where: { id: sub.id }, data: { creditsRemaining: { decrement: planDeducted } } });
        }
      });
      creditsDeducted = true;
    }

    const webContent = userData?.website ? await fetchWebContent(userData.website as string) : "";
    const context = buildBusinessContext(userData as unknown as Record<string, unknown>, webContent);

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
    const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];
    for (const modelName of MODELS) {
      try {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({
          model: modelName,
          // 8192: gemini-2.5-flash spends "thinking" tokens from this same budget,
          // so a low cap truncates the actual JSON output mid-response.
          generationConfig: { maxOutputTokens: 8192, temperature: 0.7 },
        });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        options = parseGeminiJSON(text);
        if (options) break;
      } catch (e) {
        console.error(`[ANALYSIS] Gemini model ${modelName} failed:`, e);
      }
    }

    if (!options) {
      // Refund credits since generation failed
      if (creditsDeducted) {
        try {
          await refundCredits(userId, freeDeducted, planDeducted, subscriptionId);
        } catch (refundErr) {
          console.error("[ANALYSIS] CRITICAL: Refund failed!", refundErr);
        }
      }
      return NextResponse.json({ error: t("api.error.aiFailed", lang) }, { status: 502 });
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
    // C9: Always attempt refund in outer catch if credits were deducted
    if (creditsDeducted) {
      try {
        await refundCredits(userId, freeDeducted, planDeducted, subscriptionId);
      } catch (refundErr) {
        console.error("[ANALYSIS] CRITICAL: Refund failed!", refundErr);
      }
    }

    const msg = err instanceof Error ? err.message : "";
    if (msg.startsWith("INSUFFICIENT:")) {
      const total = msg.split(":")[1];
      return NextResponse.json(
        { error: t("api.error.needCredits", lang).replace("{cost}", String(ANALYSIS_COST)).replace("{total}", String(total)) },
        { status: 400 }
      );
    }

    console.error("[ANALYSIS_OPTIONS]", err);
    return NextResponse.json({ error: t("api.error.internal", lang) }, { status: 500 });
  }
}
