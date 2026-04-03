import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { redirect } from "next/navigation";
import { TicketDetailClient } from "./ticket-detail-client";

export const dynamic = "force-dynamic";

export default async function TicketDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await requireAuth();

  const ticket = await db.ticket.findUnique({
    where: { id: params.id, userId: session.user.id },
    include: {
      variant: { include: { service: true } },
      freelancer: { select: { name: true, role: true } },
      messages: {
        where: { isInternal: false },
        orderBy: { createdAt: "asc" },
        include: { attachments: true },
      },
      deliveries: { orderBy: { round: "desc" } },
      files: true,
    },
  });

  if (!ticket) redirect("/tickets");

  const brief = ticket.briefStructured as Record<string, unknown> | null;
  const details = brief?.details as Record<string, string> | undefined;

  return (
    <TicketDetailClient
      ticket={{
        id: ticket.id,
        number: ticket.number,
        status: ticket.status,
        serviceName: ticket.variant.service.name,
        serviceCategory: ticket.variant.service.category,
        variantName: ticket.variant.name,
        creditsCharged: ticket.creditsCharged,
        summary: (brief?.summary as string) || null,
        briefDetails: details || null,
        clientNotes: ticket.clientNotes,
        freelancerName: ticket.freelancer?.name || null,
        freelancerRole: ticket.freelancer?.role || null,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
      }}
      messages={ticket.messages.map((m: any) => ({
        id: m.id,
        senderRole: m.senderRole,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        attachments: m.attachments.map((a: any) => ({ name: a.name, url: a.url })),
      }))}
      deliveries={ticket.deliveries.map((d: any) => ({
        id: d.id,
        round: d.round,
        status: d.status,
        notes: d.notes,
        fileUrl: d.fileUrl,
        fileName: d.fileName,
        clientFeedback: d.clientFeedback,
        createdAt: d.createdAt.toISOString(),
      }))}
    />
  );
}
