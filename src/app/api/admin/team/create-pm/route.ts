import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import crypto from "crypto";

function generatePassword(): string {
  return crypto.randomBytes(9).toString("base64url").substring(0, 12);
}

export async function POST(req: NextRequest) {
  try {
    const { error, session } = await requireApiRole(["ADMIN"]);
    if (error || !session) return error;

    const { name, email, phone, timezone } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Nombre y email son requeridos" }, { status: 400 });
    }

    // Check if user already exists
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 400 });
    }

    const tempPassword = generatePassword();

    const authRes = await auth.api.signUpEmail({
      body: { email, password: tempPassword, name },
      headers: await headers(),
      asResponse: true,
    });

    if (!authRes.ok) {
      return NextResponse.json({ error: "Error al crear cuenta de autenticación" }, { status: 500 });
    }

    // Find the newly created user and update role
    const newUser = await db.user.findUnique({ where: { email } });
    if (!newUser) {
      return NextResponse.json({ error: "Error: usuario no encontrado tras creación" }, { status: 500 });
    }

    await db.user.update({
      where: { id: newUser.id },
      data: {
        role: "PM",
        onboardingCompleted: true,
        phone: phone || null,
        timezone: timezone || null,
      },
    });

    return NextResponse.json({
      user: { id: newUser.id, name, email },
      tempPassword,
    });
  } catch (err) {
    console.error("[ADMIN_CREATE_PM]", err);
    return NextResponse.json({ error: "Error al crear PM" }, { status: 500 });
  }
}
