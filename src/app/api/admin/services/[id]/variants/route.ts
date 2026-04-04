import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireApiRole(["ADMIN"]);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await req.json();
    const { name, creditCost, description, estimatedDays, minPlan, isPopular, isNew, isActive, sortOrder } = body;

    if (!name || creditCost == null || !description || estimatedDays == null) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const service = await db.service.findUnique({ where: { id } });
    if (!service) {
      return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
    }

    const variant = await db.serviceVariant.create({
      data: {
        serviceId: id,
        name,
        creditCost: Number(creditCost),
        description,
        estimatedDays: Number(estimatedDays),
        minPlan: minPlan || null,
        isPopular: isPopular ?? false,
        isNew: isNew ?? false,
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json(variant, { status: 201 });
  } catch (err) {
    console.error("[ADMIN_VARIANT_POST]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
