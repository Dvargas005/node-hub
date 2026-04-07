import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

interface ConversationItem {
  userId: string;
  name: string;
  businessName: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export async function GET() {
  const { error, session } = await requireApiRole(["CLIENT", "PM", "ADMIN"]);
  if (error || !session) return error;

  try {
    const viewerId = session.user.id;
    const role = (session.user as Record<string, unknown>).role as string;

    if (role === "CLIENT") {
      // Client → only their assigned PM
      const me = await db.user.findUnique({
        where: { id: viewerId },
        select: {
          assignedPmId: true,
          assignedPm: { select: { id: true, name: true, businessName: true } },
        },
      });
      if (!me?.assignedPm) {
        return NextResponse.json({ conversations: [] });
      }
      const pmId = me.assignedPm.id;

      const [last, unread] = await Promise.all([
        db.directMessage.findFirst({
          where: {
            OR: [
              { senderId: viewerId, receiverId: pmId },
              { senderId: pmId, receiverId: viewerId },
            ],
          },
          orderBy: { createdAt: "desc" },
        }),
        db.directMessage.count({
          where: { senderId: pmId, receiverId: viewerId, read: false },
        }),
      ]);

      const item: ConversationItem = {
        userId: pmId,
        name: me.assignedPm.name,
        businessName: me.assignedPm.businessName,
        lastMessage: last?.content || null,
        lastMessageAt: last?.createdAt.toISOString() || null,
        unreadCount: unread,
      };
      return NextResponse.json({ conversations: [item] });
    }

    // PM/ADMIN: list assigned clients
    const clientFilter =
      role === "ADMIN" ? { role: "CLIENT" as const } : { role: "CLIENT" as const, assignedPmId: viewerId };

    const clients = await db.user.findMany({
      where: clientFilter,
      select: { id: true, name: true, businessName: true },
      take: 500,
    });

    const items: ConversationItem[] = await Promise.all(
      clients.map(async (c: { id: string; name: string; businessName: string | null }) => {
        const [last, unread] = await Promise.all([
          db.directMessage.findFirst({
            where: {
              OR: [
                { senderId: viewerId, receiverId: c.id },
                { senderId: c.id, receiverId: viewerId },
              ],
            },
            orderBy: { createdAt: "desc" },
          }),
          db.directMessage.count({
            where: { senderId: c.id, receiverId: viewerId, read: false },
          }),
        ]);
        return {
          userId: c.id,
          name: c.name,
          businessName: c.businessName,
          lastMessage: last?.content || null,
          lastMessageAt: last?.createdAt.toISOString() || null,
          unreadCount: unread,
        };
      }),
    );

    // Sort: most recent message first, then unanswered (no msg) at bottom
    items.sort((a: ConversationItem, b: ConversationItem) => {
      if (a.lastMessageAt && b.lastMessageAt) return b.lastMessageAt.localeCompare(a.lastMessageAt);
      if (a.lastMessageAt) return -1;
      if (b.lastMessageAt) return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ conversations: items });
  } catch (err) {
    console.error("[MESSAGES_CONVERSATIONS]", err);
    return NextResponse.json({ error: "Failed to load conversations" }, { status: 500 });
  }
}
