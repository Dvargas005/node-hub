import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

// Ordered service pools per category — setup first, then recurring, then growth
const servicePools: Record<string, string[]> = {
  DESIGN: ["brand-starter", "social-pack", "flyer-promo", "business-kit"],
  WEB: ["landing-page", "seo-foundation", "google-presence", "contact-form"],
  MARKETING: ["profile-setup", "content-pack", "promo-campaign", "whatsapp-business"],
};

// Taglines per plan
const planTaglines: Record<string, { fresh: string; returning: string }> = {
  member: {
    fresh: "Ideal para empezar con lo esencial",
    returning: "Mantén tu presencia con lo básico",
  },
  growth: {
    fresh: "La base digital completa de tu negocio",
    returning: "Crece con servicios recurrentes",
  },
  pro: {
    fresh: "Todo lo anterior, más rápido, y con extras",
    returning: "Máxima velocidad y cobertura total",
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

    const [user, plans, services, completedTickets] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: { priorities: true, companyAnalysis: true },
      }),
      db.plan.findMany({ where: { isActive: true }, orderBy: { priceMonthly: "asc" } }),
      db.service.findMany({
        where: { isActive: true },
        include: { variants: { where: { isActive: true }, orderBy: { creditCost: "asc" } } },
      }),
      db.ticket.findMany({
        where: { userId, status: "COMPLETED" },
        select: { variant: { select: { service: { select: { slug: true } } } } },
      }),
    ]);

    const priorities = user?.priorities as Record<string, number> | null;
    if (!priorities || Object.keys(priorities).length === 0) {
      return NextResponse.json({ projections: null, reason: "no_priorities" });
    }

    // Completed service slugs to exclude
    const completedSlugs = new Set(completedTickets.map((t: any) => t.variant.service.slug));
    const hasCompletedSetup = completedSlugs.size > 0;

    // Build slug → service info lookup
    const serviceBySlug: Record<string, { name: string; category: string; creditCost: number }> = {};
    for (const svc of services) {
      if (svc.variants.length > 0) {
        serviceBySlug[svc.slug] = {
          name: svc.name,
          category: svc.category,
          creditCost: svc.variants[0].creditCost,
        };
      }
    }

    // Build priority-ordered list of services (excluding completed ones)
    const catMap: Record<string, string> = { design: "DESIGN", web: "WEB", marketing: "MARKETING" };
    const catPriorities: { cat: string; level: "high" | "medium" | "low"; priority: number }[] = [];
    for (const [key, cat] of Object.entries(catMap)) {
      const p = priorities[key] || 0;
      catPriorities.push({ cat, level: getPriorityLevel(p), priority: p });
    }
    // Sort by priority descending so highest-priority categories get services first
    catPriorities.sort((a: any, b: any) => b.priority - a.priority);

    // Build a master pool of available services sorted by priority
    const availableServices: { slug: string; name: string; credits: number; category: string; phase: number }[] = [];
    for (const { cat, level } of catPriorities) {
      if (level === "low") continue;
      const pool = servicePools[cat] || [];
      const filtered = pool.filter((slug: any) => !completedSlugs.has(slug) && serviceBySlug[slug]);
      let phase = 1; // month assignment: setup=1, recurring=2, growth=3
      for (const slug of filtered) {
        const svc = serviceBySlug[slug];
        availableServices.push({ slug, name: svc.name, credits: svc.creditCost, category: svc.category, phase });
        phase = Math.min(phase + 1, 3);
      }
    }

    // If completed setup, shift all phases down (recurring becomes month 1)
    if (hasCompletedSetup) {
      for (const s of availableServices) {
        s.phase = Math.max(1, s.phase - 1);
      }
    }

    // For each plan, greedily fill months with what fits
    const projections = plans.map((plan: any) => {
      const mc = plan.monthlyCredits + (plan.bonusCredits || 0);
      const months: { month: number; suggestedServices: { name: string; credits: number; category: string }[]; totalCredits: number; remaining: number }[] = [];
      const used = new Set<string>();

      for (const m of [1, 2, 3]) {
        const svcs: { name: string; credits: number; category: string }[] = [];
        let budget = mc;

        // First pass: add services in their natural phase
        for (const s of availableServices) {
          if (used.has(s.slug) || s.phase !== m) continue;
          if (s.credits <= budget) {
            svcs.push({ name: s.name, credits: s.credits, category: s.category });
            budget -= s.credits;
            used.add(s.slug);
          }
        }

        // Second pass: fill remaining budget with any unused service
        for (const s of availableServices) {
          if (used.has(s.slug)) continue;
          if (s.credits <= budget) {
            svcs.push({ name: s.name, credits: s.credits, category: s.category });
            budget -= s.credits;
            used.add(s.slug);
          }
        }

        const total = svcs.reduce((sum: any, s: any) => sum + s.credits, 0);
        months.push({ month: m, suggestedServices: svcs, totalCredits: total, remaining: mc - total });
      }

      const totalServices = months.reduce((sum: any, m: any) => sum + m.suggestedServices.length, 0);
      const allAvailable = availableServices.length;
      const coverage = allAvailable > 0 ? totalServices / allAvailable : 1;

      const verdict = coverage >= 0.8 ? "holgado" : coverage >= 0.5 ? "justo" : "insuficiente";

      const tagline = planTaglines[plan.slug] || planTaglines.member;

      return {
        planSlug: plan.slug,
        planName: plan.name,
        priceMonthly: plan.priceMonthly,
        monthlyCredits: mc,
        tagline: hasCompletedSetup ? tagline.returning : tagline.fresh,
        months,
        totalCost3Months: plan.priceMonthly * 3,
        verdict,
      };
    });

    const recommended = projections.find((p: any) => p.verdict !== "insuficiente")?.planSlug || null;

    return NextResponse.json({ projections, recommended, hasCompletedSetup });
  } catch (err) {
    console.error("[BILLING_PROJECTION]", err);
    return NextResponse.json({ error: "Error al calcular proyección" }, { status: 500 });
  }
}
