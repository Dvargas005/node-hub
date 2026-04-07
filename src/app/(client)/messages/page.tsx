import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { ClientMessagesView } from "./messages-client";

export const dynamic = "force-dynamic";

export default async function ClientMessagesPage() {
  const session = await requireAuth();
  const userId = session.user.id;

  const me = await db.user.findUnique({
    where: { id: userId },
    select: {
      assignedPmId: true,
      assignedPm: { select: { id: true, name: true, email: true } },
    },
  });

  if (!me?.assignedPm) {
    return <ClientMessagesView pm={null} initialMessages={[]} />;
  }

  const messages = await db.directMessage.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: me.assignedPm.id },
        { senderId: me.assignedPm.id, receiverId: userId },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  return (
    <ClientMessagesView
      pm={{ id: me.assignedPm.id, name: me.assignedPm.name, email: me.assignedPm.email }}
      initialMessages={messages.map((m: any) => ({
        id: m.id,
        senderId: m.senderId,
        receiverId: m.receiverId,
        content: m.content,
        read: m.read,
        createdAt: m.createdAt.toISOString(),
      }))}
    />
  );
}
