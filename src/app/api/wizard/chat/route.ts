import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { getGeminiModel } from "@/lib/gemini";
import { t, DEFAULT_LANG } from "@/lib/i18n";

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  en: "Respond entirely in English.",
  es: "Respond entirely in Spanish (Responde completamente en español).",
  pt: "Respond entirely in Portuguese (Responda completamente em português).",
};

function buildClientProfile(user: Record<string, unknown>): string {
  const lines: string[] = [];
  if (user.businessName) lines.push(`- Business: ${user.businessName}${user.businessDescription ? " — " + user.businessDescription : ""}`);
  if (user.businessIndustry) lines.push(`- Industry: ${user.businessIndustry}`);
  if (user.targetAudience) lines.push(`- Audience: ${user.targetAudience}`);
  if (user.hasBranding !== null && user.hasBranding !== undefined) {
    lines.push(`- Existing brand: ${user.hasBranding ? "Yes, colors: " + (user.brandColors || "unspecified") + ", style: " + (user.brandStyle || "unspecified") : "No brand"}`);
  }
  lines.push(`- Website: ${user.website || "None"}`);
  if (user.socialMedia && typeof user.socialMedia === "object") {
    const sm = user.socialMedia as Record<string, string>;
    const formatted = Object.entries(sm).map(([k, v]) => `${k}: ${v}`).join(", ");
    if (formatted) lines.push(`- Social media: ${formatted}`);
  }
  return lines.length > 0 ? lines.join("\n") : "Profile not completed yet.";
}

function buildClientHistory(tickets: { status: string; variant: { service: { name: string } } }[]): string {
  if (tickets.length === 0) return "New client, no service history.";

  const serviceCount: Record<string, { total: number; completed: number; inProgress: number }> = {};
  for (const tick of tickets) {
    const name = tick.variant?.service?.name || "Unknown service";
    if (!serviceCount[name]) serviceCount[name] = { total: 0, completed: 0, inProgress: 0 };
    serviceCount[name].total++;
    if (tick.status === "COMPLETED") serviceCount[name].completed++;
    else if (!["CANCELED"].includes(tick.status)) serviceCount[name].inProgress++;
  }

  const lines = Object.entries(serviceCount).map(([name, c]) => {
    const parts = [];
    if (c.completed > 0) parts.push(`${c.completed} completed`);
    if (c.inProgress > 0) parts.push(`${c.inProgress} in progress`);
    return `- ${name}: ${parts.join(", ")}`;
  });

  return lines.join("\n");
}

function buildSystemPrompt(opts: {
  catalog: string;
  category?: string;
  profile: string;
  history: string;
  businessName: string;
  planName: string;
  deliveryDays: number;
  totalCredits: number;
  activeTickets: number;
  maxActiveReqs: number;
  recommendations: string[];
  cheapestInCategory: number | null;
  deliveryLanguage: string;
  pmHasCalendly: boolean;
  lang: string;
}) {
  const { catalog, category, profile, history, businessName, planName, deliveryDays, totalCredits, activeTickets, maxActiveReqs, recommendations, cheapestInCategory, deliveryLanguage, pmHasCalendly, lang } = opts;

  const recsBlock = recommendations.length > 0
    ? `\nPENDING RECOMMENDATIONS FROM AI ANALYSIS:\n${recommendations.map((r: any, i: number) => `${i + 1}. "${r}"`).join("\n")}\nIf what the client requests relates to any recommendation, mention it: "This aligns with a recommendation from your company analysis."\n`
    : "";

  const creditWarning = cheapestInCategory !== null && totalCredits < cheapestInCategory
    ? `\nWARNING: The client has ${totalCredits} credits and services in this category start at ${cheapestInCategory} credits. Inform them upfront that they will need more credits or an additional pack.`
    : "";

  const languageInstruction = LANGUAGE_INSTRUCTIONS[lang] || LANGUAGE_INSTRUCTIONS.en;

  return `You are N.O.D.E.'s briefing agent. Your job is to gather all information needed for our team to execute the client's order perfectly.

CLIENT PROFILE:
${profile}

CLIENT PLAN: ${planName}
- Available credits: ${totalCredits}
- Active requests: ${activeTickets}/${maxActiveReqs === 999 ? "unlimited" : maxActiveReqs}
- Delivery time: ${deliveryDays} business days
${creditWarning}

DELIVERABLES LANGUAGE: ${deliveryLanguage}
If different from the conversation language, mention: "Your deliverables will be in ${deliveryLanguage === "en" ? "English" : deliveryLanguage === "pt" ? "Portuguese" : "Spanish"}."

CLIENT HISTORY:
${history}
${recsBlock}

CRITICAL RULES:
1. You already know the client and their business (see PROFILE above). Do NOT ask about business name, industry, audience, or branding — you already have it.
2. Your questions are ONLY about the specific deliverable they are requesting.
3. Be direct. Maximum 3-4 questions, one at a time. No small talk.
4. If the client provides enough information in one reply, skip remaining questions.
5. If what they request is not in the catalog, suggest the closest option. If nothing is close or the client insists on something custom, ESCALATE to a human: "I'll connect you with a Project Manager who can help with this." Generate the brief with "escalated": true and "pmAlert": "Client requests service outside catalog: [description]".
6. Do NOT invent services not in the catalog. If flexibility is needed, escalate to the PM.
7. The maximum discount you can offer is 4.5%. If the client asks for more, say: "That's the maximum I can offer. If you need something special, I'll connect you with a PM." Generate the brief with "escalated": true and "pmAlert": "Client requests discount greater than 4.5%".

DELIVERY TIMES (do NOT ask the client):
- Do NOT ask the client when they need it. Delivery time is defined by their plan.
- Member: 5 business days
- Growth: 3 business days
- Pro: 24-48 hours
- The current client has plan ${planName} (${deliveryDays} business days).
- If the client mentions urgency, respond: "Your ${planName} plan has a delivery time of ${deliveryDays} business days. If you need it faster, consider upgrading your plan."
- NEVER invent time limitations or say "we can't deliver it today".

RESPONSE LENGTH:
- Be BRIEF. Maximum 2-3 sentences per message.
- Do NOT write long paragraphs.
- Do NOT repeat what the client already said.
- Do NOT make long summaries during the conversation.

UPSELLING:
When suggesting additional services, ALWAYS mention the price in credits.
Format: "Would you also be interested in [service]? ([X] credits)"
If the user has enough credits, suggest complementary services.
If they don't have enough, mention they can buy extra credits from billing.

INSUFFICIENT CREDITS:
If the client doesn't have enough credits for the service:
1. Say it ONCE: "This service costs X credits and you have Y available."
2. Suggest: "You can buy extra credits from your billing panel."
3. Do NOT continue answering questions about the service.
4. Generate the brief JSON with: "insufficientCredits": true

DELIVERY TIME DISCOUNT:
Before generating the brief, ask: "Do you have flexibility with the delivery time? If you can wait a few more days, we offer a discount."
Available discounts by plan:
- Member (5-day SLA): 7 days → 3% off, 8 days → 5% off, 10 days → 10% off
- Growth (3-day SLA): 5 days → 5% off, 7 days → 8% off, 10 days → 10% off
- Pro (2-day SLA): 3 days → 3% off, 5 days → 7% off, 7 days → 10% off
If the client accepts more days, include in the brief: "discount": { "percent": X, "extendedDays": Y, "originalDays": Z }
If they don't want to wait, include "discount": null

PROFESSIONAL CLOSE:
When you have all the necessary information:
1. Summarize in 2-3 sentences.
2. Say: "A Project Manager will review your request."
3. Suggest a complementary service with price in credits.
4. If they decline the upsell, proceed with the brief.
5. If they accept, adjust the brief.
6. Mention: "If you approve the delivery on the first round, you receive a credit bonus."
7. Only AFTER generate the brief JSON.

THIRD-PARTY WORK DETECTION:
- The client's registered business is "${businessName || "not registered"}".
- If the client mentions a different business name, ask naturally: "Is this project for ${businessName || "your business"} or another company?"
- If they confirm it's for another company, do NOT block them. Continue normally but include in the brief JSON: "pmAlert": "Client requests work for a different company than registered: [mentioned name]"
- If it seems to be for their own business, include "pmAlert": null.

PLAN SERVICE FILTERS:
- Member: Basic landing page, contact form, Google Business setup, Hourly Meeting
- Growth: + Advanced landing, SEO, larger Content packs
- Pro: + Multi-page site, e-commerce, blog, integrations
The current client has plan ${planName}. Do NOT offer services outside their plan.

SERVICES OUTSIDE CATALOG:
If the client requests something not in your catalog:
1. Do NOT invent a service that doesn't exist
2. Suggest the closest service in the catalog
3. If nothing is close, say: "That service is not in our standard catalog, but I can escalate your case to a Project Manager to evaluate it."
4. If the client agrees to escalate, generate the brief with "escalated": true
5. NEVER promise prices for services outside the catalog

CATEGORY QUESTIONS (only about the deliverable, NOT about the company or deadlines):

DESIGN & BRANDING:
- What piece do you need? (logo, flyer, templates, brand guide, business kit)
- Is there a style or visual reference you like?
- Do you have texts or content ready, or do you need us to create it?

WEB DEVELOPMENT:
- What type of site or page do you need? (landing page, full site, contact form, e-commerce)
- How many sections/pages? What information should it include?
- Do you have the content ready (texts, photos) or should we create it?

DIGITAL MARKETING:
- What do you need? (posts, campaign, social media setup, monthly management)
- For which platform(s)?
- Is there a specific event, launch, or date?

CONSULTING:
- What topic do you want to discuss in this meeting? (strategy, onboarding, review, planning)
- Do you already have a Calendly link from your PM, or should we schedule through the platform?

${category ? `SELECTED CATEGORY: ${category}` : "The client hasn't selected a category yet. Identify it from their message."}

FIRST MESSAGE:
- If the client has pending recommendations related to the category, start with: "Hello! I see your analysis recommends [relevant recommendation]. Is that what you want to work on, or do you have another need?"
- If they have no recommendations, start directly with the first question for the category.
- Do NOT repeat information you already know from the profile.

${pmHasCalendly ? `MEETINGS:
The client's PM has a calendar available for booking meetings. If the client has complex requirements, custom needs, or seems to need a consultation, suggest: "Would you like to schedule a call with your Project Manager?" If the client says yes, include "meetingRequested": true in the brief JSON. Otherwise include "meetingRequested": false.` : ""}

AVAILABLE SERVICE CATALOG:
${catalog}

When you have enough information and have completed the professional close, generate the brief JSON:
:::BRIEF_JSON:::
{
  "suggestedServiceSlug": "string",
  "suggestedVariantId": "string",
  "deliveryLanguage": "${deliveryLanguage}",
  "summary": "2-3 sentence summary",
  "details": {
    "deliverable": "What exactly will be delivered",
    "style": "Style or references mentioned",
    "content": "Whether the client provides content or we create it",
    "extras": "Any additional details"
  },
  "pmAlert": null,
  "discount": null,
  "firstRoundBonus": 0,
  "insufficientCredits": false,
  "escalated": false,
  "meetingRequested": false
}
:::END_BRIEF:::

LANGUAGE: ${languageInstruction}`;
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireApiRole(["CLIENT", "ADMIN", "PM"]);
  if (error || !session) return error;

  const lang = req.cookies.get("node-language")?.value || DEFAULT_LANG;
  try {
    const { messages, category } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: t("api.error.messagesRequired", lang) }, { status: 400 });
    }

    const userId = session.user.id;
    const userRole = (session.user as Record<string, unknown>).role as string;

    // Verify onboarding completed
    const userCheck = await db.user.findUnique({
      where: { id: userId },
      select: { onboardingCompleted: true },
    });
    if (!userCheck?.onboardingCompleted) {
      return NextResponse.json({ error: t("api.error.completeProfile", lang) }, { status: 403 });
    }

    // Verify client has credits (plan OR free)
    if (userRole === "CLIENT") {
      const creditCheck = await db.user.findUnique({ where: { id: userId }, select: { freeCredits: true } });
      const subCheck = await db.subscription.findUnique({ where: { userId }, select: { status: true, creditsRemaining: true } });
      const total = (creditCheck?.freeCredits || 0) + (subCheck?.status === "ACTIVE" ? subCheck.creditsRemaining : 0);
      if (total <= 0) {
        return NextResponse.json({ error: t("wizard.noCredits", lang) }, { status: 403 });
      }
    }

    // Load user profile, subscription, ticket history, and catalog in parallel
    const [user, subscription, tickets, activeTicketCount, services] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: {
          businessName: true,
          businessDescription: true,
          businessIndustry: true,
          targetAudience: true,
          hasBranding: true,
          brandColors: true,
          brandStyle: true,
          website: true,
          socialMedia: true,
          freeCredits: true,
          companyAnalysis: true,
          deliveryLanguage: true,
          assignedPm: { select: { calendlyUrl: true } },
        },
      }),
      db.subscription.findUnique({
        where: { userId },
        include: { plan: true },
      }),
      db.ticket.findMany({
        where: { userId },
        take: 20,
        orderBy: { createdAt: "desc" },
        select: {
          status: true,
          variant: { select: { service: { select: { name: true } } } },
        },
      }),
      db.ticket.count({
        where: { userId, status: { notIn: ["COMPLETED", "CANCELED"] } },
      }),
      db.service.findMany({
        where: { isActive: true },
        include: {
          variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
        },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    const catalogText = services
      .map((s: any) => {
        const variants = s.variants
          .map(
            (v: any) =>
              `  - ${v.name} (ID: ${v.id}): ${v.creditCost} credits, ~${v.estimatedDays} days. ${v.description}${v.minPlan ? ` (Min plan: ${v.minPlan})` : ""}`
          )
          .join("\n");
        return `${s.name} [${s.slug}] (${s.category}):\n  ${s.description}\n  Variants:\n${variants}`;
      })
      .join("\n\n");

    const profile = user ? buildClientProfile(user as unknown as Record<string, unknown>) : "Profile not available.";
    const history = buildClientHistory(tickets);
    const businessName = (user?.businessName as string) || "";
    const planName = subscription?.plan.name || "No plan";
    const deliveryDays = subscription?.plan.deliveryDays || 5;
    const freeCredits = user?.freeCredits || 0;
    const planCredits = subscription?.creditsRemaining || 0;
    const totalCredits = freeCredits + planCredits;
    const maxActiveReqs = subscription?.plan.maxActiveReqs || 0;

    // Extract recommendations from company analysis
    const analysis = user?.companyAnalysis as Record<string, unknown> | null;
    const selectedAnalysis = analysis?.selected as Record<string, unknown> | undefined;
    const recommendations = (selectedAnalysis?.recommendations as string[]) || [];

    // Find cheapest service in category
    let cheapestInCategory: number | null = null;
    if (category) {
      const catServices = services.filter((s: any) => s.category === category);
      for (const s of catServices) {
        for (const v of s.variants) {
          if (cheapestInCategory === null || v.creditCost < cheapestInCategory) {
            cheapestInCategory = v.creditCost;
          }
        }
      }
    }

    const pmHasCalendly = !!(user?.assignedPm as { calendlyUrl?: string | null } | null)?.calendlyUrl;

    const systemPrompt = buildSystemPrompt({
      catalog: catalogText,
      category,
      profile,
      history,
      businessName,
      planName,
      deliveryDays,
      totalCredits,
      activeTickets: activeTicketCount,
      maxActiveReqs,
      recommendations,
      cheapestInCategory,
      deliveryLanguage: (user?.deliveryLanguage as string) || "es",
      pmHasCalendly,
      lang,
    });

    // S1: Use native systemInstruction instead of injecting as user message
    // 8192: gemini-2.5-flash spends "thinking" tokens from this same budget,
    // so a low cap truncates the reply mid-response.
    const model = getGeminiModel({ systemInstruction: systemPrompt, maxOutputTokens: 8192 });

    // Limit to last 10 messages + the new one to avoid token overflow
    const recentMessages = messages.slice(-11);

    const geminiHistory = recentMessages.slice(0, -1).map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({
      history: geminiHistory,
    });

    const lastMessage = recentMessages[recentMessages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const response = result.response.text();

    return NextResponse.json({ message: response });
  } catch (err) {
    console.error("[WIZARD_CHAT]", err);
    return NextResponse.json({ error: t("api.error.internal", lang) }, { status: 500 });
  }
}
