import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireApiRole(["FREELANCER"]);
  if (error || !session) return error;

  try {
    const freelancer = await db.freelancer.findUnique({
      where: { userId: session.user.id },
    });
    if (!freelancer) {
      return NextResponse.json(
        { error: "Perfil de freelancer no encontrado" },
        { status: 404 }
      );
    }

    const ticket = await db.ticket.findUnique({
      where: { id: params.id },
      select: {
        id: true, number: true, status: true, priority: true, pmNotes: true,
        briefStructured: true, assignedAt: true, startedAt: true, deliveredAt: true,
        createdAt: true, updatedAt: true, freelancerId: true,
        user: { select: { name: true, businessName: true } },
        variant: { select: { name: true, service: { select: { name: true, category: true } } } },
        messages: { where: { isInternal: true }, orderBy: { createdAt: "asc" }, select: { id: true, content: true, senderRole: true, senderId: true, isInternal: true, createdAt: true, sender: { select: { name: true } } } },
        deliveries: { orderBy: { round: "desc" }, select: { id: true, round: true, status: true, notes: true, fileUrl: true, fileName: true, pmFeedback: true, clientFeedback: true, createdAt: true } },
        files: { select: { id: true, name: true, url: true, type: true } },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket no encontrado" },
        { status: 404 }
      );
    }

    if (ticket.freelancerId !== freelancer.id) {
      return NextResponse.json(
        { error: "Sin permisos para este ticket" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ...ticket,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      assignedAt: ticket.assignedAt?.toISOString() || null,
      startedAt: ticket.startedAt?.toISOString() || null,
      deliveredAt: ticket.deliveredAt?.toISOString() || null,
      messages: ticket.messages.map((m: any) => ({ ...m, createdAt: m.createdAt.toISOString() })),
      deliveries: ticket.deliveries.map((d: any) => ({ ...d, createdAt: d.createdAt.toISOString() })),
    });
  } catch (err) {
    console.error("[FREELANCER_TICKET_DETAIL]", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
