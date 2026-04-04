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

    // Create user via Better Auth with asResponse: true to capture Set-Cookie
    let authRes: Response;
    try {
      authRes = await auth.api.signUpEmail({
        body: { email, password, name },
        headers: await headers(),
        asResponse: true,
      });
    } catch (err: unknown) {
      console.error("[REGISTER] signUpEmail threw:", err);
      const message =
        err instanceof Error && err.message?.includes("already")
          ? "Este email ya está registrado"
          : "Error al crear la cuenta";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    // Better Auth returns non-ok for duplicates, validation errors, etc.
    if (!authRes.ok) {
      const errData = await authRes.json().catch(() => null);
      console.error("[REGISTER] signUpEmail failed:", authRes.status, errData);

      const msg =
        typeof errData?.message === "string" ? errData.message : "";
      const isDuplicate =
        msg.includes("already") || msg.includes("exists") || authRes.status === 422;

      return NextResponse.json(
        { error: isDuplicate ? "Este email ya está registrado" : "Error al crear la cuenta" },
        { status: 400 }
      );
    }

    const authData = await authRes.json();
    const userId: string | undefined = authData?.user?.id;

    if (!userId) {
      console.error("[REGISTER] No user.id in response:", authData);
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
        where: { id: userId },
        data: updateData,
      });
    }

    // Forward Set-Cookie headers from Better Auth so the user is auto-logged in
    const response = NextResponse.json({ user: authData.user });
    for (const cookie of authRes.headers.getSetCookie()) {
      response.headers.append("Set-Cookie", cookie);
    }

    return response;
  } catch (err) {
    console.error("[REGISTER]", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
