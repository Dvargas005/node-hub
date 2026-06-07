import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { ClientsClient } from "./clients-client";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  const session = await requireRole(["ADMIN", "PM"]);
  const userRole = (session.user as Record<string, unknown>).role as string;
  const isAdmin = userRole === "ADMIN";

  const [activeClients, prospects, teamUsers, plans, pms] = await Promise.all([
    // Clients tab: CLIENT + ACTIVE subscription + no tag
    db.user.findMany({
      where: {
        role: "CLIENT",
        userTag: null,
        subscription: { status: "ACTIVE" },
      },
      include: {
        subscription: { include: { plan: true } },
        referredBy: { select: { name: true, code: true } },
        assignedPm: { select: { name: true } },
        _count: {
          select: {
            tickets: { where: { status: { notIn: ["COMPLETED", "CANCELED"] } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    // Prospects tab: CLIENT + no active subscription + no tag
    db.user.findMany({
      where: {
        role: "CLIENT",
        userTag: null,
        OR: [
          { subscription: null },
          { subscription: { status: { not: "ACTIVE" } } },
        ],
      },
      include: {
        subscription: { include: { plan: true } },
        assignedPm: { select: { name: true } },
        _count: {
          select: {
            tickets: { where: { status: { notIn: ["COMPLETED", "CANCELED"] } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    // Team tab: ADMIN/PM/FREELANCER OR userTag set
    db.user.findMany({
      where: {
        OR: [
          { role: { in: ["ADMIN", "PM", "FREELANCER"] } },
          { userTag: { in: ["testing", "internal"] } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        userTag: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.plan.findMany({ where: { isActive: true }, orderBy: { priceMonthly: "asc" } }),
    db.user.findMany({
      where: { role: { in: ["PM", "ADMIN"] } },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <ClientsClient
      isAdmin={isAdmin}
      pms={pms.map((p: any) => ({ id: p.id, name: p.name }))}
      clients={activeClients.map((c: any) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        businessName: c.businessName,
        planName: c.subscription?.plan.name || null,
        planSlug: c.subscription?.plan.slug || null,
        subscriptionStatus: c.subscription?.status || null,
        creditsRemaining: c.subscription?.creditsRemaining ?? null,
        monthlyCredits: c.subscription?.plan.monthlyCredits ?? null,
        activeTickets: c._count.tickets,
        allianceName: c.referredBy?.name || null,
        allianceCode: c.referredBy?.code || null,
        assignedPmId: c.assignedPmId || null,
        assignedPmName: c.assignedPm?.name || null,
        createdAt: c.createdAt.toISOString(),
        phone: c.phone || null,
        whatsappNumber: c.whatsappNumber || null,
        telegramId: c.telegramId || null,
        linkedinUrl: c.linkedinUrl || null,
        instagramHandle: c.instagramHandle || null,
        preferredContact: c.preferredContact || null,
        userTag: c.userTag || null,
      }))}
      prospects={prospects.map((c: any) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        businessName: c.businessName,
        planName: c.subscription?.plan.name || null,
        planSlug: c.subscription?.plan.slug || null,
        subscriptionStatus: c.subscription?.status || null,
        creditsRemaining: null,
        monthlyCredits: null,
        activeTickets: c._count.tickets,
        allianceName: null,
        allianceCode: null,
        assignedPmId: c.assignedPmId || null,
        assignedPmName: c.assignedPm?.name || null,
        createdAt: c.createdAt.toISOString(),
        phone: c.phone || null,
        whatsappNumber: c.whatsappNumber || null,
        telegramId: c.telegramId || null,
        linkedinUrl: c.linkedinUrl || null,
        instagramHandle: c.instagramHandle || null,
        preferredContact: c.preferredContact || null,
        userTag: c.userTag || null,
      }))}
      team={teamUsers.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        userTag: u.userTag || null,
        createdAt: u.createdAt.toISOString(),
      }))}
      plans={plans.map((p: any) => ({ slug: p.slug, name: p.name }))}
    />
  );
}
