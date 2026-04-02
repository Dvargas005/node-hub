import { NextResponse } from "next/server";
import { createPortalSession } from "@/lib/stripe";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function POST() {
  const { error, session } = await requireApiRole(["CLIENT", "ADMIN", "PM"]);
  if (error || !session) return error;

  try {
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
  } catch (err) {
    console.error("[STRIPE_PORTAL]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
