import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { TicketsClient } from "./tickets-client";

export const dynamic = "force-dynamic";

export default async function AdminTicketsPage() {
  await requireRole(["ADMIN", "PM"]);

  const [tickets, freelancers] = await Promise.all([
    db.ticket.findMany({
      include: {
        user: { select: { name: true, businessName: true, email: true } },
        variant: {
          include: { service: { select: { name: true, category: true } } },
        },
        freelancer: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    db.freelancer.findMany({
      where: { availability: "AVAILABLE" },
      select: {
        id: true,
        name: true,
        role: true,
        skills: true,
        skillTags: true,
        currentLoad: true,
        clientCapacity: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <TicketsClient
      tickets={tickets.map((t) => ({
        id: t.id,
        number: t.number,
        clientName: t.user.name,
        clientBusiness: t.user.businessName,
        serviceName: t.variant.service.name,
        serviceCategory: t.variant.service.category,
        variantName: t.variant.name,
        status: t.status,
        priority: t.priority,
        freelancerName: t.freelancer?.name || null,
        freelancerId: t.freelancerId,
        clientNotes: t.clientNotes,
        briefStructured: t.briefStructured as Record<string, unknown> | null,
        pmNotes: t.pmNotes,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      }))}
      availableFreelancers={freelancers.map((f) => ({
        id: f.id,
        name: f.name,
        role: f.role,
        skills: f.skills,
        skillTags: f.skillTags,
        currentLoad: f.currentLoad,
        clientCapacity: f.clientCapacity,
      }))}
    />
  );
}
