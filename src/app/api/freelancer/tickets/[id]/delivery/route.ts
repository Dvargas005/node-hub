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

    // S3: Validate file URL
    if (fileUrl && typeof fileUrl === "string" && !fileUrl.startsWith("https://")) {
      return NextResponse.json({ error: "URL debe empezar con https://" }, { status: 400 });
    }
    // I13: fileUrl is required
    if (!fileUrl || typeof fileUrl !== "string" || !fileUrl.startsWith("https://")) {
      return NextResponse.json({ error: "URL del archivo es requerida (https://)" }, { status: 400 });
    }

    const delivery = await db.$transaction(async (tx: any) => {
      const fl = await tx.freelancer.findUnique({ where: { userId: session.user.id } });
      if (!fl) throw new Error("NO_FREELANCER");

      const ticket = await tx.ticket.findUnique({ where: { id: params.id } });
      if (!ticket) throw new Error("NOT_FOUND");
      if (ticket.freelancerId !== fl.id) throw new Error("FORBIDDEN");
      if (!["IN_PROGRESS", "REVISION"].includes(ticket.status)) throw new Error("INVALID_STATUS");

      const lastDelivery = await tx.delivery.findFirst({ where: { ticketId: ticket.id }, orderBy: { round: "desc" }, select: { round: true } });
      return await tx.delivery.create({
        data: { ticketId: ticket.id, round: (lastDelivery?.round || 0) + 1, notes: notes || null, fileUrl, fileName: fileName || null, status: "PENDING_REVIEW" },
      });
    });

    return NextResponse.json(delivery);
  } catch (err: any) {
    if (err?.message === "NO_FREELANCER") {
      return NextResponse.json({ error: "Perfil de freelancer no encontrado" }, { status: 404 });
    }
    if (err?.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
    }
    if (err?.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Sin permisos para este ticket" }, { status: 403 });
    }
    if (err?.message === "INVALID_STATUS") {
      return NextResponse.json({ error: "El ticket no está en estado válido para entregar" }, { status: 400 });
    }
    console.error("[FREELANCER_TICKET_DELIVERY]", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
