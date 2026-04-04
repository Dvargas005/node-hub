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

      // Add credits back to user (plan first, then free)
      const sub = await tx.subscription.findUnique({
        where: { userId: ticket.userId },
      });

      let remaining = amount;
      if (sub) {
        const planCredits = sub.creditsRemaining || 0;
        const plan = await tx.plan.findUnique({ where: { id: sub.planId } });
        const maxCredits = plan ? plan.monthlyCredits + plan.bonusCredits : Infinity;
        const canAddToPlan = Math.min(remaining, maxCredits - planCredits);
        if (canAddToPlan > 0) {
          await tx.subscription.update({
            where: { id: sub.id },
            data: { creditsRemaining: { increment: canAddToPlan } },
          });
          remaining -= canAddToPlan;
        }
      }
      if (remaining > 0) {
        await tx.user.update({
          where: { id: ticket.userId },
          data: { freeCredits: { increment: remaining } },
        });
      }

      await tx.ticketSurcharge.create({
        data: {
          ticketId,
          amount: -amount,
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
    console.error("[TICKET_REFUND]", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
