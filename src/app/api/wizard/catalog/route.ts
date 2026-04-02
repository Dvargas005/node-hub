import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const { error } = await requireApiRole(["CLIENT", "ADMIN", "PM"]);
  if (error) return error;

  try {
    const category = req.nextUrl.searchParams.get("category");

    const where: Record<string, unknown> = { isActive: true };
    if (category && ["DESIGN", "WEB", "MARKETING"].includes(category)) {
      where.category = category;
    }

    const services = await db.service.findMany({
      where,
      include: {
        variants: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ services });
  } catch (err) {
    console.error("[WIZARD_CATALOG]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
