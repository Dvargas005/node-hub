import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const { error, session } = await requireApiRole(["CLIENT", "ADMIN", "PM"]);
  if (error || !session) return error;

  try {
    const body = await req.json();
    const {
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

    // Step 1 is required
    if (!businessDescription) {
      return NextResponse.json(
        { error: "La descripción de tu negocio es requerida" },
        { status: 400 }
      );
    }

    await db.user.update({
      where: { id: session.user.id },
      data: {
        businessName: businessName || undefined,
        businessIndustry: businessIndustry || undefined,
        businessDescription,
        targetAudience: targetAudience || undefined,
        hasBranding: hasBranding ?? undefined,
        brandColors: brandColors || undefined,
        brandStyle: brandStyle || undefined,
        website: website || undefined,
        socialMedia: socialMedia || undefined,
        onboardingCompleted: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[ONBOARDING]", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
