import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, businessName, allianceCode } = body;

    // Input validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      );
    }

    // Validate alliance code if provided
    let allianceId: string | null = null;
    if (allianceCode) {
      const alliance = await db.alliance.findUnique({
        where: { code: allianceCode.toUpperCase(), isActive: true },
      });
      if (!alliance) {
        return NextResponse.json(
          { error: "Código de alianza no válido" },
          { status: 400 }
        );
      }
      allianceId = alliance.id;
    }

    // Create user via Better Auth
    let result;
    try {
      result = await auth.api.signUpEmail({
        body: { email, password, name },
        headers: await headers(),
      });
    } catch (err: unknown) {
      console.error("[REGISTER]", err);
      const message =
        err instanceof Error && err.message?.includes("already")
          ? "Este email ya está registrado"
          : "Error al crear la cuenta";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (!result?.user?.id) {
      return NextResponse.json(
        { error: "Error al crear la cuenta" },
        { status: 500 }
      );
    }

    // Update user with additional fields (businessName, allianceId)
    const updateData: Record<string, unknown> = {};
    if (businessName) updateData.businessName = businessName;
    if (allianceId) updateData.allianceId = allianceId;

    if (Object.keys(updateData).length > 0) {
      await db.user.update({
        where: { id: result.user.id },
        data: updateData,
      });
    }

    return NextResponse.json({ user: result.user });
  } catch (err) {
    console.error("[REGISTER]", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
