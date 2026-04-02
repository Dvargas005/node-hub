import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/stripe";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const { error, session } = await requireApiRole(["CLIENT", "ADMIN", "PM"]);
  if (error || !session) return error;

  try {
    const { planSlug } = await req.json();

    const plan = await db.plan.findUnique({ where: { slug: planSlug } });
    if (!plan) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    if (!plan.stripePriceId) {
      return NextResponse.json(
        { error: "Stripe no configurado para este plan" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const checkoutSession = await createCheckoutSession({
      userId: session.user.id,
      email: session.user.email,
      planSlug: plan.slug,
      stripePriceId: plan.stripePriceId,
      successUrl: `${baseUrl}/billing?success=true`,
      cancelUrl: `${baseUrl}/billing?canceled=true`,
    });

    if (!checkoutSession) {
      return NextResponse.json(
        { error: "Stripe no disponible" },
        { status: 503 }
      );
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("[STRIPE_CHECKOUT]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
