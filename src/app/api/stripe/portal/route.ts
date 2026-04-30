import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { cookies } from "next/headers";
import { t, DEFAULT_LANG } from "@/lib/i18n";

export async function POST() {
  const lang = (await cookies()).get("node-language")?.value || DEFAULT_LANG;
  const { error, session } = await requireApiRole(["CLIENT", "ADMIN", "PM"]);
  if (error || !session) return error;

  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: t("api.error.internal", lang) }, { status: 503 });
    }

    const subscription = await db.subscription.findUnique({
      where: { userId: session.user.id },
      select: { stripeCustomerId: true },
    });

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: t("api.error.noActiveSubscription", lang) },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${baseUrl}/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("[STRIPE_PORTAL]", err);
    return NextResponse.json({ error: t("api.error.internal", lang) }, { status: 500 });
  }
}
