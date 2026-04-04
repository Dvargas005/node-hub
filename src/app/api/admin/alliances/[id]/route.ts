import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

const allowedFields = [
  "name",
  "slug",
  "code",
  "contactName",
  "contactEmail",
  "discountPercent",
  "bonusCredits",
  "revenueShare",
  "isActive",
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireApiRole(["ADMIN"]);
  if (error || !session) return error;

  try {
    const body = await req.json();
    const allianceId = params.id;

    const existing = await db.alliance.findUnique({ where: { id: allianceId } });
    if (!existing) {
      return NextResponse.json({ error: "Alianza no encontrada" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) {
        data[key] = body[key];
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No se proporcionaron campos para actualizar" }, { status: 400 });
    }

    const updated = await db.alliance.update({
      where: { id: allianceId },
      data,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[UPDATE_ALLIANCE]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
