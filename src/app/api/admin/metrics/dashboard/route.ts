import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function GET() {
  const { error } = await requireApiRole(["ADMIN"]);
  if (error) return error;

  try {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Revenue
    const activeSubs = await db.subscription.findMany({
      where: { status: "ACTIVE" },
      include: { plan: { select: { priceMonthly: true } } },
    });
    const mrr = activeSubs.reduce((sum: any, s: any) => sum + s.plan.priceMonthly, 0);

    // Tickets
    const [ticketsThisMonth, ticketsLastMonth, completedThisMonth, completedLastMonth] =
      await Promise.all([
        db.ticket.count({ where: { createdAt: { gte: thisMonthStart } } }),
        db.ticket.count({ where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } } }),
        db.ticket.count({ where: { status: "COMPLETED", completedAt: { gte: thisMonthStart } } }),
        db.ticket.count({ where: { status: "COMPLETED", completedAt: { gte: lastMonthStart, lt: thisMonthStart } } }),
      ]);

    // Avg delivery time (days)
    const completedTickets = await db.ticket.findMany({
      where: { status: "COMPLETED", completedAt: { gte: thisMonthStart } },
      select: { createdAt: true, completedAt: true },
    });
    const avgDays =
      completedTickets.length > 0
        ? Math.round(
            (completedTickets.reduce(
              (sum: any, t: any) =>
                sum + (t.completedAt!.getTime() - t.createdAt.getTime()) / 86400000,
              0,
            ) /
              completedTickets.length) *
              10,
          ) / 10
        : 0;

    // First round approval rate
    const approvedFirst = await db.ticket.count({
      where: {
        status: "COMPLETED",
        completedAt: { gte: thisMonthStart },
        deliveries: { every: { round: 1 } },
      },
    });
    const firstRoundRate =
      completedThisMonth > 0 ? Math.round((approvedFirst / completedThisMonth) * 100) : 0;

    // Clients
    const totalClients = await db.user.count({ where: { role: "CLIENT" } });
    const activeClients = activeSubs.length;
    const newClientsThisMonth = await db.user.count({
      where: { role: "CLIENT", createdAt: { gte: thisMonthStart } },
    });
    const canceledThisMonth = await db.subscription.count({
      where: { status: "CANCELED", canceledAt: { gte: thisMonthStart } },
    });
    const activeStartOfMonth = activeClients + canceledThisMonth;
    const churnRate =
      activeStartOfMonth > 0 ? Math.round((canceledThisMonth / activeStartOfMonth) * 100) : 0;

    // Team
    const freelancerStats = await db.freelancer.findMany({
      select: {
        name: true,
        availability: true,
        currentLoad: true,
        clientCapacity: true,
        _count: {
          select: {
            tickets: { where: { status: "COMPLETED", completedAt: { gte: thisMonthStart } } },
          },
        },
      },
      orderBy: { name: "asc" },
    });
    const activeFreelancers = freelancerStats.filter(
      (f: any) => f.availability === "AVAILABLE" || f.availability === "BUSY",
    ).length;
    const avgLoad =
      freelancerStats.length > 0
        ? Math.round(
            (freelancerStats.reduce(
              (sum: any, f: any) => sum + (f.clientCapacity > 0 ? f.currentLoad / f.clientCapacity : 0),
              0,
            ) /
              freelancerStats.length) *
              100,
          )
        : 0;

    return NextResponse.json({
      revenue: { mrr, mrrFormatted: `$${(mrr / 100).toLocaleString()}` },
      tickets: {
        thisMonth: ticketsThisMonth,
        lastMonth: ticketsLastMonth,
        completedThisMonth,
        completedLastMonth,
        avgDeliveryDays: avgDays,
        firstRoundRate,
      },
      clients: {
        total: totalClients,
        active: activeClients,
        newThisMonth: newClientsThisMonth,
        churnRate,
      },
      team: {
        totalFreelancers: freelancerStats.length,
        activeFreelancers,
        avgLoad,
        topFreelancers: freelancerStats
          .sort((a: any, b: any) => b._count.tickets - a._count.tickets)
          .slice(0, 5)
          .map((f: any) => ({ name: f.name, completed: f._count.tickets })),
      },
    });
  } catch (err) {
    console.error("[ADMIN_METRICS_DASHBOARD]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
