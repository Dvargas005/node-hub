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
    const { deliveryId } = await req.json();
    const ticketId = params.id;

    if (!deliveryId) {
      return NextResponse.json({ error: "deliveryId es requerido" }, { status: 400 });
    }

    const delivery = await db.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery || delivery.ticketId !== ticketId) {
      return NextResponse.json({ error: "Entrega no encontrada" }, { status: 404 });
    }

    const [updatedDelivery, updatedTicket] = await Promise.all([
      db.delivery.update({
        where: { id: deliveryId },
        data: {
          status: "SENT_TO_CLIENT",
          pmApproved: true,
        },
      }),
      db.ticket.update({
        where: { id: ticketId },
        data: {
          status: "DELIVERED",
          deliveredAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({ delivery: updatedDelivery, ticket: updatedTicket });
  } catch (err) {
    console.error("[SEND_TO_CLIENT]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
