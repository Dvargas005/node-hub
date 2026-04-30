import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { t, DEFAULT_LANG } from "@/lib/i18n";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const lang = req.cookies.get("node-language")?.value || DEFAULT_LANG;
  const { error, session } = await requireApiRole(["CLIENT"]);
  if (error || !session) return error;

  try {
    const { content } = await req.json();
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: t("api.error.messageRequired", lang) }, { status: 400 });
    }

    const ticket = await db.ticket.findUnique({
      where: { id: params.id, userId: session.user.id },
    });
    if (!ticket) {
      return NextResponse.json({ error: t("api.error.ticketNotFound", lang) }, { status: 404 });
    }
    if (["COMPLETED", "CANCELED"].includes(ticket.status)) {
      return NextResponse.json({ error: t("api.error.ticketNotFound", lang) }, { status: 400 });
    }

    const message = await db.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: session.user.id,
        senderRole: "CLIENT",
        content: content.trim().substring(0, 2000),
        isInternal: false,
      },
    });

    return NextResponse.json({ message });
  } catch (err) {
    console.error("[TICKET_MESSAGE]", err);
    return NextResponse.json({ error: t("api.error.internal", lang) }, { status: 500 });
  }
}
