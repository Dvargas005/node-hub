import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

const validAvailability = ["AVAILABLE", "BUSY", "ON_LEAVE", "INACTIVE"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireApiRole(["ADMIN", "PM"]);
  if (error || !session) return error;

  try {
    const { availability } = await req.json();
    const freelancerId = params.id;

    if (!availability || !validAvailability.includes(availability)) {
      return NextResponse.json(
        { error: `Disponibilidad no válida. Valores permitidos: ${validAvailability.join(", ")}` },
        { status: 400 }
      );
    }

    const existing = await db.freelancer.findUnique({ where: { id: freelancerId } });
    if (!existing) {
      return NextResponse.json({ error: "Freelancer no encontrado" }, { status: 404 });
    }

    const updated = await db.freelancer.update({
      where: { id: freelancerId },
      data: { availability },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[FREELANCER_AVAILABILITY]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
