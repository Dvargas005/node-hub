import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function GET() {
  const { error, session } = await requireApiRole(["FREELANCER"]);
  if (error || !session) return error;

  try {
    const freelancer = await db.freelancer.findUnique({
      where: { userId: session.user.id },
    });
    if (!freelancer) {
      return NextResponse.json(
        { error: "Perfil de freelancer no encontrado" },
        { status: 404 }
      );
    }

    const tickets = await db.ticket.findMany({
      where: {
        freelancerId: freelancer.id,
        status: { in: ["ASSIGNED", "IN_PROGRESS", "DELIVERED", "REVISION"] },
      },
      include: {
        user: { select: { name: true, businessName: true } },
        variant: {
          include: { service: { select: { name: true, category: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const serialized = tickets.map((t: any) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));

    return NextResponse.json(serialized);
  } catch (err) {
    console.error("[FREELANCER_TICKETS]", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
