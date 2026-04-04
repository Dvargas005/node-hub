import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error, session } = await requireApiRole(["ADMIN"]);
    if (error || !session) return error;

    const body = await req.json();
    const { code, type, value, maxUses, validFrom, validUntil } = body;

    const data: Record<string, any> = {};
    if (code !== undefined) data.code = code.toUpperCase();
    if (type !== undefined) data.type = type;
    if (value !== undefined) data.value = value;
    if (maxUses !== undefined) data.maxUses = maxUses;
    if (validFrom !== undefined) data.validFrom = new Date(validFrom);
    if (validUntil !== undefined)
      data.validUntil = validUntil ? new Date(validUntil) : null;

    const promo = await db.promoCode.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(promo);
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json(
        { error: "Promo no encontrada" },
        { status: 404 }
      );
    }
    console.error("[PROMOS_PATCH]", err);
    return NextResponse.json(
      { error: "Error al actualizar promo" },
      { status: 500 }
    );
  }
}
