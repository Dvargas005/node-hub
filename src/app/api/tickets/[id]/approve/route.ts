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
      include: { deliveries: { orderBy: { round: "desc" }, take: 1 } },
    });
    if (!ticket) {
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
    }

    const delivery = ticket.deliveries[0];
    if (!delivery || !["SENT_TO_CLIENT", "PENDING_REVIEW", "PM_APPROVED"].includes(delivery.status)) {
      return NextResponse.json({ error: "No hay entrega pendiente de aprobación" }, { status: 400 });
    }

    await db.$transaction(async (tx) => {
      await tx.delivery.update({
        where: { id: delivery.id },
        data: { clientApproved: true, status: "CLIENT_APPROVED" },
      });
      await tx.ticket.update({
        where: { id: ticket.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[TICKET_APPROVE]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
