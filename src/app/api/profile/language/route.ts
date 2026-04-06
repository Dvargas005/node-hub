import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function PATCH(req: NextRequest) {
  const { error, session } = await requireApiRole(["CLIENT", "PM", "ADMIN", "FREELANCER"]);
  if (error || !session) return error;

  try {
    const body = await req.json();
    const data: Record<string, string> = {};
    if (body.language && ["es", "en", "pt"].includes(body.language)) data.language = body.language;
    if (body.deliveryLanguage && ["es", "en", "pt"].includes(body.deliveryLanguage)) data.deliveryLanguage = body.deliveryLanguage;
    if (Object.keys(data).length === 0) return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });

    await db.user.update({ where: { id: session.user.id }, data });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PROFILE_LANGUAGE]", err);
    return NextResponse.json({ error: "Error al actualizar idioma" }, { status: 500 });
  }
}
