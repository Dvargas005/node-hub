import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

const validStatuses = ["NEW", "REVIEWING", "ASSIGNED", "IN_PROGRESS", "DELIVERED", "REVISION", "COMPLETED", "CANCELED"];
const validPriorities = ["LOW", "NORMAL", "HIGH", "URGENT"];
const validCategories = ["DESIGN", "WEB", "MARKETING"];

export async function GET(req: NextRequest) {
  const { error } = await requireApiRole(["ADMIN", "PM"]);
  if (error) return error;

  try {
    const url = req.nextUrl.searchParams;
    const status = url.get("status");
    const priority = url.get("priority");
    const category = url.get("category");
    const page = Math.max(1, parseInt(url.get("page") || "1"));
    const perPage = 20;

    const where: Record<string, unknown> = {};

    if (status && validStatuses.includes(status)) {
      where.status = status;
    }
    if (priority && validPriorities.includes(priority)) {
      where.priority = priority;
    }
    if (category && validCategories.includes(category)) {
      where.variant = { service: { category } };
    }

    const [tickets, total] = await Promise.all([
      db.ticket.findMany({
        where,
        include: {
          user: { select: { name: true, businessName: true, email: true } },
          variant: { include: { service: { select: { name: true, category: true } } } },
          freelancer: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      db.ticket.count({ where }),
    ]);

    return NextResponse.json({
      tickets,
      total,
      page,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (err) {
    console.error("[ADMIN_TICKETS]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
