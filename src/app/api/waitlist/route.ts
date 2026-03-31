import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, businessName, allianceCode, language } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "Valid email is required" }, { status: 400 });
    }

    const entry = {
      email: email.toLowerCase().trim(),
      name: name || "",
      businessName: businessName || "",
      allianceCode: allianceCode || "",
      language: language || "en",
      createdAt: new Date().toISOString(),
    };

    const redis = getRedis();
    if (redis) {
      const exists = await redis.get(`waitlist:${entry.email}`);
      if (exists) {
        return NextResponse.json({ success: false, error: "Email already registered" }, { status: 409 });
      }
      await redis.set(`waitlist:${entry.email}`, JSON.stringify(entry));
      await redis.sadd("waitlist:all_emails", entry.email);
      const count = await redis.scard("waitlist:all_emails");
      console.log(`[WAITLIST] #${count} — ${entry.email}`);
    } else {
      console.log("[WAITLIST_ENTRY]", JSON.stringify(entry));
    }

    return NextResponse.json({ success: true, message: "Added to waitlist" });
  } catch (error) {
    console.error("[WAITLIST_ERROR]", error);
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}
