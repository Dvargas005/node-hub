import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { cookies } from "next/headers";
import { t, DEFAULT_LANG } from "@/lib/i18n";

export async function PATCH() {
  const lang = (await cookies()).get("node-language")?.value || DEFAULT_LANG;
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
      { error: t("api.error.markNotificationsError", lang) },
      { status: 500 }
    );
  }
}
