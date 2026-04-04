import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const { error } = await requireApiRole(["ADMIN"]);
  if (error) return error;

  try {
    const body = await req.json();
    const { name, slug, category, description, longDescription, icon, tags, sortOrder, isActive } = body;

    if (!name || !slug || !category || !description) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const existing = await db.service.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "El slug ya existe" }, { status: 409 });
    }

    const service = await db.service.create({
      data: {
        name,
        slug,
        category,
        description,
        longDescription: longDescription || null,
        icon: icon || null,
        tags: tags || [],
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (err) {
    console.error("[ADMIN_SERVICES_POST]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
