import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { t, DEFAULT_LANG } from "@/lib/i18n";

export async function POST(req: NextRequest) {
  const { error } = await requireApiRole(["ADMIN"]);
  if (error) return error;

  const lang = req.cookies.get("node-language")?.value || DEFAULT_LANG;

  try {
    const body = await req.json();
    const { name, slug, category, description, longDescription, icon, tags, sortOrder, isActive } = body;

    if (!name || !slug || !category || !description) {
      return NextResponse.json({ error: t("api.error.requiredFields", lang) }, { status: 400 });
    }

    const validCategories = ["DESIGN", "WEB", "MARKETING"];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: t("api.error.invalidCategory", lang) }, { status: 400 });
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
    return NextResponse.json({ error: t("api.error.internal", lang) }, { status: 500 });
  }
}
