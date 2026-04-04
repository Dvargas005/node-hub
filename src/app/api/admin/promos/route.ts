import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function GET() {
  try {
    const { error, session } = await requireApiRole(["ADMIN"]);
    if (error || !session) return error;

    const promos = await db.promoCode.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(promos);
  } catch (err: any) {
    console.error("[PROMOS_GET]", err);
    return NextResponse.json(
      { error: "Error al obtener promos" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error, session } = await requireApiRole(["ADMIN"]);
    if (error || !session) return error;

    const { code, type, value, maxUses, validFrom, validUntil } =
      await req.json();

    if (!code || !type || value == null) {
      return NextResponse.json(
        { error: "code, type y value son requeridos" },
        { status: 400 }
      );
    }

    const promo = await db.promoCode.create({
      data: {
        code: code.toUpperCase(),
        type,
        value,
        maxUses: maxUses || null,
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
      },
    });

    return NextResponse.json(promo);
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe un código con ese nombre" },
        { status: 409 }
      );
    }
    console.error("[PROMOS_POST]", err);
    return NextResponse.json(
      { error: "Error al crear promo" },
      { status: 500 }
    );
  }
}
