import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireApiRole(["CLIENT"]);
  if (error || !session) return error;

  try {
    const { feedback } = await req.json();
    if (!feedback || typeof feedback !== "string" || feedback.trim().length === 0) {
      return NextResponse.json({ error: "Describe los ajustes que necesitas" }, { status: 400 });
    }

    // I9: all inside transaction
    await db.$transaction(async (tx) => {
      const ticket = await tx.ticket.findUnique({
        where: { id: params.id, userId: session.user.id },
      });
      if (!ticket) throw new Error("NOT_FOUND");
      if (ticket.status !== "DELIVERED") throw new Error("INVALID_STATUS");

      const delivery = await tx.delivery.findFirst({
        where: { ticketId: ticket.id, status: "SENT_TO_CLIENT" },
        orderBy: { round: "desc" },
      });
      if (!delivery) throw new Error("NO_DELIVERY");

      await tx.delivery.update({
        where: { id: delivery.id },
        data: { status: "REVISION_REQUESTED", clientFeedback: feedback.trim().substring(0, 2000) },
      });
      await tx.ticket.update({
        where: { id: ticket.id },
        data: { status: "REVISION" },
      });
      await tx.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: session.user.id,
          senderRole: "CLIENT",
          content: feedback.trim().substring(0, 2000),
          isInternal: false,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "NOT_FOUND") return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
    if (msg === "INVALID_STATUS") return NextResponse.json({ error: "No hay entrega para revisar en este estado" }, { status: 400 });
    if (msg === "NO_DELIVERY") return NextResponse.json({ error: "No hay entrega pendiente" }, { status: 400 });
    console.error("[TICKET_REVISION]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
