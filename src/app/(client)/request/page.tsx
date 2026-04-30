import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { t, DEFAULT_LANG } from "@/lib/i18n";
import { requireAuth } from "@/lib/session";
import { RequestClient } from "./request-client";

export const dynamic = "force-dynamic";

export default async function RequestPage() {
  const session = await requireAuth();
  const userId = session.user.id;

  const [user, subscription] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { freeCredits: true },
    }),
    db.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    }),
  ]);

  const cookieStore = await cookies();
  const lang = cookieStore.get("node-language")?.value || DEFAULT_LANG;

  return (
    <RequestClient
      subscription={
        subscription
          ? {
              creditsRemaining: subscription.creditsRemaining,
              planName: subscription.plan.name,
              freeCredits: user?.freeCredits || 0,
            }
          : user?.freeCredits
            ? {
                creditsRemaining: 0,
                planName: t("billing.starter", lang),
                freeCredits: user.freeCredits,
              }
            : null
      }
    />
  );
}
