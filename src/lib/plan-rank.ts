/**
 * Unified plan ranking for service-variant `minPlan` gating.
 *
 * Regular tiers: member < growth < pro.
 * Dedicated retainers are premium and rank at/above their regular equivalents
 * so a dedicated subscriber is never wrongly blocked from a gated service:
 *   dedicated-light ≈ growth, dedicated-jump ≈ pro, dedicated-pro = top.
 *
 * An unknown / missing slug ranks 0 (below everything) so an unrecognized plan
 * can never silently pass a gate.
 */
export const PLAN_RANK: Record<string, number> = {
  member: 1,
  growth: 2,
  pro: 3,
  "dedicated-light": 2,
  "dedicated-jump": 3,
  "dedicated-pro": 4,
};

export function planRank(slug: string | null | undefined): number {
  if (!slug) return 0;
  return PLAN_RANK[slug] ?? 0;
}

/** True if a subscriber on `planSlug` meets a variant's `minPlan` requirement. */
export function meetsMinPlan(
  planSlug: string | null | undefined,
  minPlan: string | null | undefined,
): boolean {
  if (!minPlan) return true;
  return planRank(planSlug) >= planRank(minPlan);
}
