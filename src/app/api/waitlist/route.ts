import { NextRequest, NextResponse } from "next/server";

interface WaitlistEntry {
  name: string;
  email: string;
  language: "es" | "en";
  createdAt: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, language } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const resolvedName =
      name && typeof name === "string" && name.trim().length > 0
        ? name.trim()
        : email.split("@")[0];

    const lang: "es" | "en" = language === "en" ? "en" : "es";

    const entry: WaitlistEntry = {
      name: resolvedName,
      email: email.toLowerCase().trim(),
      language: lang,
      createdAt: new Date().toISOString(),
    };

    // Try Vercel KV if env vars are set
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      try {
        const { kv } = await import("@vercel/kv");

        const existing = await kv.get(`waitlist:${entry.email}`);
        if (existing) {
          return NextResponse.json(
            { error: "Email already registered" },
            { status: 409 }
          );
        }

        await kv.set(`waitlist:${entry.email}`, JSON.stringify(entry));
        await kv.lpush("waitlist:emails", entry.email);

        return NextResponse.json({ success: true });
      } catch (kvErr) {
        console.error("[waitlist] KV error, falling back to log:", kvErr);
      }
    }

    // Fallback: log to stdout (visible in Vercel function logs)
    console.log("[waitlist] New entry:", JSON.stringify(entry));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
