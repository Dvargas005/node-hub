import { NextResponse } from "next/server";
import { createPortalSession } from "@/lib/stripe";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";

export async function POST() {
  const session = await requireAuth();

  const subscription = await db.subscription.findUnique({
    where: { userId: session.user.id },
  });

  if (!subscription?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No tienes una suscripción activa" },
      { status: 400 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const portalSession = await createPortalSession({
    stripeCustomerId: subscription.stripeCustomerId,
    returnUrl: `${baseUrl}/billing`,
  });

  if (!portalSession) {
    return NextResponse.json(
      { error: "Stripe no disponible" },
      { status: 503 }
    );
  }

  return NextResponse.json({ url: portalSession.url });
}
