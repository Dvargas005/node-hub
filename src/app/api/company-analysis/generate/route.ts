import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { parseGeminiJSON } from "@/lib/parse-gemini-json";
import { t, DEFAULT_LANG } from "@/lib/i18n";

export async function POST(req: NextRequest) {
  const { error, session } = await requireApiRole(["CLIENT"]);
  if (error || !session) return error;

  const lang = req.cookies.get("node-language")?.value || DEFAULT_LANG;

  if (!process.env.GEMINI_API_KEY) {
    console.error("[ANALYSIS_GENERATE] GEMINI_API_KEY is not configured");
    return NextResponse.json({ error: t("api.error.aiUnavailable", lang) }, { status: 503 });
  }

  try {
    const { option, feedback } = await req.json();
    if (option !== "A" && option !== "B") {
      return NextResponse.json({ error: t("api.error.invalidCategory", lang) }, { status: 400 });
    }

    const userId = session.user.id;
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        companyAnalysis: true,
        businessName: true, businessDescription: true, businessIndustry: true,
        targetAudience: true, hasBranding: true, brandColors: true,
        brandStyle: true, website: true, socialMedia: true, language: true,
      },
    });

    const analysis = user?.companyAnalysis as Record<string, unknown> | null;
    if (analysis?.status !== "pending_selection" || !analysis?.options) {
      return NextResponse.json({ error: t("api.error.internal", lang) }, { status: 400 });
    }

    const options = analysis.options as Record<string, unknown>;
    const chosen = (option === "A" ? options.optionA : options.optionB) as Record<string, unknown>;
    if (!chosen) {
      return NextResponse.json({ error: t("api.error.internal", lang) }, { status: 400 });
    }

    const sm = user?.socialMedia as Record<string, string> | null;
    const socialStr = sm ? Object.entries(sm).map(([k, v]) => `${k}: ${v}`).join(", ") : "None";

    const userLang = (user?.language as string) || "en";
    const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
      en: "Respond entirely in English.",
      es: "Respond entirely in Spanish (Responde completamente en español).",
      pt: "Respond entirely in Portuguese (Responda completamente em português).",
    };
    const languageInstruction = LANGUAGE_INSTRUCTIONS[userLang] || LANGUAGE_INSTRUCTIONS.en;

    const prompt = `You are a business consultant expert in small Latino businesses in the United States.

BUSINESS: ${user?.businessName || ""}
INDUSTRY: ${user?.businessIndustry || ""}
DESCRIPTION: ${user?.businessDescription || ""}
AUDIENCE: ${user?.targetAudience || ""}
BRAND: ${user?.hasBranding ? "Yes" : "No"} / Colors: ${user?.brandColors || "N/A"} / Style: ${user?.brandStyle || "N/A"}
WEBSITE: ${user?.website || "None"} | SOCIAL MEDIA: ${socialStr}

THE CLIENT CHOSE THIS PROFILE:
- Label: ${chosen.label}
- Description: ${chosen.description}
- Value proposition: ${chosen.valueProposition}
- Tone: ${chosen.tone}
${feedback ? `\nCLIENT FEEDBACK: "${feedback}"` : ""}

Now generate the COMPLETE ANALYSIS for this profile. Include:
1. description: expanded executive description (4-5 sentences)
2. valueProposition: detailed value proposition
3. targetAudience: detailed target audience (demographics, psychographics)
4. competitors: 3-5 competitors in the same market
5. swot: SWOT analysis focused on digital presence (strengths, opportunities, weaknesses, threats — 3 items each)
6. recommendations: 3 priority actions in design, web, and marketing
7. tone: communication tone

IMPORTANT: Respond with pure JSON only. No markdown, no backticks.
{"description":"...","valueProposition":"...","targetAudience":"...","competitors":["..."],"swot":{"strengths":["..."],"opportunities":["..."],"weaknesses":["..."],"threats":["..."]},"recommendations":["..."],"tone":"..."}

LANGUAGE: ${languageInstruction}`;

    let result = null;
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
        const genResult = await model.generateContent(prompt);
        const text = genResult.response.text();
        result = parseGeminiJSON(text);
        if (result) break;
      } catch (e) {
        console.error(`[ANALYSIS_GENERATE] Gemini model ${modelName} failed:`, e);
      }
    }

    if (!result) {
      return NextResponse.json({ error: t("api.error.aiFailed", lang) }, { status: 502 });
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
    return NextResponse.json({ error: t("api.error.internal", lang) }, { status: 500 });
  }
}
