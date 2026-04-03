import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireApiRole(["CLIENT"]);
  if (error || !session) return error;

  try {
    const ticket = await db.ticket.findUnique({
      where: { id: params.id, userId: session.user.id },
    });
    if (!ticket) {
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
    }

    if (!["NEW", "REVIEWING"].includes(ticket.status)) {
      return NextResponse.json(
        { error: "Solo puedes cancelar solicitudes que aún no están en producción" },
        { status: 400 }
      );
    }

    await db.ticket.update({
      where: { id: ticket.id },
      data: { status: "CANCELED" },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[TICKET_CANCEL]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
