import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireAuth();
  const userId = session.user.id;

  const [user, subscription, activeTickets, allTickets] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        freeCredits: true,
        businessName: true,
        businessIndustry: true,
        businessDescription: true,
        targetAudience: true,
        hasBranding: true,
        brandColors: true,
        brandStyle: true,
        website: true,
        socialMedia: true,
        priorities: true,
        companyAnalysis: true,
        companyAnalysisAt: true,
        assignedPmId: true,
      },
    }),
    db.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    }),
    db.ticket.findMany({
      where: { userId, status: { notIn: ["COMPLETED", "CANCELED"] } },
      include: { variant: { include: { service: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.ticket.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 1,
      select: { id: true, number: true, status: true, createdAt: true, variant: { select: { name: true, service: { select: { name: true } } } } },
    }),
  ]);

  const pm = user?.assignedPmId
    ? await db.user.findUnique({
        where: { id: user.assignedPmId },
        select: { name: true, email: true },
      })
    : null;

  const latestTicket = allTickets[0] || null;

  return (
    <DashboardClient
      userName={session.user.name}
      freeCredits={user?.freeCredits || 0}
      subscription={
        subscription
          ? {
              planName: subscription.plan.name,
              creditsRemaining: subscription.creditsRemaining,
              monthlyCredits: subscription.plan.monthlyCredits,
              status: subscription.status,
              periodEnd: subscription.currentPeriodEnd.toISOString(),
              maxActiveReqs: subscription.plan.maxActiveReqs,
            }
          : null
      }
      profile={{
        businessName: user?.businessName || "",
        businessIndustry: user?.businessIndustry || "",
        businessDescription: user?.businessDescription || "",
        targetAudience: user?.targetAudience || "",
        hasBranding: user?.hasBranding,
        brandColors: user?.brandColors || "",
        brandStyle: user?.brandStyle || "",
        website: user?.website || "",
        socialMedia: (user?.socialMedia as Record<string, string>) || {},
        priorities: (user?.priorities as Record<string, number>) || {},
      }}
      companyAnalysis={user?.companyAnalysis as Record<string, unknown> | null}
      companyAnalysisAt={user?.companyAnalysisAt?.toISOString() || null}
      subscriptionRenewedAt={subscription?.currentPeriodStart?.toISOString() || null}
      activeTickets={activeTickets.map((t) => ({
        id: t.id,
        number: t.number,
        serviceName: t.variant.service.name,
        variantName: t.variant.name,
        status: t.status,
        createdAt: t.createdAt.toISOString(),
      }))}
      latestTicket={
        latestTicket
          ? {
              number: latestTicket.number,
              status: latestTicket.status,
              serviceName: latestTicket.variant.service.name,
            }
          : null
      }
      pm={pm ? { name: pm.name, email: pm.email } : null}
    />
  );
}
