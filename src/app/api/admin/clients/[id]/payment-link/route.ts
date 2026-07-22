import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import Stripe from "stripe";

/**
 * Admin-only: generate a secure Stripe-hosted link so a super user can get a
 * client's card set up WITHOUT ever handling or storing the card number.
 *
 *   type "portal" — Billing Portal: best when the client already has a
 *                   subscription. They can add/replace the card and Stripe will
 *                   set it as default and retry any past-due invoice.
 *   type "setup"  — Checkout in setup mode: saves a card on file to the Stripe
 *                   customer. Works even with no active subscription.
 *
 * We only ever persist Stripe IDs — no PAN ever reaches this app or its DB, so
 * the account stays out of PCI scope.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error, session } = await requireApiRole(["ADMIN"]);
  if (error || !session) return error;

  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
    }

    const { id: clientId } = await params;
    const body = await req.json().catch(() => ({}));
    const type: "portal" | "setup" = body?.type === "portal" ? "portal" : "setup";

    const client = await db.user.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        role: true,
        email: true,
        name: true,
        stripeCustomerId: true,
        subscription: { select: { stripeCustomerId: true } },
      },
    });
    if (!client || client.role !== "CLIENT") {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // ── Resolve the Stripe customer (never create a duplicate) ──
    // Prefer the id already linked to the user, then the one on the
    // subscription, then search Stripe by email, and only create as a last
    // resort. Persist whatever we resolve so it stays consistent next time.
    let customerId =
      client.stripeCustomerId || client.subscription?.stripeCustomerId || undefined;
    let created = false;

    if (!customerId) {
      const existing = await stripe.customers.list({ email: client.email, limit: 1 });
      if (existing.data.length > 0) {
        customerId = existing.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: client.email,
          name: client.name || undefined,
          metadata: { userId: client.id },
        });
        customerId = customer.id;
        created = true;
      }
    }

    if (customerId && customerId !== client.stripeCustomerId) {
      await db.user.update({
        where: { id: client.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const returnUrl = `${baseUrl}/admin/clients/${client.id}`;

    let url: string | null = null;

    if (type === "portal") {
      const portal = await stripe.billingPortal.sessions.create({
        customer: customerId!,
        return_url: returnUrl,
      });
      url = portal.url;
    } else {
      const checkout = await stripe.checkout.sessions.create({
        mode: "setup",
        customer: customerId!,
        payment_method_types: ["card"],
        success_url: `${returnUrl}?card=success`,
        cancel_url: `${returnUrl}?card=canceled`,
        metadata: { userId: client.id, initiatedBy: session.user.id, purpose: "admin_card_setup" },
      });
      url = checkout.url;
    }

    if (!url) {
      return NextResponse.json({ error: "Stripe did not return a link" }, { status: 502 });
    }

    return NextResponse.json({ url, type, customerId, created });
  } catch (err) {
    console.error("[ADMIN_PAYMENT_LINK]", err);
    const message =
      err instanceof Stripe.errors.StripeError
        ? `Stripe error: ${err.message}`
        : err instanceof Error
        ? err.message
        : "Failed to create payment link";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
