import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

const ALLOWED_FIELDS = [
  "name", "slug", "category", "description", "longDescription",
  "icon", "tags", "sortOrder", "isActive",
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireApiRole(["ADMIN"]);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await req.json();

    const data: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in body) {
        data[key] = body[key];
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Sin campos para actualizar" }, { status: 400 });
    }

    if (data.slug) {
      const existing = await db.service.findFirst({ where: { slug: data.slug as string, id: { not: id } } });
      if (existing) return NextResponse.json({ error: "Slug ya existe" }, { status: 409 });
    }

    const service = await db.service.update({
      where: { id },
      data,
    });

    return NextResponse.json(service);
  } catch (err) {
    console.error("[ADMIN_SERVICE_PATCH]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
