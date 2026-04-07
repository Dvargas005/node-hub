import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function GET() {
  const { error, session } = await requireApiRole(["CLIENT", "PM", "ADMIN", "FREELANCER"]);
  if (error || !session) return error;

  try {
    const count = await db.directMessage.count({
      where: { receiverId: session.user.id, read: false },
    });
    return NextResponse.json({ count });
  } catch (err) {
    console.error("[MESSAGES_UNREAD_COUNT]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
