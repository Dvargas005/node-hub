import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { t, DEFAULT_LANG } from "@/lib/i18n";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireApiRole(["FREELANCER"]);
  if (error || !session) return error;

  const lang = req.cookies.get("node-language")?.value || DEFAULT_LANG;

  try {
    const { content } = await req.json();
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: t("api.error.messageRequired", lang) },
        { status: 400 }
      );
    }

    const freelancer = await db.freelancer.findUnique({
      where: { userId: session.user.id },
    });
    if (!freelancer) {
      return NextResponse.json(
        { error: t("api.error.freelancerNotFound", lang) },
        { status: 404 }
      );
    }

    const ticket = await db.ticket.findUnique({
      where: { id: params.id },
    });
    if (!ticket) {
      return NextResponse.json(
        { error: t("api.error.ticketNotFound", lang) },
        { status: 404 }
      );
    }

    if (ticket.freelancerId !== freelancer.id) {
      return NextResponse.json(
        { error: t("api.error.noPermission", lang) },
        { status: 403 }
      );
    }

    if (["COMPLETED", "CANCELED"].includes(ticket.status)) {
      return NextResponse.json({ error: "No se pueden enviar mensajes en tickets cerrados" }, { status: 400 });
    }

    const message = await db.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: session.user.id,
        senderRole: "FREELANCER",
        content: content.trim().substring(0, 2000),
        isInternal: true,
      },
    });

    return NextResponse.json({ message });
  } catch (err) {
    console.error("[FREELANCER_TICKET_MESSAGE]", err);
    return NextResponse.json(
      { error: t("api.error.internal", lang) },
      { status: 500 }
    );
  }
}
