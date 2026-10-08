import Stripe from "stripe";
import { db } from "@/lib/db";

/**
 * SEO add-ons: billed as a second line on the SAME Stripe subscription as the plan,
 * so a bundle (e.g. Growth + Full SEO, GEO & AEO) is one subscription, one invoice.
 *
 * Rules (Erich, 2026-10-01):
 * - Requires an active recurring plan. No setup fee. 3-month minimum (AddOn.minTermMonths).
 * - A plan that already includes a tier (Plan.includedAddOn) only pays the difference
 *   for a higher tier, and cannot buy its own tier or a lower one.
 * - Plan credits are untouched: the add-on is billed in dollars, not credits.
 */

type AddOnLike = {
  id: string;
  slug: string;
  name: string;
  priceMonthly: number;
  rank: number;
  minTermMonths: number;
  stripeProductId: string | null;
  stripePriceId: string | null;
  isActive: boolean;
};

type PlanLike = {
  isRecurring: boolean;
  includedAddOn: AddOnLike | null;
};

/** Monthly charge in cents for this add-on on this plan, or null if it can't be bought. */
export function addOnChargeFor(plan: PlanLike, addOn: AddOnLike): number | null {
  if (!plan.isRecurring || !addOn.isActive) return null;
  const included = plan.includedAddOn;
  if (included && included.rank >= addOn.rank) return null;
  return addOn.priceMonthly - (included?.priceMonthly ?? 0);
}

/**
 * The Stripe price for a subscription line. Full price uses the stored Price; a
 * difference charge (plan already includes a lower tier) uses inline price_data on
 * the same Product, so there is no extra Price object per plan to keep in sync.
 */
export function addOnStripePrice(
  plan: PlanLike,
  addOn: AddOnLike,
): { price: string } | { price_data: { currency: "usd"; product: string; unit_amount: number; recurring: { interval: "month" } } } {
  const charge = addOnChargeFor(plan, addOn);
  if (charge === null) throw new Error(`Add-on "${addOn.slug}" is not available on this plan`);
  if (!plan.includedAddOn) {
    if (!addOn.stripePriceId) throw new Error(`Add-on "${addOn.slug}" has no Stripe price. Run setup-seo-addons.ts.`);
    return { price: addOn.stripePriceId };
  }
  if (!addOn.stripeProductId) throw new Error(`Add-on "${addOn.slug}" has no Stripe product. Run setup-seo-addons.ts.`);
  return {
    price_data: { currency: "usd", product: addOn.stripeProductId, unit_amount: charge, recurring: { interval: "month" } },
  };
}

function productIdOf(item: Stripe.SubscriptionItem): string {
  const product = item.price.product;
  return typeof product === "string" ? product : product.id;
}

/** Splits a subscription's lines into the plan line and the add-on line (if any). */
export async function splitSubscriptionItems(sub: Stripe.Subscription) {
  const addOns = await db.addOn.findMany({ where: { stripeProductId: { not: null } } });
  const byProduct = new Map(addOns.map((a) => [a.stripeProductId as string, a]));
  let planItem: Stripe.SubscriptionItem | undefined;
  let addOnItem: Stripe.SubscriptionItem | undefined;
  let addOn: (typeof addOns)[number] | undefined;
  for (const item of sub.items.data) {
    const match = byProduct.get(productIdOf(item));
    if (match) {
      addOnItem = item;
      addOn = match;
    } else if (!planItem) {
      planItem = item;
    }
  }
  return { planItem, addOnItem, addOn };
}

/**
 * Mirrors the add-on line of a Stripe subscription into our DB. Stripe is the source
 * of truth, so this also picks up changes made by hand in the Stripe dashboard.
 */
export async function syncAddOnFromStripe(sub: Stripe.Subscription): Promise<void> {
  const row = await db.subscription.findFirst({ where: { stripeSubscriptionId: sub.id } });
  if (!row) return;
  const { addOnItem, addOn } = await splitSubscriptionItems(sub);

  if (!addOn || !addOnItem) {
    if (row.addOnId) {
      await db.subscription.update({
        where: { id: row.id },
        data: { addOnId: null, addOnStripeItemId: null, addOnMinTermEndsAt: null },
      });
      console.log(`[ADDON] Removed from ${sub.id}`);
    }
    return;
  }

  // The minimum term starts when an add-on first appears; moving between tiers keeps it.
  let minTermEndsAt = row.addOnMinTermEndsAt;
  if (!row.addOnId || !minTermEndsAt) {
    minTermEndsAt = new Date();
    minTermEndsAt.setMonth(minTermEndsAt.getMonth() + addOn.minTermMonths);
  }
  if (row.addOnId !== addOn.id || row.addOnStripeItemId !== addOnItem.id || row.addOnMinTermEndsAt?.getTime() !== minTermEndsAt.getTime()) {
    await db.subscription.update({
      where: { id: row.id },
      data: { addOnId: addOn.id, addOnStripeItemId: addOnItem.id, addOnMinTermEndsAt: minTermEndsAt },
    });
    console.log(`[ADDON] ${sub.id} -> ${addOn.slug}`);
  }
}

/**
 * After a plan change, make the add-on line match the new plan: drop it if the new
 * plan already includes that tier (e.g. upgrade to Dedicated Pro), or re-price it if
 * the included tier changed (e.g. Growth + Full SEO -> Dedicated Jump pays the difference).
 */
export async function reconcileAddOnAfterPlanChange(
  stripe: Stripe,
  stripeSubscriptionId: string,
  newPlan: PlanLike,
): Promise<"none" | "removed" | "repriced" | "unchanged"> {
  const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId, { expand: ["items.data.price"] });
  const { addOnItem, addOn } = await splitSubscriptionItems(sub);
  if (!addOnItem || !addOn) return "none";

  const charge = addOnChargeFor(newPlan, addOn);
  if (charge === null) {
    await stripe.subscriptionItems.del(addOnItem.id, { proration_behavior: "create_prorations" });
    return "removed";
  }
  if (addOnItem.price.unit_amount === charge) return "unchanged";
  await stripe.subscriptionItems.update(addOnItem.id, {
    ...addOnStripePrice(newPlan, addOn),
    proration_behavior: "create_prorations",
  });
  return "repriced";
}
