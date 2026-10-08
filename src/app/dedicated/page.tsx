import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { expireIfNeeded } from "@/lib/sub-expiration";
import { DedicatedClient } from "./dedicated-client";
import { addOnChargeFor } from "@/lib/addons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dedicated Growth — N.O.D.E.",
  description: "Managed Web, Design & Graphics retainers billed monthly.",
  robots: { index: false, follow: false },
};

const SLUGS = ["dedicated-light", "dedicated-jump", "dedicated-pro"];

export default async function DedicatedPage() {
  const [rows, addOns] = await Promise.all([
    db.plan.findMany({ where: { slug: { in: SLUGS } }, include: { includedAddOn: true } }),
    db.addOn.findMany({ where: { isActive: true }, orderBy: { rank: "asc" } }),
  ]);
  // Preserve Light → Jump → Pro order regardless of DB ordering.
  const plans = SLUGS.map((slug) => rows.find((p) => p.slug === slug)).filter(
    (p): p is NonNullable<typeof p> => Boolean(p),
  );

  const session = await getSession();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  let activePlanName: string | null = null;
  if (userId) {
    const rawSub = await db.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
    const sub = await expireIfNeeded(rawSub as any);
    if (sub && sub.status === "ACTIVE") {
      activePlanName = sub.plan.name;
    }
  }

  return (
    <DedicatedClient
      isLoggedIn={!!userId}
      activePlanName={activePlanName}
      addOns={addOns.map((a) => ({ slug: a.slug, name: a.name }))}
      plans={plans.map((p) => ({
        name: p.name,
        slug: p.slug,
        priceMonthly: p.priceMonthly,
        monthlyCredits: p.monthlyCredits,
        maxActiveReqs: p.maxActiveReqs,
        deliveryDays: p.deliveryDays,
        minTermMonths: p.minTermMonths,
        configured: Boolean(p.stripePriceId),
        // Jump pays only the difference above its included Starter SEO; Pro includes everything
        addOnCharges: Object.fromEntries(addOns.map((a) => [a.slug, addOnChargeFor(p, a)])),
      }))}
    />
  );
}
