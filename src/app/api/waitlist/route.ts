import { NextRequest, NextResponse } from "next/server";
import Redis from "ioredis";

function getRedis() {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  return new Redis(url);
}

export async function POST(req: NextRequest) {
  let redis: any = null;
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

    redis = getRedis();
    if (redis) {
      const exists = await redis.get("waitlist:" + entry.email);
      if (exists) {
        await redis.quit();
        return NextResponse.json({ success: false, error: "Email already registered" }, { status: 409 });
      }
      await redis.set("waitlist:" + entry.email, JSON.stringify(entry));
      await redis.sadd("waitlist:all_emails", entry.email);
      const count = await redis.scard("waitlist:all_emails");
      console.log("[WAITLIST] #" + count + " — " + entry.email);
      await redis.quit();
    } else {
      console.log("[WAITLIST_ENTRY]", JSON.stringify(entry));
    }

    return NextResponse.json({ success: true, message: "Added to waitlist" });
  } catch (error) {
    if (redis) await redis.quit().catch(() => {});
    console.error("[WAITLIST_ERROR]", error);
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}
