import { db } from "@/lib/db";

export function createNotification(
  userId: string,
  data: { title: string; message: string; type: string; link?: string }
) {
  // Fire and forget — don't await
  db.notification
    .create({ data: { userId, ...data } })
    .catch((err: any) => {
      console.error("[NOTIFICATION] Failed:", err);
    });
}
