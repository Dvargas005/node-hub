/**
 * What one extra credit costs, by the buyer's plan (Erich, 2026-10-12):
 * - On demand ("starter"): $2.75 per credit, above every plan's per-credit cost, so the
 *   no-commitment option never undercuts the plans.
 * - Any paid plan: $1.00 per credit (1:1), the extra-credit rate plan subscribers already had.
 *
 * The fixed credit packs keep their $1-per-credit Stripe Prices; On demand buyers are charged
 * with inline price_data at the On demand rate instead.
 */
export const ON_DEMAND_PLAN_SLUG = "starter";
export const ON_DEMAND_CENTS_PER_CREDIT = 275;
export const PLAN_CENTS_PER_CREDIT = 100;

export function centsPerCreditFor(planSlug: string | null | undefined): number {
  return planSlug === ON_DEMAND_PLAN_SLUG ? ON_DEMAND_CENTS_PER_CREDIT : PLAN_CENTS_PER_CREDIT;
}
