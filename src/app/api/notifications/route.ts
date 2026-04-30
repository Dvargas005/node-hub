import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { cookies } from "next/headers";
import { t, DEFAULT_LANG } from "@/lib/i18n";

export async function GET() {
  const lang = (await cookies()).get("node-language")?.value || DEFAULT_LANG;
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
      { error: t("api.error.notificationsError", lang) },
      { status: 500 }
    );
  }
}
