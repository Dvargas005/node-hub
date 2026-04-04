import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    console.log("[WEBHOOK] No Stripe key — skipping");
    return NextResponse.json({ received: true });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn("[WEBHOOK] No STRIPE_WEBHOOK_SECRET — refusing to process for security");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 400 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown";
    console.error("[WEBHOOK] Signature verification failed:", msg);
    return NextResponse.json({ error: `Webhook Error: ${msg}` }, { status: 400 });
  }

  try {
    const obj = event.data.object as unknown as Record<string, unknown>;

    switch (event.type) {
      // ─── Subscription checkout complete ─────────────
      case "checkout.session.completed": {
        const sessionId = obj.id as string;
        const metadata = obj.metadata as Record<string, string> | undefined;
        const userId = metadata?.userId;
        const planSlug = metadata?.planSlug;
        const packId = metadata?.packId;
        const packCredits = metadata?.credits;
        const customerId = obj.customer as string;

        // C6: Idempotency check — skip if already processed
        const alreadyProcessed = await db.processedWebhook.findUnique({ where: { sessionId } });
        if (alreadyProcessed) {
          console.log(`[WEBHOOK] Already processed session ${sessionId}, skipping`);
          break;
        }

        // Credit pack purchase
        if (metadata?.type === "credit_pack" && packCredits) {
          const credits = parseInt(packCredits);
          const sub = userId
            ? await db.subscription.findUnique({ where: { userId } })
            : null;

          if (sub) {
            await db.subscription.update({
              where: { id: sub.id },
              data: { creditsRemaining: { increment: credits } },
            });
          } else if (userId) {
            await db.user.update({
              where: { id: userId },
              data: { freeCredits: { increment: credits } },
            });
          }

          await db.processedWebhook.create({ data: { sessionId, type: "credit_pack" } });
          console.log(`[WEBHOOK] Credit pack: +${credits} créditos (pack ${packId})`);
          break;
        }

        // Subscription purchase
        if (!userId || !planSlug) {
          console.warn("[WEBHOOK] checkout.session.completed missing metadata:", { userId, planSlug });
          break;
        }

        const plan = await db.plan.findUnique({ where: { slug: planSlug } });
        if (!plan) {
          console.warn("[WEBHOOK] Plan not found:", planSlug);
          break;
        }

        // I18: Read actual period dates from Stripe subscription
        const subscriptionId = obj.subscription as string;
        let periodStart = new Date();
        let periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        if (subscriptionId) {
          try {
            const stripeSub = await stripe.subscriptions.retrieve(subscriptionId, { expand: ["items.data"] });
            const item = stripeSub.items.data[0];
            if (item) {
              periodStart = new Date(item.current_period_start * 1000);
              periodEnd = new Date(item.current_period_end * 1000);
            }
          } catch (e) {
            console.warn("[WEBHOOK] Could not retrieve subscription dates:", e);
          }
        }

        // C2: Credits always RESET to plan total (old credits are lost — business rule)
        await db.subscription.upsert({
          where: { userId },
          update: {
            planId: plan.id,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            status: "ACTIVE",
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
            creditsRemaining: plan.monthlyCredits + plan.bonusCredits,
            canceledAt: null,
          },
          create: {
            userId,
            planId: plan.id,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            status: "ACTIVE",
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
            creditsRemaining: plan.monthlyCredits + plan.bonusCredits,
          },
        });

        // Save stripeCustomerId on user too
        await db.user.update({
          where: { id: userId },
          data: { stripeCustomerId: customerId },
        });

        await db.processedWebhook.create({ data: { sessionId, type: "subscription" } });
        console.log(`[WEBHOOK] Subscription created: ${userId} → ${plan.name}`);
        break;
      }

      // ─── Invoice paid (renewal) ─────────────────────
      case "invoice.paid": {
        const subscriptionId = obj.subscription as string;
        if (!subscriptionId) break;

        // Skip first invoice (handled by checkout.session.completed)
        const billingReason = obj.billing_reason as string;
        if (billingReason === "subscription_create") break;

        const sub = await db.subscription.findFirst({
          where: { stripeSubscriptionId: subscriptionId },
          include: { plan: true },
        });

        if (sub) {
          // I18: Read actual period dates from Stripe
          let periodStart = new Date();
          let periodEnd = new Date();
          periodEnd.setMonth(periodEnd.getMonth() + 1);

          try {
            const stripeSub = await stripe.subscriptions.retrieve(subscriptionId, { expand: ["items.data"] });
            const item = stripeSub.items.data[0];
            if (item) {
              periodStart = new Date(item.current_period_start * 1000);
              periodEnd = new Date(item.current_period_end * 1000);
            }
          } catch (e) {
            console.warn("[WEBHOOK] Could not retrieve subscription dates:", e);
          }

          // C3 + REGLA 1: RESET credits (unused credits are lost each month — business rule)
          await db.subscription.update({
            where: { id: sub.id },
            data: {
              status: "ACTIVE",
              currentPeriodStart: periodStart,
              currentPeriodEnd: periodEnd,
              creditsRemaining: sub.plan.monthlyCredits + sub.plan.bonusCredits,
            },
          });

          console.log(`[WEBHOOK] Credits renewed: ${sub.userId} → ${sub.plan.monthlyCredits + sub.plan.bonusCredits} créditos`);
        }
        break;
      }

      // ─── Subscription updated ───────────────────────
      case "customer.subscription.updated": {
        const status = obj.status as string;
        const subId = obj.id as string;

        const mapped =
          status === "active" ? "ACTIVE" :
          status === "past_due" ? "PAST_DUE" :
          status === "canceled" || status === "unpaid" ? "CANCELED" :
          null;

        if (mapped) {
          const updateData: Record<string, unknown> = { status: mapped };
          if (mapped === "CANCELED") {
            updateData.canceledAt = new Date();
          }
          await db.subscription.updateMany({
            where: { stripeSubscriptionId: subId },
            data: updateData as any,
          });
          console.log(`[WEBHOOK] Subscription updated: ${subId} → ${mapped}`);
        }
        break;
      }

      // ─── Subscription deleted ───────────────────────
      case "customer.subscription.deleted": {
        const subId = obj.id as string;
        await db.subscription.updateMany({
          where: { stripeSubscriptionId: subId },
          data: { status: "CANCELED", creditsRemaining: 0, canceledAt: new Date() },
        });
        console.log(`[WEBHOOK] Subscription canceled: ${subId}`);
        break;
      }

      default:
        console.log(`[WEBHOOK] Unhandled event: ${event.type}`);
    }
  } catch (err) {
    console.error("[WEBHOOK] Error processing:", err);
    return NextResponse.json({ error: "Error processing webhook" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
