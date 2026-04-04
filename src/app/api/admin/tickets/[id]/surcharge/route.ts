import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireApiRole(["ADMIN", "PM"]);
  if (error) return error;

  try {
    const { amount, reason } = await req.json();
    const ticketId = params.id;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "El monto debe ser mayor a 0" },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== "string") {
      return NextResponse.json(
        { error: "La razón es requerida" },
        { status: 400 }
      );
    }

    await db.$transaction(async (tx: any) => {
      const ticket = await tx.ticket.findUnique({ where: { id: ticketId } });
      if (!ticket) throw new Error("NOT_FOUND");

      // Deduct credits from user
      const user = await tx.user.findUnique({
        where: { id: ticket.userId },
        select: { freeCredits: true },
      });
      const sub = await tx.subscription.findUnique({
        where: { userId: ticket.userId },
      });

      let remaining = amount;
      const freeCredits = user?.freeCredits || 0;
      if (freeCredits > 0) {
        const fromFree = Math.min(freeCredits, remaining);
        await tx.user.update({
          where: { id: ticket.userId },
          data: { freeCredits: { decrement: fromFree } },
        });
        remaining -= fromFree;
      }
      if (remaining > 0 && sub) {
        await tx.subscription.update({
          where: { id: sub.id },
          data: { creditsRemaining: { decrement: remaining } },
        });
      }

      await tx.ticketSurcharge.create({
        data: {
          ticketId,
          amount,
          reason,
          addedBy: session!.user.id,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "NOT_FOUND") {
      return NextResponse.json(
        { error: "Ticket no encontrado" },
        { status: 404 }
      );
    }
    console.error("[TICKET_SURCHARGE]", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
