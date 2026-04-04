import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireApiRole(["FREELANCER"]);
  if (error || !session) return error;

  try {
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
      include: {
        user: { select: { name: true, businessName: true } },
        variant: {
          include: { service: { select: { name: true, category: true } } },
        },
        messages: { where: { isInternal: true }, orderBy: { createdAt: "asc" } },
        deliveries: { orderBy: { round: "desc" } },
        files: true,
      },
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

    return NextResponse.json({
      ...ticket,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
    });
  } catch (err) {
    console.error("[FREELANCER_TICKET_DETAIL]", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
