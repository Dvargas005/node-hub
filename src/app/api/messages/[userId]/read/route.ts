import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { verifyMessageRelationship } from "@/lib/messages-auth";

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { error, session } = await requireApiRole(["CLIENT", "PM", "ADMIN"]);
  if (error || !session) return error;

  try {
    const { userId: targetId } = await params;
    const viewerId = session.user.id;
    const role = (session.user as Record<string, unknown>).role as string;

    const target = await verifyMessageRelationship(viewerId, role, targetId);
    if (!target) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const result = await db.directMessage.updateMany({
      where: { senderId: targetId, receiverId: viewerId, read: false },
      data: { read: true },
    });

    return NextResponse.json({ updated: result.count });
  } catch (err) {
    console.error("[MESSAGES_READ]", err);
    return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 });
  }
}
