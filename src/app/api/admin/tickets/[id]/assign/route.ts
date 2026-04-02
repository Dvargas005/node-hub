import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireApiRole(["ADMIN", "PM"]);
  if (error) return error;

  const { freelancerId } = await req.json();
  const ticketId = params.id;

  const ticket = await db.ticket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
  }

  if (ticket.freelancerId) {
    return NextResponse.json(
      { error: "Este ticket ya tiene un freelancer asignado" },
      { status: 400 }
    );
  }

  const freelancer = await db.freelancer.findUnique({
    where: { id: freelancerId },
  });

  if (!freelancer) {
    return NextResponse.json({ error: "Freelancer no encontrado" }, { status: 404 });
  }

  if (freelancer.availability !== "AVAILABLE") {
    return NextResponse.json(
      { error: "Este freelancer no está disponible" },
      { status: 400 }
    );
  }

  const newLoad = freelancer.currentLoad + 1;

  const [updatedTicket] = await Promise.all([
    db.ticket.update({
      where: { id: ticketId },
      data: {
        freelancerId,
        status: "ASSIGNED",
        assignedAt: new Date(),
      },
      include: {
        user: { select: { name: true } },
        variant: { include: { service: { select: { name: true } } } },
        freelancer: { select: { name: true } },
      },
    }),
    db.freelancer.update({
      where: { id: freelancerId },
      data: {
        currentLoad: newLoad,
        availability:
          newLoad >= freelancer.clientCapacity ? "BUSY" : "AVAILABLE",
      },
    }),
  ]);

  return NextResponse.json(updatedTicket);
}
