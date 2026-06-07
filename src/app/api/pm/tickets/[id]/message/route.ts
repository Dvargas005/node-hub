import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePmApiKey } from "@/lib/pm-api-auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, pmUserId } = await requirePmApiKey(req);
  if (error) return error;

  try {
    const { id } = await params;
    const { content, isInternal } = await req.json();

    if (!content) return NextResponse.json({ error: "Content required" }, { status: 400 });

    const ticket = await db.ticket.findUnique({ where: { id } });
    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    const message = await db.ticketMessage.create({
      data: {
        ticketId: id,
        senderId: pmUserId!,
        senderRole: "ADMIN",
        content,
        isInternal: isInternal || false,
      },
    });

    if (!isInternal) {
      await db.notification
        .create({
          data: {
            userId: ticket.userId,
            title: "New message on your request",
            message: `Your PM sent a message on request #${ticket.number}`,
            type: "message",
            link: `/tickets/${ticket.id}`,
          },
        })
        .catch(() => {});
    }

    return NextResponse.json({ success: true, messageId: message.id });
  } catch (err) {
    console.error("[pm/tickets/[id]/message]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
