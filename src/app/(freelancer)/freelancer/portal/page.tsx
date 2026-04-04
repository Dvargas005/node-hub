import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { PortalClient } from "./portal-client";

export const dynamic = "force-dynamic";

export default async function FreelancerPortalPage() {
  const session = await requireRole(["FREELANCER"]);

  const freelancer = await db.freelancer.findUnique({
    where: { userId: session.user.id },
  });

  if (!freelancer) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-[rgba(245,246,252,0.5)] text-lg">
          Perfil de freelancer no encontrado. Contacta al administrador.
        </p>
      </div>
    );
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [activeTickets, completedTickets, completedThisMonth] =
    await Promise.all([
      db.ticket.findMany({
        where: {
          freelancerId: freelancer.id,
          status: { in: ["ASSIGNED", "IN_PROGRESS", "DELIVERED", "REVISION"] },
        },
        include: {
          user: { select: { name: true, businessName: true } },
          variant: { include: { service: { select: { name: true } } } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      db.ticket.findMany({
        where: { freelancerId: freelancer.id, status: "COMPLETED" },
        include: {
          user: { select: { name: true, businessName: true } },
          variant: { include: { service: { select: { name: true } } } },
        },
        orderBy: { completedAt: "desc" },
        take: 5,
      }),
      db.ticket.count({
        where: {
          freelancerId: freelancer.id,
          status: "COMPLETED",
          completedAt: { gte: monthStart },
        },
      }),
    ]);

  const serialize = (t: any) => ({
    id: t.id,
    number: t.number,
    status: t.status,
    priority: t.priority,
    serviceName: t.variant.service.name,
    variantName: t.variant.name,
    clientName: t.user.name,
    businessName: t.user.businessName,
    assignedAt: t.assignedAt?.toISOString() || null,
    completedAt: t.completedAt?.toISOString() || null,
  });

  return (
    <PortalClient
      freelancer={{
        name: freelancer.name,
        role: freelancer.role,
        availability: freelancer.availability,
        currentLoad: freelancer.currentLoad,
        clientCapacity: freelancer.clientCapacity,
      }}
      activeTickets={activeTickets.map(serialize)}
      completedTickets={completedTickets.map(serialize)}
      activeCount={activeTickets.length}
      completedThisMonth={completedThisMonth}
    />
  );
}
