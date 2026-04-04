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
    const { notes, fileUrl, fileName } = await req.json();

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

    const lastDelivery = await db.delivery.findFirst({
      where: { ticketId: ticket.id },
      orderBy: { round: "desc" },
      select: { round: true },
    });

    const round = lastDelivery ? lastDelivery.round + 1 : 1;

    const delivery = await db.delivery.create({
      data: {
        ticketId: ticket.id,
        round,
        notes: notes || null,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        status: "PENDING_REVIEW",
      },
    });

    return NextResponse.json(delivery);
  } catch (err) {
    console.error("[FREELANCER_TICKET_DELIVERY]", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
