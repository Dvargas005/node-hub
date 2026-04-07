import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { ClientsClient } from "./clients-client";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  const session = await requireRole(["ADMIN", "PM"]);
  const userRole = (session.user as Record<string, unknown>).role as string;
  const isAdmin = userRole === "ADMIN";

  const [clients, plans, pms] = await Promise.all([
    db.user.findMany({
      where: { role: "CLIENT" },
      include: {
        subscription: { include: { plan: true } },
        referredBy: { select: { name: true, code: true } },
        assignedPm: { select: { name: true } },
        _count: {
          select: {
            tickets: {
              where: { status: { notIn: ["COMPLETED", "CANCELED"] } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
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
      clients={clients.map((c: any) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        businessName: c.businessName,
        planName: c.subscription?.plan.name || null,
        planSlug: c.subscription?.plan.slug || null,
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
      }))}
      plans={plans.map((p: any) => ({ slug: p.slug, name: p.name }))}
    />
  );
}
