import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const { error, session } = await requireApiRole(["CLIENT"]);
  if (error || !session) return error;

  try {
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
      priorities,
    } = body;

    // Step 1 required fields
    if (!businessName || !businessIndustry || !businessDescription) {
      return NextResponse.json(
        { error: "Nombre, giro y descripción del negocio son requeridos" },
        { status: 400 }
      );
    }

    // Validate socialMedia size
    if (socialMedia && JSON.stringify(socialMedia).length > 2000) {
      return NextResponse.json(
        { error: "Datos de redes sociales demasiado largos" },
        { status: 400 }
      );
    }

    // Auto-prefix URL
    if (website && !website.match(/^https?:\/\//)) {
      website = "https://" + website;
    }

    const userId = session.user.id;

    // C7: Atomic transaction to prevent double-submit granting 20 credits
    const result = await db.$transaction(async (tx: any) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { onboardingCompleted: true },
      });

      if (user?.onboardingCompleted) {
        // Already completed — update profile but don't grant credits
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
            priorities: priorities || undefined,
          },
        });
        return { welcomeCredits: 0 };
      }

      // First time: set onboardingCompleted + grant credits atomically
      await tx.user.update({
        where: { id: userId, onboardingCompleted: false },
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
          priorities: priorities || undefined,
          onboardingCompleted: true,
          freeCredits: { increment: 10 },
        },
      });
      return { welcomeCredits: 10 };
    });

    return NextResponse.json({ success: true, welcomeCredits: result.welcomeCredits });
  } catch (err) {
    console.error("[ONBOARDING]", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
