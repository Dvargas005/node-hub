import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireApiRole(["FREELANCER"]);
  if (error || !session) return error;

  try {
    const { content } = await req.json();
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Mensaje requerido" },
        { status: 400 }
      );
    }

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

    if (["COMPLETED", "CANCELED"].includes(ticket.status)) {
      return NextResponse.json({ error: "No se pueden enviar mensajes en tickets cerrados" }, { status: 400 });
    }

    const message = await db.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: session.user.id,
        senderRole: "FREELANCER",
        content: content.trim().substring(0, 2000),
        isInternal: true,
      },
    });

    return NextResponse.json({ message });
  } catch (err) {
    console.error("[FREELANCER_TICKET_MESSAGE]", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
