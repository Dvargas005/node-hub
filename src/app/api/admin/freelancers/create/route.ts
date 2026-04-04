import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { requireApiRole } from "@/lib/api-auth";
import { headers } from "next/headers";
import crypto from "crypto";

function generatePassword(): string {
  return crypto.randomBytes(9).toString("base64url").substring(0, 12);
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireApiRole(["ADMIN"]);
  if (error || !session) return error;

  try {
    const {
      name,
      email,
      phone,
      telegramId,
      discordId,
      role,
      skills,
      skillTags,
      monthlySalary,
      clientCapacity,
      bio,
      portfolioUrl,
      timezone,
    } = await req.json();

    if (!name || !email || !role || !skills || !skillTags || monthlySalary == null || clientCapacity == null) {
      return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 });
    }

    const existing = await db.freelancer.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Ya existe un freelancer con ese email" }, { status: 409 });
    }

    // Auto-create a User with role FREELANCER
    const tempPassword = generatePassword();
    let userId: string | null = null;

    try {
      const authRes = await auth.api.signUpEmail({
        body: { email, password: tempPassword, name },
        headers: await headers(),
        asResponse: true,
      });

      if (authRes.ok) {
        const authData = await authRes.json();
        userId = authData?.user?.id || null;

        if (userId) {
          // Set role to FREELANCER and mark onboarding complete
          await db.user.update({
            where: { id: userId },
            data: { role: "FREELANCER", onboardingCompleted: true },
          });
        }
      } else {
        console.warn("[CREATE_FREELANCER] Could not create user account:", await authRes.text());
      }
    } catch (authErr) {
      console.warn("[CREATE_FREELANCER] User creation failed (freelancer still created):", authErr);
    }

    const freelancer = await db.freelancer.create({
      data: {
        name,
        email,
        phone: phone || null,
        telegramId: telegramId || null,
        discordId: discordId || null,
        role,
        skills,
        skillTags,
        monthlySalary,
        clientCapacity,
        bio: bio || null,
        portfolioUrl: portfolioUrl || null,
        timezone: timezone || null,
        pmId: session.user.id,
        userId,
      },
    });

    return NextResponse.json({
      freelancer,
      tempPassword: userId ? tempPassword : null,
      userCreated: !!userId,
    }, { status: 201 });
  } catch (err) {
    console.error("[CREATE_FREELANCER]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
