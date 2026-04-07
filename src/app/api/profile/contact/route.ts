import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

const ALLOWED_PREFERRED = ["email", "phone", "whatsapp", "telegram"] as const;

function clean(value: unknown, max = 200): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

export async function PATCH(req: NextRequest) {
  const { error, session } = await requireApiRole(["CLIENT", "PM", "ADMIN", "FREELANCER"]);
  if (error || !session) return error;

  try {
    const userId = session.user.id;
    const body = await req.json();

    const phone = clean(body.phone);
    const whatsappNumber = clean(body.whatsappNumber);
    const telegramId = clean(body.telegramId);
    const linkedinUrl = clean(body.linkedinUrl, 500);
    const instagramHandle = clean(body.instagramHandle);

    let preferredContact: string | null = null;
    if (typeof body.preferredContact === "string") {
      const v = body.preferredContact.toLowerCase();
      if ((ALLOWED_PREFERRED as readonly string[]).includes(v)) preferredContact = v;
    }

    await db.user.update({
      where: { id: userId },
      data: {
        phone,
        whatsappNumber,
        telegramId,
        linkedinUrl,
        instagramHandle,
        ...(preferredContact ? { preferredContact } : {}),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PROFILE_CONTACT]", err);
    return NextResponse.json({ error: "Failed to save contact info" }, { status: 500 });
  }
}
