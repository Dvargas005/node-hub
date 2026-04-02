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

    // Check available credits
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { freeCredits: true },
    });
    const subscription = await db.subscription.findUnique({
      where: { userId },
      select: { id: true, creditsRemaining: true },
    });

    const freeCredits = user?.freeCredits || 0;
    const planCredits = subscription?.creditsRemaining || 0;
    const totalCredits = freeCredits + planCredits;

    if (totalCredits < EDIT_COST) {
      return NextResponse.json(
        {
          error: `Editar tu perfil cuesta ${EDIT_COST} créditos. Tienes ${totalCredits}.`,
        },
        { status: 400 }
      );
    }

    // Deduct credits: free first, then plan
    await db.$transaction(async (tx) => {
      let remaining = EDIT_COST;

      if (freeCredits > 0) {
        const fromFree = Math.min(freeCredits, remaining);
        await tx.user.update({
          where: { id: userId },
          data: { freeCredits: { decrement: fromFree } },
        });
        remaining -= fromFree;
      }

      if (remaining > 0 && subscription) {
        await tx.subscription.update({
          where: { id: subscription.id },
          data: { creditsRemaining: { decrement: remaining } },
        });
      }

      // Update profile
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
    console.error("[PROFILE_UPDATE]", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
