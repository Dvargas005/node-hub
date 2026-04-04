import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

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
      },
    });

    return NextResponse.json(freelancer, { status: 201 });
  } catch (err) {
    console.error("[CREATE_FREELANCER]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
