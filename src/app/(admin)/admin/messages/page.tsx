import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { AdminMessagesView, type ConversationItem } from "./messages-admin-client";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const session = await requireRole(["ADMIN", "PM"]);
  const viewerId = session.user.id;
  const role = (session.user as Record<string, unknown>).role as string;

  const clientFilter =
    role === "ADMIN"
      ? { role: "CLIENT" as const }
      : { role: "CLIENT" as const, assignedPmId: viewerId };

  const clients = await db.user.findMany({
    where: clientFilter,
    select: { id: true, name: true, businessName: true },
    take: 500,
  });

  const conversations: ConversationItem[] = await Promise.all(
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

  conversations.sort((a: ConversationItem, b: ConversationItem) => {
    if (a.lastMessageAt && b.lastMessageAt) return b.lastMessageAt.localeCompare(a.lastMessageAt);
    if (a.lastMessageAt) return -1;
    if (b.lastMessageAt) return 1;
    return a.name.localeCompare(b.name);
  });

  return <AdminMessagesView conversations={conversations} viewerId={viewerId} />;
}
