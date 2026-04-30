import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { t, DEFAULT_LANG } from "@/lib/i18n";

export async function POST(req: NextRequest) {
  const lang = req.cookies.get("node-language")?.value || DEFAULT_LANG;
  try {
    const { error, session } = await requireApiRole(["CLIENT"]);
    if (error || !session) return error;

    const { code } = await req.json();
    if (!code) {
      return NextResponse.json(
        { error: t("api.error.codeRequired", lang) },
        { status: 400 }
      );
    }

    const promo = await db.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promo || !promo.isActive) {
      return NextResponse.json({ valid: false, error: t("api.error.validateCode", lang) });
    }

    const now = new Date();
    if (promo.validFrom && now < promo.validFrom) {
      return NextResponse.json({
        valid: false,
        error: t("api.error.codeNotYetValid", lang),
      });
    }
    if (promo.validUntil && now > promo.validUntil) {
      return NextResponse.json({ valid: false, error: t("api.error.codeExhausted", lang) });
    }
    if (promo.maxUses && promo.currentUses >= promo.maxUses) {
      return NextResponse.json({
        valid: false,
        error: t("api.error.codeExhausted", lang),
      });
    }

    const typeLabels: Record<string, string> = {
      PERCENT_OFF: `${promo.value}% off`,
      FIXED_CREDITS: `${promo.value} ${t("api.error.freeCredits", lang)}`,
      FREE_MONTH: `${promo.value} ${t("admin.promos.freeMonth", lang)}`,
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
      { error: t("api.error.validateCode", lang) },
      { status: 500 }
    );
  }
}
