import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

const MIN_CREDITS = 5;
const MAX_CREDITS = 9999;

export async function POST(req: NextRequest) {
  const { error, session } = await requireApiRole(["CLIENT"]);
  if (error || !session) return error;

  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe not available" }, { status: 503 });
    }

    const { amount } = await req.json();
    const credits = Math.floor(Number(amount));

    if (!Number.isFinite(credits) || credits < MIN_CREDITS || credits > MAX_CREDITS) {
      return NextResponse.json(
        { error: `Amount must be between ${MIN_CREDITS} and ${MAX_CREDITS}` },
        { status: 400 },
      );
    }

    const userId = session.user.id;

    // Active subscription required
    const subscription = await db.subscription.findUnique({ where: { userId } });
    if (!subscription || subscription.status !== "ACTIVE") {
      return NextResponse.json({ error: "Active subscription required" }, { status: 400 });
    }

    // Resolve / create Stripe customer
    const userRecord = await db.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true, email: true, name: true },
    });

    let customerId = userRecord?.stripeCustomerId || subscription.stripeCustomerId || undefined;
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

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${credits} Credits — N.O.D.E.`,
              description: `Custom credit pack: ${credits} credits (1:1)`,
            },
            unit_amount: credits * 100,
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/billing?checkout=success&credits=${credits}`,
      cancel_url: `${baseUrl}/billing`,
      metadata: {
        userId,
        type: "credit_pack_custom",
        credits: String(credits),
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("[CREDIT_PACK_CUSTOM]", err);
    return NextResponse.json({ error: "Error creating checkout" }, { status: 500 });
  }
}
