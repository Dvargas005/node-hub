import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { addOnChargeFor, addOnStripePrice, splitSubscriptionItems, syncAddOnFromStripe } from "@/lib/addons";

/**
 * Add, change, or remove the SEO add-on on an existing subscription.
 * Body: { addOnSlug: string | null }  (null = remove)
 *
 * - Requires an ACTIVE recurring plan with a Stripe subscription.
 * - Adding or moving up is invoiced right away (prorated to the end of the period).
 * - Removing or moving down is blocked until the 3-month minimum has passed; removal
 *   takes effect immediately with no refund for the current period.
 * The Stripe customer portal cannot edit a subscription with two lines, so this is
 * the only self-service path for add-on changes.
 */
export async function POST(req: NextRequest) {
  const { error, session } = await requireApiRole(["CLIENT", "ADMIN", "PM"]);
  if (error || !session) return error;

  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
    }

    const { addOnSlug } = (await req.json()) as { addOnSlug: string | null };
    const userId = session.user.id;

    const sub = await db.subscription.findUnique({
      where: { userId },
      include: { plan: { include: { includedAddOn: true } }, addOn: true },
    });
    if (!sub || sub.status !== "ACTIVE" || !sub.stripeSubscriptionId || !sub.plan.isRecurring) {
      return NextResponse.json({ error: "SEO add-ons require an active monthly plan." }, { status: 400 });
    }

    const target = addOnSlug ? await db.addOn.findUnique({ where: { slug: addOnSlug } }) : null;
    if (addOnSlug && (!target || addOnChargeFor(sub.plan, target) === null)) {
      return NextResponse.json(
        { error: `The "${addOnSlug}" add-on is not available with the ${sub.plan.name} plan.` },
        { status: 400 },
      );
    }

    const current = sub.addOn;
    if ((current?.id ?? null) === (target?.id ?? null)) {
      return NextResponse.json({ error: "No change requested." }, { status: 400 });
    }

    // Minimum term: no removal or downgrade before addOnMinTermEndsAt.
    const isDownOrRemove = current && (!target || target.rank < current.rank);
    if (isDownOrRemove && sub.addOnMinTermEndsAt && sub.addOnMinTermEndsAt > new Date()) {
      return NextResponse.json(
        {
          error: `The ${current.name} add-on has a 3-month minimum. It can be removed or changed to a lower tier after ${sub.addOnMinTermEndsAt.toLocaleDateString("en-US")}.`,
          minTermEndsAt: sub.addOnMinTermEndsAt.toISOString(),
        },
        { status: 400 },
      );
    }

    const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
    const { addOnItem } = await splitSubscriptionItems(stripeSub);

    if (!target) {
      if (addOnItem) {
        await stripe.subscriptionItems.del(addOnItem.id, { proration_behavior: "none" });
      }
    } else {
      const price = addOnStripePrice(sub.plan, target);
      const params = { ...price, proration_behavior: "always_invoice" as const };
      if (addOnItem) {
        await stripe.subscriptionItems.update(addOnItem.id, params);
      } else {
        await stripe.subscriptionItems.create({ subscription: sub.stripeSubscriptionId, ...params });
      }
    }

    // Mirror Stripe into the DB now; the customer.subscription.updated webhook does the same.
    await syncAddOnFromStripe(await stripe.subscriptions.retrieve(sub.stripeSubscriptionId));

    const message = target
      ? `${target.name} added to your ${sub.plan.name} plan.`
      : `${current!.name} removed from your plan.`;
    await db.notification.create({
      data: { userId, title: "SEO add-on updated", message, type: "payment", link: "/billing" },
    });

    return NextResponse.json({ ok: true, addOn: target?.slug ?? null, message });
  } catch (err) {
    console.error("[STRIPE_ADDON]", err);
    const message =
      err instanceof Stripe.errors.StripeError
        ? `Stripe error: ${err.message}`
        : err instanceof Error
        ? err.message
        : "Failed to update the add-on";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
