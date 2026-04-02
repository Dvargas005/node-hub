import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { BillingClient } from "./billing-client";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const session = await requireAuth();

  const [plans, subscription] = await Promise.all([
    db.plan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: "asc" },
    }),
    db.subscription.findUnique({
      where: { userId: session.user.id },
      include: { plan: true },
    }),
  ]);

  return (
    <BillingClient
      plans={plans}
      subscription={subscription}
    />
  );
}
