import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

const validTransitions: Record<string, string[]> = {
  NEW: ["REVIEWING", "CANCELED"],
  REVIEWING: ["ASSIGNED", "CANCELED"],
  ASSIGNED: ["IN_PROGRESS", "CANCELED"],
  IN_PROGRESS: ["DELIVERED", "REVISION"],
  DELIVERED: ["COMPLETED", "REVISION"],
  REVISION: ["IN_PROGRESS"],
};

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireApiRole(["ADMIN", "PM"]);
  if (error || !session) return error;

  try {
    const { status } = await req.json();
    const ticketId = params.id;

    const ticket = await db.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
    }

    const allowed = validTransitions[ticket.status];
    if (!allowed || !allowed.includes(status)) {
      return NextResponse.json(
        { error: `Transición no válida: ${ticket.status} → ${status}` },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = { status };

    if (status === "IN_PROGRESS") {
      data.startedAt = new Date();
    }
    if (status === "DELIVERED") {
      data.deliveredAt = new Date();
    }
    if (status === "COMPLETED") {
      data.completedAt = new Date();
    }

    const updated = await db.ticket.update({
      where: { id: ticketId },
      data,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[TICKET_STATUS]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
