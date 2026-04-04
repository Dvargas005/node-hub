import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { notFound } from "next/navigation";
import { TicketAdminClient } from "./ticket-admin-client";

export const dynamic = "force-dynamic";

export default async function AdminTicketDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requireRole(["ADMIN", "PM"]);

  const [ticket, freelancers] = await Promise.all([
    db.ticket.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            businessName: true,
            subscription: { select: { plan: { select: { name: true } } } },
          },
        },
        variant: {
          include: { service: { select: { name: true, slug: true, category: true } } },
        },
        freelancer: { select: { id: true, name: true, email: true, role: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: { sender: { select: { name: true } } },
        },
        deliveries: { orderBy: { round: "asc" } },
        files: true,
      },
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

  if (!ticket) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-[rgba(245,246,252,0.5)] text-lg">
          Ticket no encontrado
        </p>
      </div>
    );
  }

  const serialized = {
    id: ticket.id,
    number: ticket.number,
    status: ticket.status,
    priority: ticket.priority,
    creditsCharged: ticket.creditsCharged,
    clientNotes: ticket.clientNotes,
    pmNotes: ticket.pmNotes,
    briefStructured: ticket.briefStructured as Record<string, unknown> | null,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    assignedAt: ticket.assignedAt?.toISOString() || null,
    startedAt: ticket.startedAt?.toISOString() || null,
    deliveredAt: ticket.deliveredAt?.toISOString() || null,
    completedAt: ticket.completedAt?.toISOString() || null,
    user: {
      name: ticket.user.name,
      email: ticket.user.email,
      businessName: ticket.user.businessName,
      plan: ticket.user.subscription?.plan?.name || null,
    },
    service: {
      name: ticket.variant.service.name,
      slug: ticket.variant.service.slug,
      category: ticket.variant.service.category,
    },
    variant: {
      name: ticket.variant.name,
    },
    freelancer: ticket.freelancer
      ? {
          id: ticket.freelancer.id,
          name: ticket.freelancer.name,
          email: ticket.freelancer.email,
          role: ticket.freelancer.role,
        }
      : null,
    messages: ticket.messages.map((m: any) => ({
      id: m.id,
      content: m.content,
      senderRole: m.senderRole,
      senderName: m.sender.name,
      isInternal: m.isInternal,
      createdAt: m.createdAt.toISOString(),
    })),
    deliveries: ticket.deliveries.map((d: any) => ({
      id: d.id,
      round: d.round,
      status: d.status,
      notes: d.notes,
      fileUrl: d.fileUrl,
      fileName: d.fileName,
      pmApproved: d.pmApproved,
      clientApproved: d.clientApproved,
      pmFeedback: d.pmFeedback,
      clientFeedback: d.clientFeedback,
      createdAt: d.createdAt.toISOString(),
    })),
    files: ticket.files.map((f: any) => ({
      id: f.id,
      name: f.name,
      url: f.url,
      type: f.type,
    })),
  };

  return (
    <TicketAdminClient
      ticket={serialized}
      availableFreelancers={freelancers.map((f: any) => ({
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
