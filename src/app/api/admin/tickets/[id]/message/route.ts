import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { Role } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireApiRole(["ADMIN", "PM"]);
  if (error || !session) return error;

  try {
    const { content, isInternal } = await req.json();
    const ticketId = params.id;

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "El contenido es requerido" }, { status: 400 });
    }

    const ticket = await db.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
    }

    const message = await db.ticketMessage.create({
      data: {
        ticketId,
        senderId: session.user.id,
        senderRole: (session.user as Record<string, unknown>).role as Role,
        content,
        isInternal: Boolean(isInternal),
      },
    });

    return NextResponse.json(message);
  } catch (err) {
    console.error("[TICKET_MESSAGE]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
