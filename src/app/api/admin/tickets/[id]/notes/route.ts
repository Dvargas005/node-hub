import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireApiRole(["ADMIN", "PM"]);
  if (error || !session) return error;

  try {
    const { pmNotes } = await req.json();
    const ticketId = params.id;

    if (typeof pmNotes !== "string") {
      return NextResponse.json({ error: "pmNotes es requerido" }, { status: 400 });
    }

    const ticket = await db.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
    }

    const updated = await db.ticket.update({
      where: { id: ticketId },
      data: { pmNotes },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[TICKET_NOTES]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
