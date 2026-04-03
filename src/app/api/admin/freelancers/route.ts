import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

const validRoles = ["GRAPHIC_DESIGNER", "AI_DEVELOPER", "COMMUNITY_MANAGER"];
const validAvailability = ["AVAILABLE", "BUSY", "ON_LEAVE", "INACTIVE"];

export async function GET(req: NextRequest) {
  const { error, session } = await requireApiRole(["ADMIN", "PM"]);
  if (error || !session) return error;

  try {
    const userRole = (session.user as Record<string, unknown>).role as string;
    const url = req.nextUrl.searchParams;
    const role = url.get("role");
    const availability = url.get("availability");
    const page = Math.max(1, parseInt(url.get("page") || "1"));
    const perPage = 20;

    const where: Record<string, unknown> = {};

    if (role && validRoles.includes(role)) {
      where.role = role;
    }
    if (availability && validAvailability.includes(availability)) {
      where.availability = availability;
    }

    const [freelancers, total] = await Promise.all([
      db.freelancer.findMany({
        where,
        include: { pm: { select: { name: true } } },
        orderBy: { name: "asc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      db.freelancer.count({ where }),
    ]);

    const sanitized = userRole === "ADMIN"
      ? freelancers
      : freelancers.map(({ monthlySalary: _, ...rest }: any) => rest);

    return NextResponse.json({
      freelancers: sanitized,
      total,
      page,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (err) {
    console.error("[ADMIN_FREELANCERS]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
