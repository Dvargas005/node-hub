import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const { error, session } = await requireApiRole(["CLIENT", "ADMIN", "PM"]);
  if (error || !session) return error;

  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe no disponible" }, { status: 503 });
    }

    const { planSlug } = await req.json();
    const userId = session.user.id;

    const plan = await db.plan.findUnique({ where: { slug: planSlug } });
    if (!plan || !plan.stripePriceId) {
      return NextResponse.json({ error: "Plan no encontrado o sin precio configurado" }, { status: 404 });
    }

    // Find or create Stripe customer
    const existingSub = await db.subscription.findUnique({
      where: { userId },
      select: { stripeCustomerId: true },
    });

    let customerId = existingSub?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name,
        metadata: { userId },
      });
      customerId = customer.id;
    }

    // Build line items
    const lineItems: { price: string; quantity: number }[] = [
      { price: plan.stripePriceId, quantity: 1 },
    ];

    // Add setup fee as one-time line item
    if (plan.setupFeeStripePriceId) {
      lineItems.push({ price: plan.setupFeeStripePriceId, quantity: 1 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: lineItems,
      success_url: `${baseUrl}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/billing?checkout=canceled`,
      metadata: { userId, planSlug },
      subscription_data: {
        metadata: { userId, planSlug },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("[STRIPE_CHECKOUT]", err);
    return NextResponse.json({ error: "Error al crear sesión de pago" }, { status: 500 });
  }
}
