import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error, session } = await requireApiRole(["ADMIN"]);
    if (error || !session) return error;

    const promo = await db.promoCode.findUnique({
      where: { id: params.id },
    });

    if (!promo) {
      return NextResponse.json(
        { error: "Promo no encontrada" },
        { status: 404 }
      );
    }

    const updated = await db.promoCode.update({
      where: { id: params.id },
      data: { isActive: !promo.isActive },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("[PROMOS_TOGGLE]", err);
    return NextResponse.json(
      { error: "Error al cambiar estado" },
      { status: 500 }
    );
  }
}
