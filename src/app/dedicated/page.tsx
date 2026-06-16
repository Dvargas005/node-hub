import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { expireIfNeeded } from "@/lib/sub-expiration";
import { DedicatedClient } from "./dedicated-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dedicated Growth — N.O.D.E.",
  description: "Managed Web, Design & Graphics retainers billed monthly.",
  robots: { index: false, follow: false },
};

const SLUGS = ["dedicated-light", "dedicated-jump", "dedicated-pro"];

export default async function DedicatedPage() {
  const rows = await db.plan.findMany({ where: { slug: { in: SLUGS } } });
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
      plans={plans.map((p) => ({
        name: p.name,
        slug: p.slug,
        priceMonthly: p.priceMonthly,
        monthlyCredits: p.monthlyCredits,
        maxActiveReqs: p.maxActiveReqs,
        deliveryDays: p.deliveryDays,
        minTermMonths: p.minTermMonths,
        configured: Boolean(p.stripePriceId),
      }))}
    />
  );
}
