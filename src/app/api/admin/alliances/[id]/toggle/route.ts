import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireApiRole(["ADMIN"]);
  if (error || !session) return error;

  try {
    const allianceId = params.id;

    const existing = await db.alliance.findUnique({ where: { id: allianceId } });
    if (!existing) {
      return NextResponse.json({ error: "Alianza no encontrada" }, { status: 404 });
    }

    const updated = await db.alliance.update({
      where: { id: allianceId },
      data: { isActive: !existing.isActive },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[TOGGLE_ALLIANCE]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
