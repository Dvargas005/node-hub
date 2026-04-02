import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const { error } = await requireApiRole(["ADMIN", "PM"]);
  if (error) return error;

  const url = req.nextUrl.searchParams;
  const role = url.get("role");
  const availability = url.get("availability");
  const page = parseInt(url.get("page") || "1");
  const perPage = 20;

  const where: Record<string, unknown> = {};

  if (role) {
    where.role = role;
  }
  if (availability) {
    where.availability = availability;
  }

  const [freelancers, total] = await Promise.all([
    db.freelancer.findMany({
      where,
      include: {
        pm: { select: { name: true } },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.freelancer.count({ where }),
  ]);

  return NextResponse.json({
    freelancers,
    total,
    page,
    totalPages: Math.ceil(total / perPage),
  });
}
