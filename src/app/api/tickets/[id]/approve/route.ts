import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { sendEmail } from "@/lib/email";
import { ticketCompletedEmail } from "@/lib/email-templates";
import { createNotification } from "@/lib/notifications";
import { t, DEFAULT_LANG } from "@/lib/i18n";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const lang = req.cookies.get("node-language")?.value || DEFAULT_LANG;
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
    });

    const tktInfo = await db.ticket.findUnique({
      where: { id: params.id },
      select: {
        number: true,
        userId: true,
        user: { select: { name: true, email: true } },
        variant: { select: { service: { select: { name: true } } } },
      },
    });
    if (tktInfo) {
      const tpl = ticketCompletedEmail(tktInfo.user.name, tktInfo.number, tktInfo.variant.service.name);
      sendEmail(tktInfo.user.email, tpl.subject, tpl.html);
      createNotification(tktInfo.userId, {
        title: t("api.notification.requestCompleted", lang),
        message: `Tu solicitud #${tktInfo.number} ha sido completada`,
        type: "ticket_update",
        link: `/tickets/${params.id}`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "NOT_FOUND") return NextResponse.json({ error: t("api.error.ticketNotFound", lang) }, { status: 404 });
    if (msg === "INVALID_STATUS") return NextResponse.json({ error: t("api.error.noPendingApproval", lang) }, { status: 400 });
    if (msg === "NO_DELIVERY") return NextResponse.json({ error: t("api.error.noPendingApproval", lang) }, { status: 400 });
    console.error("[TICKET_APPROVE]", err);
    return NextResponse.json({ error: t("api.error.internal", lang) }, { status: 500 });
  }
}
