import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

const validAvailability = ["AVAILABLE", "BUSY", "ON_LEAVE"];

export async function PATCH(req: NextRequest) {
  const { error, session } = await requireApiRole(["FREELANCER"]);
  if (error || !session) return error;

  try {
    const { availability } = await req.json();

    if (!availability || !validAvailability.includes(availability)) {
      return NextResponse.json(
        {
          error: `Disponibilidad no válida. Valores permitidos: ${validAvailability.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const freelancer = await db.freelancer.findUnique({
      where: { userId: session.user.id },
    });
    if (!freelancer) {
      return NextResponse.json(
        { error: "Perfil de freelancer no encontrado" },
        { status: 404 }
      );
    }

    if (freelancer.availability === "INACTIVE") {
      return NextResponse.json({ error: "Tu cuenta está desactivada. Contacta a tu PM." }, { status: 403 });
    }

    const updated = await db.freelancer.update({
      where: { id: freelancer.id },
      data: { availability },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[FREELANCER_AVAILABILITY]", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
