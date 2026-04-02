import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, password, businessName, allianceCode } = body;

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
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear la cuenta";
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
}
