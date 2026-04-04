import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function PATCH() {
  try {
    const { error, session } = await requireApiRole([
      "CLIENT",
      "PM",
      "ADMIN",
      "FREELANCER",
    ]);
    if (error || !session) return error;

    await db.notification.updateMany({
      where: { userId: session.user.id, read: false },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[NOTIFICATIONS_READ]", err);
    return NextResponse.json(
      { error: "Error al marcar notificaciones" },
      { status: 500 }
    );
  }
}
