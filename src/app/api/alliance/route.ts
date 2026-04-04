import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "Código requerido" }, { status: 400 });
    }

    const alliance = await db.alliance.findUnique({
      where: { code: code.toUpperCase(), isActive: true },
      select: { id: true, name: true },
    });

    if (!alliance) {
      return NextResponse.json({ error: "Código no válido" }, { status: 404 });
    }

    // S7: Only return name, not discountPercent or bonusCredits
    return NextResponse.json({ valid: true, name: alliance.name });
  } catch (err) {
    console.error("[ALLIANCE]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
