import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function GET() {
  const { error } = await requireApiRole(["ADMIN", "PM"]);
  if (error) return error;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [activeClients, openTickets, deliveredThisMonth, creditsConsumed] =
    await Promise.all([
      db.subscription.count({ where: { status: "ACTIVE" } }),
      db.ticket.count({
        where: { status: { notIn: ["COMPLETED", "CANCELED"] } },
      }),
      db.ticket.count({
        where: {
          status: "DELIVERED",
          deliveredAt: { gte: startOfMonth },
        },
      }),
      db.ticket.aggregate({
        where: {
          status: "COMPLETED",
          completedAt: { gte: startOfMonth },
        },
        _sum: { creditsCharged: true },
      }),
    ]);

  return NextResponse.json({
    activeClients,
    openTickets,
    deliveredThisMonth,
    creditsConsumed: creditsConsumed._sum.creditsCharged || 0,
  });
}
