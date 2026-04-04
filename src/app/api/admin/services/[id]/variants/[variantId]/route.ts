import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

const ALLOWED_FIELDS = [
  "name", "creditCost", "description", "estimatedDays",
  "minPlan", "isPopular", "isNew", "isActive", "sortOrder",
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  const { error } = await requireApiRole(["ADMIN"]);
  if (error) return error;

  try {
    const { id, variantId } = await params;
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

    if (data.creditCost != null) data.creditCost = Number(data.creditCost);
    if (data.estimatedDays != null) data.estimatedDays = Number(data.estimatedDays);

    const exists = await db.serviceVariant.findFirst({ where: { id: variantId, serviceId: id } });
    if (!exists) return NextResponse.json({ error: "Variante no encontrada en este servicio" }, { status: 404 });

    const variant = await db.serviceVariant.update({
      where: { id: variantId },
      data,
    });

    return NextResponse.json(variant);
  } catch (err) {
    console.error("[ADMIN_VARIANT_PATCH]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
