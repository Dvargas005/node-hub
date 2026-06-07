import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePmApiKey } from "@/lib/pm-api-auth";

const VALID_STATUSES = [
  "NEW", "REVIEWING", "ASSIGNED", "IN_PROGRESS",
  "DELIVERED", "COMPLETED", "REVISION", "CANCELED",
];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requirePmApiKey(req);
  if (error) return error;

  try {
    const { id } = await params;
    const { status, note } = await req.json();

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Valid: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const ticket = await db.ticket.findUnique({ where: { id } });
    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    const data: Record<string, unknown> = { status };
    if (status === "COMPLETED") data.completedAt = new Date();
    if (note) data.pmNotes = ticket.pmNotes ? `${ticket.pmNotes}\n---\n${note}` : note;

    await db.ticket.update({ where: { id }, data });

    return NextResponse.json({ success: true, ticketId: id, newStatus: status });
  } catch (err) {
    console.error("[pm/tickets/[id]/status]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
