import { NextRequest, NextResponse } from "next/server";
import Redis from "ioredis";

// S12: Singleton Redis client to avoid connection churn
let redisClient: Redis | null = null;
function getRedis(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  if (!redisClient) {
    redisClient = new Redis(url);
  }
  return redisClient;
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
      const exists = await redis.get("waitlist:" + entry.email);
      if (exists) {
        return NextResponse.json({ success: false, error: "Email already registered" }, { status: 409 });
      }
      await redis.set("waitlist:" + entry.email, JSON.stringify(entry));
      await redis.sadd("waitlist:all_emails", entry.email);
    }

    return NextResponse.json({ success: true, message: "Added to waitlist" });
  } catch (error) {
    console.error("[WAITLIST_ERROR]", error);
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}
