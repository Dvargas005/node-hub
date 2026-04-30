import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { sendEmail } from "@/lib/email";
import { deliveryReadyEmail } from "@/lib/email-templates";
import { createNotification } from "@/lib/notifications";
import { t, DEFAULT_LANG } from "@/lib/i18n";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireApiRole(["ADMIN", "PM"]);
  if (error || !session) return error;

  const lang = req.cookies.get("node-language")?.value || DEFAULT_LANG;

  try {
    const { deliveryId } = await req.json();
    const ticketId = params.id;

    if (!deliveryId) {
      return NextResponse.json({ error: "deliveryId es requerido" }, { status: 400 });
    }

    await db.$transaction(async (tx: any) => {
      const ticket = await tx.ticket.findUnique({ where: { id: ticketId } });
      if (!ticket || !["IN_PROGRESS", "REVISION"].includes(ticket.status)) {
        throw new Error("INVALID_STATUS");
      }
      const delivery = await tx.delivery.findUnique({ where: { id: deliveryId } });
      if (!delivery || delivery.ticketId !== ticketId) {
        throw new Error("NOT_FOUND");
      }
      if (delivery.status !== "PENDING_REVIEW") {
        throw new Error("DELIVERY_NOT_PENDING");
      }
      await tx.delivery.update({ where: { id: deliveryId }, data: { status: "SENT_TO_CLIENT", pmApproved: true } });
      await tx.ticket.update({ where: { id: ticketId }, data: { status: "DELIVERED", deliveredAt: new Date() } });
    });

    const ticketInfo = await db.ticket.findUnique({
      where: { id: ticketId },
      select: {
        number: true,
        userId: true,
        user: { select: { name: true, email: true } },
        variant: { select: { service: { select: { name: true } } } },
      },
    });
    if (ticketInfo) {
      const tpl = deliveryReadyEmail(ticketInfo.user.name, ticketInfo.number, ticketInfo.variant.service.name);
      sendEmail(ticketInfo.user.email, tpl.subject, tpl.html);
      createNotification(ticketInfo.userId, {
        title: t("api.notification.deliveryReady", lang),
        message: t("api.notification.deliveryReadyDetail", lang).replace("{number}", String(ticketInfo.number)),
        type: "delivery",
        link: `/tickets/${ticketId}`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err?.message === "INVALID_STATUS") {
      return NextResponse.json({ error: "El ticket no está en estado válido para enviar" }, { status: 400 });
    }
    if (err?.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Entrega no encontrada" }, { status: 404 });
    }
    if (err?.message === "DELIVERY_NOT_PENDING") {
      return NextResponse.json({ error: "La entrega no está pendiente de revisión" }, { status: 400 });
    }
    console.error("[SEND_TO_CLIENT]", err);
    return NextResponse.json({ error: t("api.error.internal", lang) }, { status: 500 });
  }
}
