import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { t, DEFAULT_LANG } from "@/lib/i18n";

const EDIT_COST = 10;

export async function POST(req: NextRequest) {
  const lang = req.cookies.get("node-language")?.value || DEFAULT_LANG;
  const { error, session } = await requireApiRole(["CLIENT"]);
  if (error || !session) return error;

  try {
    const userId = session.user.id;
    const body = await req.json();
    let {
      businessName,
      businessIndustry,
      businessDescription,
      targetAudience,
      hasBranding,
      brandColors,
      brandStyle,
      website,
      socialMedia,
    } = body;

    // Contact fields — accepted but NOT charged. Persisted alongside the
    // business profile update so the client can update everything in one call.
    const contactClean = (v: unknown, max = 200): string | null => {
      if (typeof v !== "string") return null;
      const t = v.trim();
      return t ? t.slice(0, max) : null;
    };
    const phone = contactClean(body.phone);
    const whatsappNumber = contactClean(body.whatsappNumber);
    const telegramId = contactClean(body.telegramId);
    const linkedinUrl = contactClean(body.linkedinUrl, 500);
    const instagramHandle = contactClean(body.instagramHandle);
    let preferredContact: string | null = null;
    if (typeof body.preferredContact === "string") {
      const v = body.preferredContact.toLowerCase();
      if (["email", "phone", "whatsapp", "telegram"].includes(v)) preferredContact = v;
    }

    if (!businessName || !businessIndustry || !businessDescription) {
      return NextResponse.json(
        { error: t("api.error.profileFieldsRequired", lang) },
        { status: 400 }
      );
    }

    if (socialMedia && JSON.stringify(socialMedia).length > 2000) {
      return NextResponse.json(
        { error: t("api.error.socialMediaTooLong", lang) },
        { status: 400 }
      );
    }

    if (website && !website.match(/^https?:\/\//)) {
      website = "https://" + website;
    }

    // I12: Check if anything actually changed before charging.
    // Contact fields are NOT included in this diff — they are saved separately for free.
    const currentProfile = await db.user.findUnique({
      where: { id: userId },
      select: { businessName: true, businessIndustry: true, businessDescription: true, targetAudience: true, hasBranding: true, brandColors: true, brandStyle: true, website: true, socialMedia: true },
    });
    const noChange = currentProfile &&
      currentProfile.businessName === businessName &&
      currentProfile.businessIndustry === businessIndustry &&
      currentProfile.businessDescription === businessDescription &&
      (currentProfile.targetAudience || "") === (targetAudience || "") &&
      currentProfile.hasBranding === (hasBranding ?? currentProfile.hasBranding) &&
      (currentProfile.brandColors || "") === (brandColors || "") &&
      (currentProfile.brandStyle || "") === (brandStyle || "") &&
      (currentProfile.website || "") === (website || "") &&
      JSON.stringify(currentProfile.socialMedia || {}) === JSON.stringify(socialMedia || {});

    // Always persist contact fields (free) — even when business profile is unchanged
    const hasContactPayload =
      body.phone !== undefined ||
      body.whatsappNumber !== undefined ||
      body.telegramId !== undefined ||
      body.linkedinUrl !== undefined ||
      body.instagramHandle !== undefined ||
      body.preferredContact !== undefined;
    if (hasContactPayload) {
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
    }

    if (noChange) {
      return NextResponse.json({ success: true, message: "No business profile changes" });
    }

    // Atomic: check balance + deduct + update inside transaction
    await db.$transaction(async (tx: any) => {
      const user = await tx.user.findUnique({ where: { id: userId }, select: { freeCredits: true } });
      const subscription = await tx.subscription.findUnique({ where: { userId }, select: { id: true, creditsRemaining: true, status: true } });

      const freeCredits = user?.freeCredits || 0;
      const planCredits = (subscription?.status === "ACTIVE" ? subscription.creditsRemaining : 0);

      if (freeCredits + planCredits < EDIT_COST) {
        throw new Error("INSUFFICIENT_CREDITS");
      }

      let remaining = EDIT_COST;
      if (freeCredits > 0) {
        const fromFree = Math.min(freeCredits, remaining);
        await tx.user.update({ where: { id: userId }, data: { freeCredits: { decrement: fromFree } } });
        remaining -= fromFree;
      }
      if (remaining > 0 && subscription) {
        await tx.subscription.update({ where: { id: subscription.id }, data: { creditsRemaining: { decrement: remaining } } });
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          businessName,
          businessIndustry,
          businessDescription,
          targetAudience: targetAudience || undefined,
          hasBranding: hasBranding ?? undefined,
          brandColors: brandColors || undefined,
          brandStyle: brandStyle || undefined,
          website: website || undefined,
          socialMedia: socialMedia || undefined,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === "INSUFFICIENT_CREDITS") {
      return NextResponse.json({ error: t("settings.editCostError", lang).replace("{cost}", String(EDIT_COST)).replace("{credits}", "0") }, { status: 400 });
    }
    console.error("[PROFILE_UPDATE]", err);
    return NextResponse.json({ error: t("api.error.internal", lang) }, { status: 500 });
  }
}
