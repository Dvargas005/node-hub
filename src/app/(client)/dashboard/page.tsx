import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireAuth();
  const userId = session.user.id;

  const [subscription, ticketCount, lastTicket] = await Promise.all([
    db.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    }),
    db.ticket.count({
      where: {
        userId,
        status: {
          notIn: ["COMPLETED", "CANCELED"],
        },
      },
    }),
    db.ticket.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { variant: { include: { service: true } } },
    }),
  ]);

  return (
    <DashboardClient
      userName={session.user.name}
      subscription={
        subscription
          ? {
              planName: subscription.plan.name,
              creditsRemaining: subscription.creditsRemaining,
              monthlyCredits: subscription.plan.monthlyCredits,
              status: subscription.status,
              periodEnd: subscription.currentPeriodEnd.toISOString(),
            }
          : null
      }
      activeTickets={ticketCount}
      lastTicket={
        lastTicket
          ? {
              id: lastTicket.id,
              number: lastTicket.number,
              serviceName: lastTicket.variant.service.name,
              variantName: lastTicket.variant.name,
              status: lastTicket.status,
              createdAt: lastTicket.createdAt.toISOString(),
            }
          : null
      }
    />
  );
}
