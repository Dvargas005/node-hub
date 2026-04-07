import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

const CALENDLY_PREFIX = "https://calendly.com/";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireApiRole(["ADMIN", "PM"]);
  if (error || !session) return error;

  try {
    const { id: targetId } = await params;
    const viewerId = session.user.id;
    const role = (session.user as Record<string, unknown>).role as string;

    // ADMIN can edit anyone's calendlyUrl. PM can only edit their own.
    if (role !== "ADMIN" && targetId !== viewerId) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const target = await db.user.findUnique({
      where: { id: targetId },
      select: { id: true, role: true },
    });
    if (!target) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (target.role !== "PM" && target.role !== "ADMIN") {
      return NextResponse.json({ error: "Only PM/ADMIN can have a Calendly URL" }, { status: 400 });
    }

    const body = await req.json();
    const raw = body.calendlyUrl;

    let calendlyUrl: string | null;
    if (raw === null || raw === "" || raw === undefined) {
      calendlyUrl = null;
    } else if (typeof raw !== "string") {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    } else {
      const trimmed = raw.trim();
      if (!trimmed.startsWith(CALENDLY_PREFIX)) {
        return NextResponse.json(
          { error: `URL must start with ${CALENDLY_PREFIX}` },
          { status: 400 },
        );
      }
      if (trimmed.length > 500) {
        return NextResponse.json({ error: "URL too long" }, { status: 400 });
      }
      calendlyUrl = trimmed;
    }

    await db.user.update({
      where: { id: targetId },
      data: { calendlyUrl },
    });

    return NextResponse.json({ success: true, calendlyUrl });
  } catch (err) {
    console.error("[TEAM_CALENDLY]", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
