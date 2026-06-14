import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { sendEmail } from "@/lib/email";
import { agreementToSignEmail } from "@/lib/email-templates";
import { createNotification } from "@/lib/notifications";

// PM/Admin sends (or re-sends) the agreement to the client for e-signature.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireApiRole(["ADMIN", "PM"]);
  if (error || !session) return error;

  try {
    const ag = await db.agreement.findUnique({
      where: { id: params.id },
      include: {
        ticket: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            variant: { include: { service: true } },
          },
        },
      },
    });
    if (!ag) return NextResponse.json({ error: "Agreement not found" }, { status: 404 });
    if (ag.status === "SIGNED") return NextResponse.json({ error: "Agreement is already signed" }, { status: 400 });

    const updated = await db.agreement.update({
      where: { id: ag.id },
      data: { status: "SENT", sentAt: new Date(), expiresAt: new Date(Date.now() + 30 * 86_400_000) },
    });

    const svc = ag.ticket.variant.service.name;
    const tpl = agreementToSignEmail(ag.ticket.user.name, ag.ticket.number, svc, ag.token);
    sendEmail(ag.ticket.user.email, tpl.subject, tpl.html);
    createNotification(ag.ticket.user.id, {
      title: "Please sign your service agreement",
      message: `Your agreement for request #${ag.ticket.number} is ready to review and sign.`,
      type: "ticket_update",
      link: "/tickets",
    });

    return NextResponse.json({ agreement: updated });
  } catch (e) {
    console.error("[AGREEMENT_SEND]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
