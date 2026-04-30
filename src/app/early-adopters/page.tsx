import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { expireIfNeeded } from "@/lib/sub-expiration";
import { EarlyAdoptersClient } from "./early-adopters-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Early Adopters — N.O.D.E.",
  description: "Exclusive Early Adopters plan.",
  robots: { index: false, follow: false },
};

export default async function EarlyAdoptersPage() {
  const plan = await db.plan.findUnique({ where: { slug: "early-adopters" } });
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
    <EarlyAdoptersClient
      isLoggedIn={!!userId}
      activePlanName={activePlanName}
      plan={
        plan
          ? {
              name: plan.name,
              slug: plan.slug,
              priceMonthly: plan.priceMonthly,
              monthlyCredits: plan.monthlyCredits,
              maxActiveReqs: plan.maxActiveReqs,
              deliveryDays: plan.deliveryDays,
            }
          : null
      }
    />
  );
}
