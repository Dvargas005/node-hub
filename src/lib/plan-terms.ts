/**
 * Two terms for Member / Growth / Pro (Erich, 2026-10-12, see docs/pricing-option-c/README.md):
 * - 12-month: the base slugs ("member", "growth", "pro"), 12-month commitment, billed monthly.
 * - Flexible: "<slug>-flex", 3-month minimum then month to month, 25% above the 12-month rate.
 *
 * Switching rules:
 * - Flexible to 12-month is allowed anytime. Same tier: the 12-month price starts next
 *   period and a new 12-month term starts then. Higher tier: normal upgrade, and the
 *   12-month term starts now.
 * - 12-month to Flexible is not self-service (contact support).
 * - Moving to a lower tier is not self-service on either term.
 * - Upgrades within the same term keep the original minimum-term end date.
 */

export const FLEX_SUFFIX = "-flex";
export const FLEX_MIN_TERM_MONTHS = 3;
export const ANNUAL_MIN_TERM_MONTHS = 12;
/** Flexible monthly price = 12-month price x this. Not a discount: the 12-month rate is the base. */
export const FLEX_PRICE_MULTIPLIER = 1.25;

const TIERS = ["member", "growth", "pro"] as const;

export const isFlexSlug = (slug: string) => slug.endsWith(FLEX_SUFFIX);
export const baseSlug = (slug: string) => (isFlexSlug(slug) ? slug.slice(0, -FLEX_SUFFIX.length) : slug);
export const flexSlug = (slug: string) => `${baseSlug(slug)}${FLEX_SUFFIX}`;

/** 0 = member, 1 = growth, 2 = pro; null for plans outside the two-term family. */
export function tierRank(slug: string): number | null {
  const i = (TIERS as readonly string[]).indexOf(baseSlug(slug));
  return i === -1 ? null : i;
}

interface PlanRef {
  slug: string;
  priceMonthly: number;
}

export type PlanChange =
  /** Prorated upgrade. `restartTermMonths` set = a new term of that length starts now. */
  | { kind: "upgrade"; restartTermMonths?: number }
  /** Same tier, Flexible to 12-month: new price from the next period, new 12-month term from then. */
  | { kind: "switch-to-annual" }
  | { kind: "blocked"; reason: string };

export function classifyPlanChange(current: PlanRef, target: PlanRef): PlanChange {
  const cur = tierRank(current.slug);
  const tgt = tierRank(target.slug);

  // Plans outside the Member/Growth/Pro family (Early Adopters, Dedicated): price decides, as before.
  if (cur === null || tgt === null) {
    return target.priceMonthly > current.priceMonthly
      ? { kind: "upgrade" }
      : { kind: "blocked", reason: "Only upgrades are supported. Contact support to downgrade." };
  }

  const curFlex = isFlexSlug(current.slug);
  const tgtFlex = isFlexSlug(target.slug);

  if (!curFlex && tgtFlex) {
    return { kind: "blocked", reason: "A 12-month plan can't move to the Flexible term. Contact support." };
  }
  if (tgt < cur) {
    return { kind: "blocked", reason: "Only upgrades are supported. Contact support to downgrade." };
  }
  if (tgt === cur) {
    return curFlex && !tgtFlex
      ? { kind: "switch-to-annual" }
      : { kind: "blocked", reason: "You are already on this plan." };
  }
  return curFlex && !tgtFlex ? { kind: "upgrade", restartTermMonths: ANNUAL_MIN_TERM_MONTHS } : { kind: "upgrade" };
}
