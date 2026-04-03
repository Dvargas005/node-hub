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

    // Check if this is the first onboarding (grant welcome credits only once)
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { onboardingCompleted: true },
    });
    const isFirstTime = !currentUser?.onboardingCompleted;

    await db.user.update({
      where: { id: session.user.id },
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
        ...(isFirstTime ? { freeCredits: { increment: 10 } } : {}),
      },
    });

    return NextResponse.json({ success: true, welcomeCredits: isFirstTime ? 10 : 0 });
  } catch (err) {
    console.error("[ONBOARDING]", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
