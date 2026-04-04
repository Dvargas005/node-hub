import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const { error, session } = await requireApiRole(["ADMIN"]);
  if (error || !session) return error;

  try {
    const {
      name,
      slug,
      code,
      contactName,
      contactEmail,
      discountPercent,
      bonusCredits,
      revenueShare,
    } = await req.json();

    if (!name || !slug || !code || discountPercent == null || bonusCredits == null || revenueShare == null) {
      return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 });
    }

    const existing = await db.alliance.findFirst({
      where: { OR: [{ slug }, { code }] },
    });
    if (existing) {
      return NextResponse.json({ error: "Ya existe una alianza con ese slug o código" }, { status: 409 });
    }

    const alliance = await db.alliance.create({
      data: {
        name,
        slug,
        code,
        contactName: contactName || null,
        contactEmail: contactEmail || null,
        discountPercent,
        bonusCredits,
        revenueShare,
      },
    });

    return NextResponse.json(alliance, { status: 201 });
  } catch (err) {
    console.error("[CREATE_ALLIANCE]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
