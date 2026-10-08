import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { isInMinTerm } from "@/lib/commitment";

/**
 * Cancel the caller's plan at the end of the current period.
 *
 * - Blocked while the plan's minimum commitment is running (Subscription.minTermEndsAt),
 *   and while an SEO add-on is inside its own minimum (addOnMinTermEndsAt).
 * - Early exit is handled by support, not here.
 * Cancellation is switched off in the Stripe customer portal, so this is the only
 * self-service way to cancel.
 */
export async function POST() {
  const { error, session } = await requireApiRole(["CLIENT", "ADMIN", "PM"]);
  if (error || !session) return error;

  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
    }

    const userId = session.user.id;
    const sub = await db.subscription.findUnique({
      where: { userId },
      include: { plan: true, addOn: true },
    });
    if (!sub || sub.status !== "ACTIVE" || !sub.stripeSubscriptionId) {
      return NextResponse.json({ error: "There is no active monthly plan to cancel." }, { status: 400 });
    }

    if (isInMinTerm(sub.minTermEndsAt)) {
      return NextResponse.json(
        {
          error: `The ${sub.plan.name} plan has a ${sub.plan.minTermMonths}-month commitment. It can be canceled after ${sub.minTermEndsAt!.toLocaleDateString("en-US")}. To end it earlier, contact support.`,
          code: "IN_MIN_TERM",
          minTermEndsAt: sub.minTermEndsAt!.toISOString(),
        },
        { status: 400 },
      );
    }
    if (sub.addOn && isInMinTerm(sub.addOnMinTermEndsAt)) {
      return NextResponse.json(
        {
          error: `The ${sub.addOn.name} add-on has a ${sub.addOn.minTermMonths}-month minimum. The plan can be canceled after ${sub.addOnMinTermEndsAt!.toLocaleDateString("en-US")}. To end it earlier, contact support.`,
          code: "IN_MIN_TERM",
          minTermEndsAt: sub.addOnMinTermEndsAt!.toISOString(),
        },
        { status: 400 },
      );
    }

    await stripe.subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: true });

    const endsAt = sub.currentPeriodEnd;
    console.log(`[STRIPE_CANCEL] ${sub.stripeSubscriptionId} set to cancel at period end (${endsAt.toISOString()}) by ${userId}`);
    await db.notification.create({
      data: {
        userId,
        title: "Plan cancellation scheduled",
        message: `Your ${sub.plan.name} plan stays active until ${endsAt.toLocaleDateString("en-US")} and will not renew.`,
        type: "payment",
        link: "/billing",
      },
    });

    return NextResponse.json({ ok: true, endsAt: endsAt.toISOString() });
  } catch (err) {
    console.error("[STRIPE_CANCEL]", err);
    const message =
      err instanceof Stripe.errors.StripeError
        ? `Stripe error: ${err.message}`
        : err instanceof Error
        ? err.message
        : "Failed to cancel the plan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
