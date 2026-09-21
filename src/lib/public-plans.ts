import { db } from "@/lib/db";

export interface PublicPlan {
  slug: string;
  name: string;
  /** Dollars, not cents. */
  priceMonthly: number;
  setupFee: number;
  monthlyCredits: number;
  deliveryDays: number;
}

const PUBLIC_SLUGS = ["member", "growth", "pro"] as const;

/**
 * Member / Growth / Pro, read from the plans table, which checkout also reads.
 *
 * Marketing pages price from the DB rather than a literal so they can never
 * drift from what Stripe charges (the landing page's hardcoded copy did,
 * see CLAUDE.md "Precios"). Returns [] if the DB is unreachable so a page
 * renders without its pricing strip instead of failing the build.
 */
export async function getPublicPlans(): Promise<PublicPlan[]> {
  try {
    const rows = await db.plan.findMany({
      where: { slug: { in: [...PUBLIC_SLUGS] }, isActive: true },
    });
    return PUBLIC_SLUGS.map((slug) => rows.find((r) => r.slug === slug))
      .filter((r): r is NonNullable<typeof r> => Boolean(r))
      .map((r) => ({
        slug: r.slug,
        name: r.name.replace(/^N\.O\.D\.E\.\s*/, ""),
        priceMonthly: r.priceMonthly / 100,
        setupFee: r.setupFee / 100,
        monthlyCredits: r.monthlyCredits,
        deliveryDays: r.deliveryDays,
      }));
  } catch (err) {
    console.error("[PUBLIC_PLANS] Failed to load plans:", err);
    return [];
  }
}

export const formatUsd = (dollars: number) =>
  `$${dollars.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
