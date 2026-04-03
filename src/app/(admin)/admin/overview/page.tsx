import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { OverviewClient } from "./overview-client";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requireRole(["ADMIN", "PM"]);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    activeClients,
    openTickets,
    deliveredThisMonth,
    creditsAgg,
    recentTickets,
    freelancers,
  ] = await Promise.all([
    db.subscription.count({ where: { status: "ACTIVE" } }),
    db.ticket.count({
      where: { status: { notIn: ["COMPLETED", "CANCELED"] } },
    }),
    db.ticket.count({
      where: { status: "DELIVERED", deliveredAt: { gte: startOfMonth } },
    }),
    db.ticket.aggregate({
      where: { status: "COMPLETED", completedAt: { gte: startOfMonth } },
      _sum: { creditsCharged: true },
    }),
    db.ticket.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, businessName: true } },
        variant: { include: { service: { select: { name: true } } } },
        freelancer: { select: { name: true } },
      },
    }),
    db.freelancer.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        role: true,
        availability: true,
        currentLoad: true,
        clientCapacity: true,
      },
    }),
  ]);

  return (
    <OverviewClient
      metrics={{
        activeClients,
        openTickets,
        deliveredThisMonth,
        creditsConsumed: creditsAgg._sum.creditsCharged || 0,
      }}
      recentTickets={recentTickets.map((t: any) => ({
        id: t.id,
        number: t.number,
        clientName: t.user.name,
        clientBusiness: t.user.businessName,
        serviceName: t.variant.service.name,
        variantName: t.variant.name,
        status: t.status,
        priority: t.priority,
        freelancerName: t.freelancer?.name || null,
        createdAt: t.createdAt.toISOString(),
      }))}
      freelancers={freelancers.map((f: any) => ({
        id: f.id,
        name: f.name,
        role: f.role,
        availability: f.availability,
        currentLoad: f.currentLoad,
        clientCapacity: f.clientCapacity,
      }))}
    />
  );
}
