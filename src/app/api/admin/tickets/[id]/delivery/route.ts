import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireApiRole(["ADMIN", "PM"]);
  if (error || !session) return error;

  try {
    const { notes, fileUrl, fileName } = await req.json();

    if (fileUrl && typeof fileUrl === "string" && !fileUrl.startsWith("https://")) {
      return NextResponse.json({ error: "El link debe empezar con https://" }, { status: 400 });
    }

    const ticketId = params.id;

    const ticket = await db.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
    }

    if (!["IN_PROGRESS", "REVISION"].includes(ticket.status)) {
      return NextResponse.json({ error: "Ticket no está en estado válido para subir entrega" }, { status: 400 });
    }

    const lastDelivery = await db.delivery.findFirst({
      where: { ticketId },
      orderBy: { round: "desc" },
      select: { round: true },
    });

    const round = lastDelivery ? lastDelivery.round + 1 : 1;

    const delivery = await db.delivery.create({
      data: {
        ticketId,
        round,
        notes: notes || null,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        status: "PENDING_REVIEW",
      },
    });

    return NextResponse.json(delivery);
  } catch (err) {
    console.error("[TICKET_DELIVERY]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
