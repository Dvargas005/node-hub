import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePmApiKey } from "@/lib/pm-api-auth";

export async function GET(req: Request) {
  const { error } = await requirePmApiKey(req);
  if (error) return error;

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const clientId = url.searchParams.get("clientId");
    const limit = parseInt(url.searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (clientId) where.userId = clientId;

    const tickets = await db.ticket.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, businessName: true } },
        variant: { include: { service: true } },
        freelancer: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 50),
    });

    const result = tickets.map((t) => ({
      id: t.id,
      number: t.number,
      status: t.status,
      priority: t.priority,
      client: { name: t.user.name, email: t.user.email, business: t.user.businessName },
      service: t.variant?.service?.name || "Unknown",
      variant: t.variant?.name || "Unknown",
      creditsCharged: t.creditsCharged,
      briefSummary:
        (t.briefStructured as Record<string, string> | null)?.summary ||
        "",
      freelancer: t.freelancer?.name || "Unassigned",
      createdAt: t.createdAt,
      completedAt: t.completedAt,
    }));

    return NextResponse.json({ tickets: result, count: result.length });
  } catch (err) {
    console.error("[pm/tickets]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
