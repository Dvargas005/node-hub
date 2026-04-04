import { db } from "@/lib/db";
import { requireRole, getViewAsRole } from "@/lib/session";
import { TicketFreelancerClient } from "./ticket-freelancer-client";

export const dynamic = "force-dynamic";

export default async function FreelancerTicketDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await requireRole(["FREELANCER"]);
  const realRole = (session.user as Record<string, unknown>).role as string;
  const viewAs = await getViewAsRole();
  const isImpersonating = realRole === "ADMIN" && viewAs === "FREELANCER";

  const freelancer = isImpersonating
    ? await db.freelancer.findFirst({ orderBy: { createdAt: "asc" } })
    : await db.freelancer.findUnique({ where: { userId: session.user.id } });

  if (!freelancer) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-[rgba(245,246,252,0.5)] text-lg">
          Perfil de freelancer no encontrado.
        </p>
      </div>
    );
  }

  const ticket = await db.ticket.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { name: true, businessName: true } },
      variant: { include: { service: { select: { name: true } } } },
      messages: {
        where: { isInternal: true },
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { name: true } } },
      },
      deliveries: { orderBy: { round: "asc" } },
      files: true,
    },
  });

  // For impersonation, allow viewing any ticket assigned to the impersonated freelancer
  if (!ticket || ticket.freelancerId !== freelancer.id) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-[rgba(245,246,252,0.5)] text-lg">
          Ticket no encontrado o sin permisos.
        </p>
      </div>
    );
  }

  const serialized = {
    id: ticket.id,
    number: ticket.number,
    status: ticket.status,
    priority: ticket.priority,
    pmNotes: ticket.pmNotes,
    briefStructured: ticket.briefStructured as Record<string, unknown> | null,
    assignedAt: ticket.assignedAt?.toISOString() || null,
    startedAt: ticket.startedAt?.toISOString() || null,
    deliveredAt: ticket.deliveredAt?.toISOString() || null,
    completedAt: ticket.completedAt?.toISOString() || null,
    serviceName: ticket.variant.service.name,
    variantName: ticket.variant.name,
    clientName: ticket.user.name,
    businessName: ticket.user.businessName,
    messages: ticket.messages.map((m: any) => ({
      id: m.id,
      content: m.content,
      senderRole: m.senderRole,
      senderName: m.sender.name,
      createdAt: m.createdAt.toISOString(),
    })),
    deliveries: ticket.deliveries.map((d: any) => ({
      id: d.id,
      round: d.round,
      status: d.status,
      notes: d.notes,
      fileUrl: d.fileUrl,
      fileName: d.fileName,
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

  return <TicketFreelancerClient ticket={serialized} />;
}
