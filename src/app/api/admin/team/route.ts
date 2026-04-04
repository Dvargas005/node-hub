import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function GET() {
  try {
    const { error, session } = await requireApiRole(["ADMIN"]);
    if (error || !session) return error;

    const team = await db.user.findMany({
      where: { role: { in: ["PM", "ADMIN"] } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        timezone: true,
        createdAt: true,
        _count: { select: { pmClients: true, managedFreelancers: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      team: team.map((m: any) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role,
        phone: m.phone,
        timezone: m.timezone,
        createdAt: m.createdAt,
        clientCount: m._count.pmClients,
        freelancerCount: m._count.managedFreelancers,
      })),
    });
  } catch (err) {
    console.error("[ADMIN_TEAM_GET]", err);
    return NextResponse.json({ error: "Error al obtener equipo" }, { status: 500 });
  }
}
