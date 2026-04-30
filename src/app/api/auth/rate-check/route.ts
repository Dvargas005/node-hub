import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { t, DEFAULT_LANG } from "@/lib/i18n";

export async function POST(req: NextRequest) {
  const lang = req.cookies.get("node-language")?.value || DEFAULT_LANG;
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { email } = await req.json();
    const key = `login:${ip}:${email || ""}`;

    if (!checkRateLimit(key, 5, 900000)) {
      return NextResponse.json(
        { error: t("api.error.tooManyAttempts", lang), blocked: true },
        { status: 429 }
      );
    }

    return NextResponse.json({ blocked: false });
  } catch {
    return NextResponse.json({ blocked: false });
  }
}
