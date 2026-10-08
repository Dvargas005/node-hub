/**
 * Minimum commitment on a plan (Plan.minTermMonths): 12 months on Member, Growth
 * and Pro, 3 months on Dedicated.
 *
 * Rules (Erich, 2026-10-08):
 * - The term starts with the first paid period and is billed monthly.
 * - Once it has passed, the plan continues monthly and can be canceled at any time.
 * - Early exit is not self-service: the client contacts support and we decide.
 *   Cancellation is switched off in the Stripe customer portal, so
 *   POST /api/stripe/cancel is the only self-service path and it checks the term.
 */

/** Earliest date a subscription that started on `periodStart` may be canceled, or null if the plan has no term. */
export function minTermEndFor(periodStart: Date, minTermMonths: number): Date | null {
  if (minTermMonths <= 0) return null;
  const end = new Date(periodStart);
  end.setUTCMonth(end.getUTCMonth() + minTermMonths);
  return end;
}

export function isInMinTerm(minTermEndsAt: Date | null | undefined, now: Date = new Date()): boolean {
  return !!minTermEndsAt && minTermEndsAt > now;
}

/** Shown on Stripe Checkout next to the pay button, and reused in the activation email. */
export function commitmentNotice(minTermMonths: number): string {
  return `${minTermMonths}-month commitment, billed monthly. After that, your plan continues monthly and you can cancel at any time.`;
}
