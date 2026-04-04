import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, session } = await requireApiRole(["ADMIN"]);
    if (error || !session) return error;

    const { id } = await params;
    const { pmId } = await req.json();

    if (!pmId) {
      return NextResponse.json({ error: "pmId es requerido" }, { status: 400 });
    }

    const client = await db.user.findUnique({ where: { id }, select: { role: true } });
    if (!client || client.role !== "CLIENT") {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    // Validate PM exists and has correct role
    const pm = await db.user.findUnique({
      where: { id: pmId },
      select: { role: true },
    });

    if (!pm || !["PM", "ADMIN"].includes(pm.role)) {
      return NextResponse.json({ error: "PM no válido" }, { status: 400 });
    }

    // Update client's assigned PM
    await db.user.update({
      where: { id },
      data: { assignedPmId: pmId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[ADMIN_ASSIGN_PM]", err);
    return NextResponse.json({ error: "Error al asignar PM" }, { status: 500 });
  }
}
