import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const { error, session } = await requireApiRole(["CLIENT", "ADMIN", "PM"]);
  if (error || !session) return error;

  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe no disponible" }, { status: 503 });
    }

    const { planSlug, promoCode } = await req.json();
    const userId = session.user.id;

    const plan = await db.plan.findUnique({ where: { slug: planSlug } });
    if (!plan || !plan.stripePriceId) {
      return NextResponse.json({ error: "Plan no encontrado o sin precio configurado" }, { status: 404 });
    }

    // C1: If user already has ACTIVE subscription, redirect to portal
    const existingSub = await db.subscription.findUnique({ where: { userId } });
    if (existingSub?.status === "ACTIVE" && existingSub.stripeCustomerId) {
      const portal = await stripe.billingPortal.sessions.create({
        customer: existingSub.stripeCustomerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/billing`,
      });
      return NextResponse.json({ url: portal.url });
    }

    // I17: Find or create Stripe customer — check User.stripeCustomerId first, then Stripe, then create
    const userRecord = await db.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true, email: true, name: true },
    });

    let customerId = userRecord?.stripeCustomerId || existingSub?.stripeCustomerId || undefined;

    if (!customerId) {
      // Search Stripe by email before creating
      const existing = await stripe.customers.list({ email: userRecord!.email, limit: 1 });
      if (existing.data.length > 0) {
        customerId = existing.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: userRecord!.email,
          name: userRecord!.name,
          metadata: { userId },
        });
        customerId = customer.id;
      }
      // Save immediately
      await db.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
    }

    // Build line items
    const lineItems: { price: string; quantity: number }[] = [
      { price: plan.stripePriceId, quantity: 1 },
    ];

    // I16 + REGLA 2: Setup fee with 3-month reactivation logic
    let chargeSetupFee = true;
    if (existingSub) {
      if (existingSub.status === "ACTIVE") {
        chargeSetupFee = false;
      } else if (existingSub.status === "CANCELED") {
        const canceledAt = existingSub.canceledAt || existingSub.updatedAt;
        const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        chargeSetupFee = canceledAt < threeMonthsAgo;
      }
    }

    if (chargeSetupFee && plan.setupFeeStripePriceId) {
      lineItems.push({ price: plan.setupFeeStripePriceId, quantity: 1 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const checkoutParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      customer: customerId,
      line_items: lineItems,
      success_url: `${baseUrl}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/billing?checkout=canceled`,
      metadata: { userId, planSlug },
      subscription_data: {
        metadata: { userId, planSlug },
      },
    };

    // Apply promo code if provided, otherwise allow manual entry in Stripe Checkout
    if (promoCode) {
      const promotionCodes = await stripe.promotionCodes.list({ code: promoCode, active: true, limit: 1 });
      if (promotionCodes.data.length > 0) {
        checkoutParams.discounts = [{ promotion_code: promotionCodes.data[0].id }];
      }
    }
    if (!checkoutParams.discounts) {
      checkoutParams.allow_promotion_codes = true;
    }

    const checkoutSession = await stripe.checkout.sessions.create(checkoutParams);

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("[STRIPE_CHECKOUT]", err);
    return NextResponse.json({ error: "Error al crear sesión de pago" }, { status: 500 });
  }
}
