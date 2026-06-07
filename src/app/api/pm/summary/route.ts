import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePmApiKey } from "@/lib/pm-api-auth";

export async function GET(req: Request) {
  const { error } = await requirePmApiKey(req);
  if (error) return error;

  try {
    const [
      activeClients,
      prospects,
      newTickets,
      inProgressTickets,
      deliveredTickets,
      unreadMessages,
    ] = await Promise.all([
      db.user.count({ where: { role: "CLIENT", userTag: null, subscription: { status: "ACTIVE" } } }),
      db.user.count({
        where: {
          role: "CLIENT",
          userTag: null,
          OR: [{ subscription: null }, { subscription: { status: { not: "ACTIVE" } } }],
        },
      }),
      db.ticket.count({ where: { status: "NEW" } }),
      db.ticket.count({ where: { status: { in: ["IN_PROGRESS", "REVIEWING", "ASSIGNED"] } } }),
      db.ticket.count({ where: { status: "DELIVERED" } }),
      db.directMessage.count({ where: { read: false } }),
    ]);

    return NextResponse.json({
      summary: {
        activeClients,
        prospects,
        tickets: { new: newTickets, inProgress: inProgressTickets, delivered: deliveredTickets },
        unreadMessages,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[pm/summary]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
