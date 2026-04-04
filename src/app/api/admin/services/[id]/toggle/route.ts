import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireApiRole(["ADMIN"]);
  if (error) return error;

  try {
    const { id } = await params;

    const service = await db.service.findUnique({ where: { id } });
    if (!service) {
      return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
    }

    const updated = await db.service.update({
      where: { id },
      data: { isActive: !service.isActive },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[ADMIN_SERVICE_TOGGLE]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
