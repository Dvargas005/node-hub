import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function GET() {
  const { error, session } = await requireApiRole(["ADMIN", "PM"]);
  if (error || !session) return error;

  try {
    const role = (session.user as Record<string, unknown>).role as string;
    const pmFilter = role === "PM" ? { user: { assignedPmId: session.user.id } } : {};

    const [newTickets, pendingDeliveries, unreadMessages] = await Promise.all([
      db.ticket.count({ where: { status: "NEW", ...pmFilter } }),
      db.delivery.count({ where: { status: "PENDING_REVIEW", ticket: pmFilter } }),
      db.directMessage.count({ where: { receiverId: session.user.id, read: false } }),
    ]);

    return NextResponse.json({ newTickets, pendingDeliveries, unreadMessages });
  } catch (err) {
    console.error("[ADMIN_COUNTS]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
