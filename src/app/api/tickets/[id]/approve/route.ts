import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { sendEmail } from "@/lib/email";
import { ticketCompletedEmail } from "@/lib/email-templates";
import { createNotification } from "@/lib/notifications";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireApiRole(["CLIENT"]);
  if (error || !session) return error;

  try {
    // I9: all checks + updates inside transaction
    await db.$transaction(async (tx: any) => {
      const ticket = await tx.ticket.findUnique({
        where: { id: params.id, userId: session.user.id },
      });
      if (!ticket) throw new Error("NOT_FOUND");

      // I1: only allow approve on DELIVERED tickets
      if (ticket.status !== "DELIVERED") {
        throw new Error("INVALID_STATUS");
      }

      // I5: only approve deliveries that PM sent to client
      const delivery = await tx.delivery.findFirst({
        where: { ticketId: ticket.id, status: "SENT_TO_CLIENT" },
        orderBy: { round: "desc" },
      });
      if (!delivery) throw new Error("NO_DELIVERY");

      await tx.delivery.update({
        where: { id: delivery.id },
        data: { clientApproved: true, status: "CLIENT_APPROVED" },
      });
      await tx.ticket.update({
        where: { id: ticket.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      });

      // First-round bonus: if approved on round 1 with no revisions
      const brief = ticket.briefStructured as Record<string, unknown> | null;
      const bonus = brief?.firstRoundBonus as number | undefined;
      if (delivery.round === 1 && bonus && bonus > 0) {
        const hadRevisions = await tx.delivery.findFirst({ where: { ticketId: ticket.id, status: "REVISION_REQUESTED" } });
        if (!hadRevisions) {
          await tx.user.update({ where: { id: ticket.userId }, data: { freeCredits: { increment: bonus } } });
          await tx.ticketMessage.create({
            data: { ticketId: ticket.id, senderId: session.user.id, senderRole: "CLIENT", content: `🎉 ¡Bono de ${bonus} créditos por aprobar en primera ronda!`, isInternal: false },
          });
        }
      }
    });

    const tktInfo = await db.ticket.findUnique({
      where: { id: params.id },
      select: {
        number: true,
        briefStructured: true,
        userId: true,
        user: { select: { name: true, email: true } },
        variant: { select: { service: { select: { name: true } } } },
      },
    });
    if (tktInfo) {
      const brief = tktInfo.briefStructured as Record<string, unknown> | null;
      const bonus = brief?.firstRoundBonus as number | undefined;
      const tpl = ticketCompletedEmail(tktInfo.user.name, tktInfo.number, tktInfo.variant.service.name, bonus);
      sendEmail(tktInfo.user.email, tpl.subject, tpl.html);
      createNotification(tktInfo.userId, {
        title: "Solicitud completada",
        message: `Tu solicitud #${tktInfo.number} ha sido completada`,
        type: "ticket_update",
        link: `/tickets/${params.id}`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "NOT_FOUND") return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
    if (msg === "INVALID_STATUS") return NextResponse.json({ error: "No se puede aprobar en este estado" }, { status: 400 });
    if (msg === "NO_DELIVERY") return NextResponse.json({ error: "No hay entrega pendiente de aprobación" }, { status: 400 });
    console.error("[TICKET_APPROVE]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
