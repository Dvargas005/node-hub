import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { centsPerCreditFor, PLAN_CENTS_PER_CREDIT } from "@/lib/credit-pricing";

export async function POST(req: NextRequest) {
  const { error, session } = await requireApiRole(["CLIENT", "ADMIN", "PM"]);
  if (error || !session) return error;

  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe no disponible" }, { status: 503 });
    }

    const { packId } = await req.json();
    const userId = session.user.id;

    const pack = await db.creditPack.findUnique({ where: { id: packId } });
    if (!pack || !pack.stripePriceId || !pack.isActive) {
      return NextResponse.json({ error: "Pack no encontrado" }, { status: 404 });
    }

    // Find or create customer (check User first, then Subscription, then Stripe)
    const userRecord = await db.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true, email: true, name: true },
    });
    const existingSub = await db.subscription.findUnique({
      where: { userId },
      select: { stripeCustomerId: true, plan: { select: { slug: true } } },
    });

    let customerId = userRecord?.stripeCustomerId || existingSub?.stripeCustomerId || undefined;
    if (!customerId) {
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
      await db.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Pack Prices in Stripe are 1:1. On demand buyers pay their own rate, charged inline.
    const centsPerCredit = centsPerCreditFor(existingSub?.plan.slug);
    const lineItem =
      centsPerCredit === PLAN_CENTS_PER_CREDIT
        ? { price: pack.stripePriceId, quantity: 1 }
        : {
            price_data: {
              currency: "usd",
              product_data: {
                name: `N.O.D.E. credits: ${pack.credits}`,
                description: `${pack.credits} credits at $${(centsPerCredit / 100).toFixed(2)} each`,
              },
              unit_amount: pack.credits * centsPerCredit,
            },
            quantity: 1,
          };

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      line_items: [lineItem],
      success_url: `${baseUrl}/dashboard?pack=success`,
      cancel_url: `${baseUrl}/billing`,
      metadata: { userId, packId: pack.id, credits: String(pack.credits), type: "credit_pack" },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("[STRIPE_CREDIT_PACK]", err);
    return NextResponse.json({ error: "Error al crear sesión de pago" }, { status: 500 });
  }
}
