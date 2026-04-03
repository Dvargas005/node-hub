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

    const ticket = await db.ticket.findUnique({
      where: { id: params.id, userId: session.user.id },
      include: { deliveries: { orderBy: { round: "desc" }, take: 1 } },
    });
    if (!ticket) {
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
    }

    const delivery = ticket.deliveries[0];
    if (!delivery) {
      return NextResponse.json({ error: "No hay entrega para revisar" }, { status: 400 });
    }

    await db.$transaction(async (tx) => {
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
    console.error("[TICKET_REVISION]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
