import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const PM_API_KEY = process.env.PM_API_KEY;

export async function requirePmApiKey(req: Request): Promise<{ error?: NextResponse; pmUserId?: string }> {
  const apiKey = req.headers.get("X-PM-Key");

  if (!apiKey || !PM_API_KEY || apiKey !== PM_API_KEY) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const pm = await db.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });

  return { pmUserId: pm?.id };
}
