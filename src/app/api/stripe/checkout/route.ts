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

    // If user has ACTIVE subscription → upgrade flow (proration + setup diff + carry credits)
    const existingSub = await db.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
    if (existingSub?.status === "ACTIVE" && existingSub.stripeSubscriptionId) {
      // Same plan: redirect to portal (manage payment method, etc.)
      if (existingSub.planId === plan.id) {
        const portal = await stripe.billingPortal.sessions.create({
          customer: existingSub.stripeCustomerId || undefined,
          return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/billing`,
        });
        return NextResponse.json({ url: portal.url });
      }

      // Downgrade not supported via self-service
      if (plan.priceMonthly <= existingSub.plan.priceMonthly) {
        return NextResponse.json(
          { error: "Only upgrades are supported. Contact support to downgrade." },
          { status: 400 },
        );
      }

      // === UPGRADE FLOW ===
      try {
        const stripeSub = await stripe.subscriptions.retrieve(existingSub.stripeSubscriptionId);
        const currentItemId = stripeSub.items.data[0]?.id;
        if (!currentItemId) {
          return NextResponse.json({ error: "Subscription item not found" }, { status: 500 });
        }

        const customerId = existingSub.stripeCustomerId || (stripeSub.customer as string);

        // 1. Update subscription with proration (Stripe charges the prorated diff automatically)
        await stripe.subscriptions.update(existingSub.stripeSubscriptionId, {
          items: [{ id: currentItemId, price: plan.stripePriceId! }],
          proration_behavior: "create_prorations",
        });

        // 2. Charge setup fee difference as one-time invoice item
        const setupFeeDifference = (plan.setupFee || 0) - (existingSub.plan.setupFee || 0);
        if (setupFeeDifference > 0) {
          await stripe.invoiceItems.create({
            customer: customerId,
            amount: setupFeeDifference,
            currency: "usd",
            description: `Setup fee upgrade: ${existingSub.plan.name} → ${plan.name} (difference: $${setupFeeDifference / 100})`,
          });
          const invoice = await stripe.invoices.create({
            customer: customerId,
            auto_advance: true,
          });
          if (invoice.id) {
            await stripe.invoices.pay(invoice.id);
          }
        }

        // 3. Update DB: keep unused credits + add new plan credits
        const previousCredits = existingSub.creditsRemaining;
        const newTotalCredits = previousCredits + plan.monthlyCredits + plan.bonusCredits;

        await db.subscription.update({
          where: { id: existingSub.id },
          data: {
            planId: plan.id,
            creditsRemaining: newTotalCredits,
          },
        });

        // 4. Notify
        await db.notification.create({
          data: {
            userId,
            title: "Plan upgraded!",
            message: `Upgraded to ${plan.name}. ${previousCredits} unused credits carried over + ${plan.monthlyCredits + plan.bonusCredits} new = ${newTotalCredits} total.`,
            type: "payment",
            link: "/billing",
          },
        });

        return NextResponse.json({
          upgraded: true,
          plan: plan.name,
          previousCredits,
          newPlanCredits: plan.monthlyCredits + plan.bonusCredits,
          totalCredits: newTotalCredits,
          setupFeeDifference: setupFeeDifference / 100,
        });
      } catch (upgradeErr) {
        console.error("[STRIPE_UPGRADE]", upgradeErr);
        return NextResponse.json({ error: "Upgrade failed" }, { status: 500 });
      }
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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // ── ONE-TIME plan (Starter) — mode: "payment", no subscription, no setup fee
    if (!plan.isRecurring) {
      const oneTimeParams: Stripe.Checkout.SessionCreateParams = {
        mode: "payment",
        customer: customerId,
        line_items: [{ price: plan.stripePriceId, quantity: 1 }],
        success_url: `${baseUrl}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/billing?checkout=canceled`,
        metadata: { userId, planSlug, type: "starter_plan" },
      };
      const oneTimeSession = await stripe.checkout.sessions.create(oneTimeParams);
      return NextResponse.json({ url: oneTimeSession.url });
    }

    // ── Recurring plan flow (Member, Growth, Pro)

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
