import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const { error } = await requireApiRole(["ADMIN", "PM"]);
  if (error) return error;

  const url = req.nextUrl.searchParams;
  const plan = url.get("plan");
  const alliance = url.get("alliance");
  const search = url.get("search");
  const page = parseInt(url.get("page") || "1");
  const perPage = 20;

  const where: Record<string, unknown> = { role: "CLIENT" };

  if (plan) {
    where.subscription = { plan: { slug: plan } };
  }
  if (alliance) {
    where.allianceId = { not: null };
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { businessName: { contains: search, mode: "insensitive" } },
    ];
  }

  const [clients, total] = await Promise.all([
    db.user.findMany({
      where,
      include: {
        subscription: { include: { plan: true } },
        referredBy: { select: { name: true } },
        _count: {
          select: {
            tickets: {
              where: { status: { notIn: ["COMPLETED", "CANCELED"] } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.user.count({ where }),
  ]);

  return NextResponse.json({
    clients,
    total,
    page,
    totalPages: Math.ceil(total / perPage),
  });
}
