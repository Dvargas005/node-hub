import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { expireIfNeeded } from "@/lib/sub-expiration";
import { BillingClient } from "./billing-client";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const session = await requireAuth();
  const userId = session.user.id;

  const [plans, rawSubscription, creditPacks, user] = await Promise.all([
    db.plan.findMany({
      where: { isActive: true, isHidden: false },
      orderBy: { priceMonthly: "asc" },
    }),
    db.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    }),
    db.creditPack.findMany({
      where: { isActive: true },
      orderBy: { priceInCents: "asc" },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { freeCredits: true, allianceId: true },
    }),
  ]);

  // Lazy-expire one-time plans (Starter) past their period end
  const subscription = await expireIfNeeded(rawSubscription as any);

  // Check if user has LEN alliance for discount
  let allianceDiscount = 0;
  if (user?.allianceId) {
    const alliance = await db.alliance.findUnique({
      where: { id: user.allianceId },
      select: { discountPercent: true },
    });
    allianceDiscount = alliance?.discountPercent || 0;
  }

  return (
    <BillingClient
      plans={plans.map((p: any) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        priceMonthly: p.priceMonthly,
        setupFee: p.setupFee,
        monthlyCredits: p.monthlyCredits,
        maxActiveReqs: p.maxActiveReqs,
        deliveryDays: p.deliveryDays,
        stripePriceId: p.stripePriceId,
        isRecurring: p.isRecurring,
      }))}
      subscription={
        subscription
          ? {
              id: subscription.id,
              status: subscription.status,
              planSlug: subscription.plan.slug,
              planName: subscription.plan.name,
              creditsRemaining: subscription.creditsRemaining,
              monthlyCredits: subscription.plan.monthlyCredits,
              currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
              hasStripeCustomer: !!subscription.stripeCustomerId,
            }
          : null
      }
      creditPacks={creditPacks.map((p: any) => ({
        id: p.id,
        name: p.name,
        credits: p.credits,
        priceInCents: p.priceInCents,
        stripePriceId: p.stripePriceId,
      }))}
      freeCredits={user?.freeCredits || 0}
      allianceDiscount={allianceDiscount}
    />
  );
}
