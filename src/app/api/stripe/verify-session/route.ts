import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import Stripe from "stripe";
import { requireApiRole } from "@/lib/api-auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(req: Request) {
  try {
    const { error, session: userSession } = await requireApiRole(["CLIENT"]);
    if (error) return error;

    const url = new URL(req.url);
    const sessionId = url.searchParams.get("session_id");
    if (!sessionId) {
      return NextResponse.json({ error: "session_id requerido" }, { status: 400 });
    }

    // Verificar con Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    if (checkoutSession.payment_status !== "paid") {
      return NextResponse.json({ success: false, status: checkoutSession.payment_status });
    }

    const userId = checkoutSession.metadata?.userId;
    const planSlug = checkoutSession.metadata?.planSlug;

    if (!userId || !planSlug) {
      return NextResponse.json({ error: "Metadata incompleta" }, { status: 400 });
    }

    // Verificar que el usuario es el correcto
    if (userId !== userSession!.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Verificar si ya tiene suscripción activa (el webhook ya procesó)
    const existingSub = await db.subscription.findUnique({ where: { userId } });
    if (existingSub && existingSub.status === "ACTIVE") {
      return NextResponse.json({ success: true, alreadyActive: true });
    }

    // El webhook no procesó — activar manualmente
    const plan = await db.plan.findUnique({ where: { slug: planSlug } });
    if (!plan) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 400 });
    }

    const stripeSubscription = checkoutSession.subscription as Stripe.Subscription;

    await db.subscription.upsert({
      where: { userId },
      create: {
        userId,
        planId: plan.id,
        stripeCustomerId: checkoutSession.customer as string,
        stripeSubscriptionId: stripeSubscription?.id || null,
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        creditsRemaining: plan.monthlyCredits + plan.bonusCredits,
      },
      update: {
        status: "ACTIVE",
        creditsRemaining: plan.monthlyCredits + plan.bonusCredits,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({ success: true, plan: planSlug });
  } catch (err: any) {
    console.error("[VERIFY_SESSION]", err);
    return NextResponse.json({ error: "Error al verificar pago" }, { status: 500 });
  }
}
