import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { t, DEFAULT_LANG } from "@/lib/i18n";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const lang = req.cookies.get("node-language")?.value || DEFAULT_LANG;

  try {
    const { error, session } = await requireApiRole(["ADMIN"]);
    if (error || !session) return error;

    const promo = await db.promoCode.findUnique({
      where: { id: params.id },
    });

    if (!promo) {
      return NextResponse.json(
        { error: t("api.error.promoNotFound", lang) },
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
      { error: t("api.error.promoToggleError", lang) },
      { status: 500 }
    );
  }
}
