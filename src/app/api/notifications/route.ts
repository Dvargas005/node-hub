import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function GET() {
  try {
    const { error, session } = await requireApiRole([
      "CLIENT",
      "PM",
      "ADMIN",
      "FREELANCER",
    ]);
    if (error || !session) return error;

    const notifs = await db.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json(
      notifs.map((n: any) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        link: n.link,
        read: n.read,
        createdAt: n.createdAt.toISOString(),
      }))
    );
  } catch (err: any) {
    console.error("[NOTIFICATIONS_GET]", err);
    return NextResponse.json(
      { error: "Error al obtener notificaciones" },
      { status: 500 }
    );
  }
}
