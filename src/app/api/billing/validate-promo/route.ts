import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  try {
    const { error, session } = await requireApiRole(["CLIENT"]);
    if (error || !session) return error;

    const { code } = await req.json();
    if (!code) {
      return NextResponse.json(
        { error: "Código requerido" },
        { status: 400 }
      );
    }

    const promo = await db.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promo || !promo.isActive) {
      return NextResponse.json({ valid: false, error: "Código no válido" });
    }

    const now = new Date();
    if (promo.validFrom && now < promo.validFrom) {
      return NextResponse.json({
        valid: false,
        error: "Código aún no vigente",
      });
    }
    if (promo.validUntil && now > promo.validUntil) {
      return NextResponse.json({ valid: false, error: "Código expirado" });
    }
    if (promo.maxUses && promo.currentUses >= promo.maxUses) {
      return NextResponse.json({
        valid: false,
        error: "Código agotado",
      });
    }

    const typeLabels: Record<string, string> = {
      PERCENT_OFF: `${promo.value}% de descuento`,
      FIXED_CREDITS: `${promo.value} créditos gratis`,
      FREE_MONTH: `${promo.value} mes(es) gratis`,
    };

    return NextResponse.json({
      valid: true,
      type: promo.type,
      value: promo.value,
      description: typeLabels[promo.type] || promo.type,
    });
  } catch (err: any) {
    console.error("[VALIDATE_PROMO]", err);
    return NextResponse.json(
      { error: "Error al validar código" },
      { status: 500 }
    );
  }
}
