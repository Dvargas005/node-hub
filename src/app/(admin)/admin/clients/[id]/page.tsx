import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { notFound } from "next/navigation";
import { ClientDetailClient } from "./client-detail-client";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireRole(["ADMIN", "PM"]);
  const userRole = (session.user as Record<string, unknown>).role as string;
  const isAdmin = userRole === "ADMIN";

  const [client, pms, completedCount] = await Promise.all([
    db.user.findUnique({
      where: { id },
      include: {
        subscription: { include: { plan: true } },
        referredBy: { select: { name: true, code: true } },
        assignedPm: { select: { id: true, name: true, email: true } },
        tickets: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { variant: { include: { service: true } } },
        },
        _count: { select: { tickets: true } },
      },
    }),
    db.user.findMany({
      where: { role: { in: ["PM", "ADMIN"] } },
      select: { id: true, name: true },
    }),
    db.ticket.count({
      where: { userId: id, status: "COMPLETED" },
    }),
  ]);

  if (!client || client.role !== "CLIENT") notFound();

  const sm = (client.socialMedia as Record<string, string> | null) || null;

  return (
    <ClientDetailClient
      isAdmin={isAdmin}
      pms={pms.map((p: any) => ({ id: p.id, name: p.name }))}
      client={{
        id: client.id,
        name: client.name,
        email: client.email,
        emailVerified: client.emailVerified,
        createdAt: client.createdAt.toISOString(),
        updatedAt: client.updatedAt.toISOString(),
        // Business profile
        businessName: client.businessName,
        businessIndustry: client.businessIndustry,
        businessType: client.businessType,
        businessDescription: client.businessDescription,
        targetAudience: client.targetAudience,
        website: client.website,
        hasBranding: client.hasBranding,
        brandColors: client.brandColors,
        brandStyle: client.brandStyle,
        socialMedia: sm,
        priorities: (client.priorities as Record<string, number> | null) || null,
        // Contact
        phone: client.phone,
        whatsappNumber: client.whatsappNumber,
        telegramId: client.telegramId,
        linkedinUrl: client.linkedinUrl,
        instagramHandle: client.instagramHandle,
        preferredContact: client.preferredContact,
        // Analysis
        companyAnalysis: (client.companyAnalysis as Record<string, unknown> | null) || null,
        companyAnalysisAt: client.companyAnalysisAt?.toISOString() || null,
        // Subscription
        subscription: client.subscription
          ? {
              status: client.subscription.status,
              creditsRemaining: client.subscription.creditsRemaining,
              currentPeriodStart: client.subscription.currentPeriodStart.toISOString(),
              currentPeriodEnd: client.subscription.currentPeriodEnd.toISOString(),
              plan: {
                name: client.subscription.plan.name,
                slug: client.subscription.plan.slug,
                priceMonthly: client.subscription.plan.priceMonthly,
                monthlyCredits: client.subscription.plan.monthlyCredits,
              },
            }
          : null,
        freeCredits: client.freeCredits,
        // PM
        assignedPm: client.assignedPm
          ? {
              id: client.assignedPm.id,
              name: client.assignedPm.name,
              email: client.assignedPm.email,
            }
          : null,
        // Alliance
        alliance: client.referredBy
          ? { name: client.referredBy.name, code: client.referredBy.code }
          : null,
        // Tickets
        recentTickets: client.tickets.map((t: any) => ({
          id: t.id,
          number: t.number,
          status: t.status,
          serviceName: t.variant?.service?.name || "—",
          variantName: t.variant?.name || "",
          creditsCharged: t.creditsCharged,
          createdAt: t.createdAt.toISOString(),
        })),
        totalTickets: client._count.tickets,
        completedTickets: completedCount,
      }}
    />
  );
}
