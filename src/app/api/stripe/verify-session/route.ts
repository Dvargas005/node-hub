import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { requireApiRole } from "@/lib/api-auth";
import Stripe from "stripe";

export async function GET(req: Request) {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe no disponible" }, { status: 503 });
    }

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

    // C4: Reject old sessions (> 1 hour)
    if (Date.now() - checkoutSession.created * 1000 > 3600000) {
      return NextResponse.json({ error: "Session expirada" }, { status: 400 });
    }

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

    // C4: Verify Stripe subscription is not canceled/unpaid
    const stripeSub = checkoutSession.subscription as Stripe.Subscription;
    if (stripeSub && ["canceled", "unpaid"].includes(stripeSub.status)) {
      return NextResponse.json({ error: "Suscripción no activa en Stripe" }, { status: 400 });
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

    // I18: Read actual period dates from Stripe subscription
    let periodStart = new Date();
    let periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    if (stripeSub?.id) {
      try {
        const fullSub = await stripe.subscriptions.retrieve(stripeSub.id, { expand: ["items.data"] });
        const item = fullSub.items.data[0];
        if (item) {
          periodStart = new Date(item.current_period_start * 1000);
          periodEnd = new Date(item.current_period_end * 1000);
        }
      } catch (e) {
        console.warn("[VERIFY_SESSION] Could not retrieve subscription dates:", e);
      }
    }

    await db.subscription.upsert({
      where: { userId },
      create: {
        userId,
        planId: plan.id,
        stripeCustomerId: checkoutSession.customer as string,
        stripeSubscriptionId: stripeSub?.id || null,
        status: "ACTIVE",
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        creditsRemaining: plan.monthlyCredits + plan.bonusCredits,
      },
      update: {
        status: "ACTIVE",
        creditsRemaining: plan.monthlyCredits + plan.bonusCredits,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        canceledAt: null,
      },
    });

    // Save stripeCustomerId on user
    await db.user.update({
      where: { id: userId },
      data: { stripeCustomerId: checkoutSession.customer as string },
    });

    return NextResponse.json({ success: true, plan: planSlug });
  } catch (err: any) {
    console.error("[VERIFY_SESSION]", err);
    return NextResponse.json({ error: "Error al verificar pago" }, { status: 500 });
  }
}
