import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

const EDIT_COST = 10;

export async function POST(req: NextRequest) {
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

    if (!businessName || !businessIndustry || !businessDescription) {
      return NextResponse.json(
        { error: "Nombre, giro y descripción del negocio son requeridos" },
        { status: 400 }
      );
    }

    if (socialMedia && JSON.stringify(socialMedia).length > 2000) {
      return NextResponse.json(
        { error: "Datos de redes sociales demasiado largos" },
        { status: 400 }
      );
    }

    if (website && !website.match(/^https?:\/\//)) {
      website = "https://" + website;
    }

    // I12: Check if anything actually changed before charging
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
    if (noChange) {
      return NextResponse.json({ success: true, message: "Sin cambios" });
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
      return NextResponse.json({ error: `Editar tu perfil cuesta ${EDIT_COST} créditos. No tienes suficientes.` }, { status: 400 });
    }
    console.error("[PROFILE_UPDATE]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
