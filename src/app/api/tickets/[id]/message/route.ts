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
    const { content } = await req.json();
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "Mensaje requerido" }, { status: 400 });
    }

    const ticket = await db.ticket.findUnique({
      where: { id: params.id, userId: session.user.id },
    });
    if (!ticket) {
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
    }

    const message = await db.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: session.user.id,
        senderRole: "CLIENT",
        content: content.trim().substring(0, 2000),
        isInternal: false,
      },
    });

    return NextResponse.json({ message });
  } catch (err) {
    console.error("[TICKET_MESSAGE]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
