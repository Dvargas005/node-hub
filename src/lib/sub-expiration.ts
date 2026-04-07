/**
 * Lazy expiration check for non-recurring subscriptions (e.g. Starter plan).
 *
 * Stripe subscription webhooks handle status transitions for recurring plans
 * automatically (active → past_due → canceled). One-time payments don't fire
 * those events, so we mark the subscription as EXPIRED on read whenever the
 * period ends and there's no Stripe subscription backing it.
 */
import { db } from "@/lib/db";

interface SubLike {
  id: string;
  status: string;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: Date;
}

/**
 * If the subscription is active, has no Stripe subscription (one-time), and
 * its period has ended → mark as EXPIRED in DB and reflect that on the
 * returned object. No-op for recurring plans.
 */
export async function expireIfNeeded<T extends SubLike>(sub: T | null): Promise<T | null> {
  if (!sub) return sub;
  if (sub.status !== "ACTIVE") return sub;
  if (sub.stripeSubscriptionId) return sub; // recurring — Stripe drives transitions
  if (sub.currentPeriodEnd > new Date()) return sub;

  try {
    await db.subscription.update({
      where: { id: sub.id },
      data: { status: "EXPIRED" },
    });
  } catch (err) {
    console.error("[SUB_EXPIRE]", err);
  }
  return { ...sub, status: "EXPIRED" };
}
