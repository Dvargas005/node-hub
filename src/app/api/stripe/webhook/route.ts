import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const stripe = getStripe();

  if (!stripe) {
    console.log("[STRIPE WEBHOOK] No Stripe key — returning 200");
    return NextResponse.json({ received: true });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as unknown as Record<string, unknown>;
        const userId = (session.metadata as Record<string, string>)?.userId;
        const planSlug = (session.metadata as Record<string, string>)?.planSlug;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!userId || !planSlug) {
          console.warn("[STRIPE] checkout.session.completed missing metadata:", { userId, planSlug });
          break;
        }

        {
          const plan = await db.plan.findUnique({
            where: { slug: planSlug },
          });

          if (plan) {
            const now = new Date();
            const periodEnd = new Date(now);
            periodEnd.setMonth(periodEnd.getMonth() + 1);

            await db.subscription.upsert({
              where: { userId },
              update: {
                planId: plan.id,
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                status: "ACTIVE",
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
                creditsRemaining: plan.monthlyCredits + plan.bonusCredits,
              },
              create: {
                userId,
                planId: plan.id,
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                status: "ACTIVE",
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
                creditsRemaining: plan.monthlyCredits + plan.bonusCredits,
              },
            });

            console.log(
              `[STRIPE] Subscription created: ${userId} -> ${plan.name}`
            );
          }
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as unknown as Record<string, unknown>;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          const sub = await db.subscription.findFirst({
            where: { stripeSubscriptionId: subscriptionId },
            include: { plan: true },
          });

          if (sub) {
            const now = new Date();
            const periodEnd = new Date(now);
            periodEnd.setMonth(periodEnd.getMonth() + 1);

            await db.subscription.update({
              where: { id: sub.id },
              data: {
                status: "ACTIVE",
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
                creditsRemaining: sub.plan.monthlyCredits + sub.plan.bonusCredits,
              },
            });

            console.log(
              `[STRIPE] Credits renewed: ${sub.userId} -> ${sub.plan.monthlyCredits} créditos`
            );
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as unknown as Record<
          string,
          unknown
        >;
        await db.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id as string },
          data: { status: "CANCELED" },
        });
        console.log(
          `[STRIPE] Subscription canceled: ${subscription.id as string}`
        );
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as unknown as Record<
          string,
          unknown
        >;
        const status = subscription.status as string;
        await db.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id as string },
          data: {
            status:
              status === "active"
                ? "ACTIVE"
                : status === "past_due"
                  ? "PAST_DUE"
                  : "CANCELED",
          },
        });
        break;
      }

      default:
        console.log(`[STRIPE] Unhandled event: ${event.type}`);
    }
  } catch (err) {
    console.error("[STRIPE WEBHOOK] Error processing event:", err);
    return NextResponse.json(
      { error: "Error processing webhook" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
