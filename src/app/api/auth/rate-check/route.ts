import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { email } = await req.json();
    const key = `login:${ip}:${email || ""}`;

    if (!checkRateLimit(key, 5, 900000)) {
      return NextResponse.json(
        { error: "Demasiados intentos. Espera 15 minutos.", blocked: true },
        { status: 429 }
      );
    }

    return NextResponse.json({ blocked: false });
  } catch {
    return NextResponse.json({ blocked: false });
  }
}
