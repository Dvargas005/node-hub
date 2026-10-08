import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { expireIfNeeded } from "@/lib/sub-expiration";
import { BillingClient } from "./billing-client";
import { addOnChargeFor } from "@/lib/addons";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const session = await requireAuth();
  const userId = session.user.id;

  const [plans, rawSubscription, creditPacks, user, addOns] = await Promise.all([
    db.plan.findMany({
      where: { isActive: true, isHidden: false },
      orderBy: { priceMonthly: "asc" },
      include: { includedAddOn: true },
    }),
    db.subscription.findUnique({
      where: { userId },
      include: { plan: { include: { includedAddOn: true } }, addOn: true },
    }),
    db.creditPack.findMany({
      where: { isActive: true },
      orderBy: { priceInCents: "asc" },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { freeCredits: true },
    }),
    db.addOn.findMany({ where: { isActive: true }, orderBy: { rank: "asc" } }),
  ]);

  // Monthly add-on charge per plan (null = not available, e.g. already included)
  const chargesFor = (plan: Parameters<typeof addOnChargeFor>[0]) =>
    Object.fromEntries(addOns.map((a) => [a.slug, addOnChargeFor(plan, a)])) as Record<string, number | null>;

  // Lazy-expire one-time plans (Starter) past their period end
  const subscription = await expireIfNeeded(rawSubscription as any);

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
        minTermMonths: p.minTermMonths,
        addOnCharges: chargesFor(p),
      }))}
      addOns={addOns.map((a) => ({ slug: a.slug, name: a.name }))}
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
              canHaveAddOn: !!subscription.stripeSubscriptionId && subscription.plan.isRecurring,
              canCancel: !!subscription.stripeSubscriptionId && subscription.plan.isRecurring,
              minTermMonths: subscription.plan.minTermMonths,
              minTermEndsAt: subscription.minTermEndsAt?.toISOString() ?? null,
              addOnSlug: subscription.addOn?.slug ?? null,
              addOnName: subscription.addOn?.name ?? null,
              addOnMinTermEndsAt: subscription.addOnMinTermEndsAt?.toISOString() ?? null,
              addOnCharges: chargesFor(subscription.plan),
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
    />
  );
}
