import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function GET() {
  const { error, session } = await requireApiRole(["CLIENT"]);
  if (error || !session) return error;

  try {
    const me = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        assignedPm: {
          select: { id: true, name: true, email: true, calendlyUrl: true },
        },
      },
    });

    if (!me?.assignedPm) {
      return NextResponse.json({ pm: null });
    }

    return NextResponse.json({
      pm: {
        id: me.assignedPm.id,
        name: me.assignedPm.name,
        email: me.assignedPm.email,
        calendlyUrl: me.assignedPm.calendlyUrl,
      },
    });
  } catch (err) {
    console.error("[PM_INFO]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
