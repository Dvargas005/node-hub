import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function GET() {
  const { error, session } = await requireApiRole(["ADMIN", "PM"]);
  if (error || !session) return error;

  try {
    const [newTickets, pendingDeliveries] = await Promise.all([
      db.ticket.count({ where: { status: "NEW" } }),
      db.delivery.count({ where: { status: "PENDING_REVIEW" } }),
    ]);

    return NextResponse.json({ newTickets, pendingDeliveries });
  } catch (err) {
    console.error("[ADMIN_COUNTS]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
