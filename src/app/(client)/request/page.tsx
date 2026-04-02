import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { RequestClient } from "./request-client";

export const dynamic = "force-dynamic";

export default async function RequestPage() {
  const session = await requireAuth();

  const subscription = await db.subscription.findUnique({
    where: { userId: session.user.id },
    include: { plan: true },
  });

  return (
    <RequestClient
      subscription={
        subscription
          ? {
              creditsRemaining: subscription.creditsRemaining,
              planName: subscription.plan.name,
            }
          : null
      }
    />
  );
}
