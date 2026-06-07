import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePmApiKey } from "@/lib/pm-api-auth";

export async function GET(req: Request) {
  const { error } = await requirePmApiKey(req);
  if (error) return error;

  try {
    const services = await db.service.findMany({
      where: { isActive: true },
      include: {
        variants: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          select: { id: true, name: true, creditCost: true, estimatedDays: true, description: true },
        },
      },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    });

    const result = services.map((s) => ({
      slug: s.slug,
      name: s.name,
      category: s.category,
      variants: s.variants.map((v) => ({
        id: v.id,
        name: v.name,
        credits: v.creditCost,
        days: v.estimatedDays,
      })),
    }));

    return NextResponse.json({ services: result });
  } catch (err) {
    console.error("[pm/services]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
