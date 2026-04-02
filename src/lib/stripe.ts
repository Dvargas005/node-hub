import Stripe from "stripe";

let _stripe: Stripe | null = null;

function hasStripeKey() {
  return !!process.env.STRIPE_SECRET_KEY;
}

export function getStripe() {
  if (!_stripe) {
    if (!hasStripeKey()) {
      console.warn("[STRIPE] No STRIPE_SECRET_KEY — Stripe disabled");
      return null;
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-03-25.dahlia",
      typescript: true,
    });
  }
  return _stripe;
}

export async function createCheckoutSession({
  userId,
  email,
  planSlug,
  stripePriceId,
  successUrl,
  cancelUrl,
}: {
  userId: string;
  email: string;
  planSlug: string;
  stripePriceId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = getStripe();
  if (!stripe) return null;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: email,
    line_items: [{ price: stripePriceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId, planSlug },
  });

  return session;
}

export async function createPortalSession({
  stripeCustomerId,
  returnUrl,
}: {
  stripeCustomerId: string;
  returnUrl: string;
}) {
  const stripe = getStripe();
  if (!stripe) return null;

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });

  return session;
}
