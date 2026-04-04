import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

// Service suggestions per priority level per category
// high = priority 4-5, medium = priority 3, low = 1-2 (nothing)
const suggestions: Record<string, Record<string, { month: number; serviceSlug: string }[]>> = {
  high: {
    DESIGN: [
      { month: 1, serviceSlug: "brand-starter" },
      { month: 2, serviceSlug: "social-pack" },
      { month: 3, serviceSlug: "flyer-promo" },
    ],
    WEB: [
      { month: 1, serviceSlug: "landing-page" },
      { month: 2, serviceSlug: "seo-foundation" },
      { month: 3, serviceSlug: "contact-form" },
    ],
    MARKETING: [
      { month: 1, serviceSlug: "profile-setup" },
      { month: 2, serviceSlug: "content-pack" },
      { month: 3, serviceSlug: "promo-campaign" },
    ],
  },
  medium: {
    DESIGN: [{ month: 2, serviceSlug: "social-pack" }],
    WEB: [{ month: 2, serviceSlug: "google-presence" }],
    MARKETING: [{ month: 2, serviceSlug: "content-pack" }],
  },
};

function getPriorityLevel(val: number | undefined): "high" | "medium" | "low" {
  if (!val) return "low";
  if (val >= 4) return "high";
  if (val === 3) return "medium";
  return "low";
}

export async function GET() {
  const { error, session } = await requireApiRole(["CLIENT"]);
  if (error || !session) return error;

  try {
    const userId = session.user.id;

    const [user, plans, services] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: { priorities: true, companyAnalysis: true },
      }),
      db.plan.findMany({ where: { isActive: true }, orderBy: { priceMonthly: "asc" } }),
      db.service.findMany({
        where: { isActive: true },
        include: { variants: { where: { isActive: true }, orderBy: { creditCost: "asc" } } },
      }),
    ]);

    const priorities = user?.priorities as Record<string, number> | null;

    // If no priorities, return empty
    if (!priorities || Object.keys(priorities).length === 0) {
      return NextResponse.json({ projections: null, reason: "no_priorities" });
    }

    // Map category to priority level
    const catMap: Record<string, string> = { design: "DESIGN", web: "WEB", marketing: "MARKETING" };
    const levels: Record<string, "high" | "medium" | "low"> = {};
    for (const [key, cat] of Object.entries(catMap)) {
      levels[cat] = getPriorityLevel(priorities[key]);
    }

    // Build slug → cheapest variant lookup
    const serviceBySlug: Record<string, { name: string; category: string; variantName: string; creditCost: number }> = {};
    for (const svc of services) {
      if (svc.variants.length > 0) {
        const v = svc.variants[0]; // cheapest (sorted by creditCost asc)
        serviceBySlug[svc.slug] = {
          name: svc.name,
          category: svc.category,
          variantName: v.name,
          creditCost: v.creditCost,
        };
      }
    }

    // Collect suggested services per month
    const monthlyServices: Record<number, { name: string; credits: number; category: string }[]> = { 1: [], 2: [], 3: [] };

    for (const [cat, level] of Object.entries(levels)) {
      if (level === "low") continue;
      const catSuggestions = suggestions[level]?.[cat] || [];
      for (const s of catSuggestions) {
        const svc = serviceBySlug[s.serviceSlug];
        if (svc) {
          monthlyServices[s.month]?.push({ name: svc.name, credits: svc.creditCost, category: svc.category });
        }
      }
    }

    // Check company analysis recommendations for extra services
    const analysis = user?.companyAnalysis as Record<string, unknown> | null;
    const selected = analysis?.selected as Record<string, unknown> | undefined;
    const recs = (selected?.recommendations as string[]) || [];
    // Add one service from recommendations to month 3 if not already there
    if (recs.length > 0) {
      const recLower = recs[0].toLowerCase();
      let recCat = "DESIGN";
      if (/web|landing|seo|sitio/.test(recLower)) recCat = "WEB";
      else if (/marketing|contenido|campaña|social|redes/.test(recLower)) recCat = "MARKETING";
      // Find a service in that category not already suggested
      const existingSlugs = new Set(
        Object.values(monthlyServices).flat().map((s: any) => s.name)
      );
      for (const svc of services) {
        if (svc.category === recCat && !existingSlugs.has(svc.name) && svc.variants.length > 0) {
          monthlyServices[3].push({ name: svc.name, credits: svc.variants[0].creditCost, category: svc.category });
          break;
        }
      }
    }

    // Generate projection for each plan
    const projections = plans.map((plan: any) => {
      const mc = plan.monthlyCredits + (plan.bonusCredits || 0);
      const months = [1, 2, 3].map((m: any) => {
        const svcs = monthlyServices[m] || [];
        const total = svcs.reduce((sum: any, s: any) => sum + s.credits, 0);
        return { month: m, suggestedServices: svcs, totalCredits: total, remaining: mc - total };
      });

      const shortfalls = months.filter((m: any) => m.remaining < 0).length;
      const verdict = shortfalls >= 2 ? "insuficiente" : shortfalls === 1 ? "justo" : "holgado";

      return {
        planSlug: plan.slug,
        planName: plan.name,
        priceMonthly: plan.priceMonthly,
        monthlyCredits: mc,
        months,
        totalCost3Months: plan.priceMonthly * 3,
        verdict,
      };
    });

    // Recommended = cheapest plan that isn't "insuficiente"
    const recommended = projections.find((p: any) => p.verdict !== "insuficiente")?.planSlug || null;

    return NextResponse.json({ projections, recommended });
  } catch (err) {
    console.error("[BILLING_PROJECTION]", err);
    return NextResponse.json({ error: "Error al calcular proyección" }, { status: 500 });
  }
}
