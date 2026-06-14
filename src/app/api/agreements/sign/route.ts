import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { agreementSignedEmail } from "@/lib/email-templates";
import { createNotification } from "@/lib/notifications";

// PUBLIC (token-gated) — the client e-signs their agreement. No session required;
// authorization is the unguessable token from the emailed link.
export async function POST(req: NextRequest) {
  try {
    const { token, signerName, requestedDate, agree } = await req.json();

    if (typeof token !== "string" || !token) return NextResponse.json({ error: "Invalid signing link." }, { status: 400 });
    if (!agree) return NextResponse.json({ error: "You must agree to the terms to sign." }, { status: 400 });
    if (typeof signerName !== "string" || signerName.trim().length < 2)
      return NextResponse.json({ error: "Please type your full name to sign." }, { status: 400 });

    const ag = await db.agreement.findUnique({
      where: { token },
      include: {
        ticket: {
          include: {
            user: { select: { id: true, name: true, email: true, assignedPmId: true } },
            variant: { include: { service: true } },
          },
        },
      },
    });
    if (!ag) return NextResponse.json({ error: "Agreement not found." }, { status: 404 });
    if (ag.status === "SIGNED") return NextResponse.json({ error: "This agreement is already signed." }, { status: 400 });
    if (ag.status !== "SENT") return NextResponse.json({ error: "This agreement isn't available for signing yet." }, { status: 400 });
    if (ag.expiresAt && ag.expiresAt < new Date()) {
      await db.agreement.update({ where: { id: ag.id }, data: { status: "EXPIRED" } });
      return NextResponse.json({ error: "This signing link has expired — please request a new one." }, { status: 400 });
    }

    const reqDate = requestedDate ? new Date(requestedDate) : null;
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;

    await db.agreement.update({
      where: { id: ag.id },
      data: {
        status: "SIGNED",
        signerName: signerName.trim().slice(0, 120),
        signerEmail: ag.ticket.user.email,
        signedAt: new Date(),
        signerIp: ip,
        requestedDate: reqDate && !Number.isNaN(reqDate.getTime()) ? reqDate : null,
      },
    });

    const svc = ag.ticket.variant.service.name;
    const tpl = agreementSignedEmail(ag.ticket.user.name, ag.ticket.number, svc);
    sendEmail(ag.ticket.user.email, tpl.subject, tpl.html);
    if (ag.ticket.user.assignedPmId) {
      createNotification(ag.ticket.user.assignedPmId, {
        title: "Agreement signed",
        message: `Request #${ag.ticket.number} agreement was signed — work can begin.`,
        type: "ticket_update",
        link: `/admin/tickets/${ag.ticketId}`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[AGREEMENT_SIGN]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
