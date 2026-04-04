import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error, session } = await requireApiRole(["ADMIN"]);
    if (error || !session) return error;

    const alliance = await db.alliance.findUnique({
      where: { id: params.id },
    });

    if (!alliance) {
      return NextResponse.json(
        { error: "Alianza no encontrada" },
        { status: 404 }
      );
    }

    const clients = await db.user.findMany({
      where: { allianceId: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        subscription: {
          select: {
            status: true,
            plan: { select: { name: true } },
          },
        },
      },
    });

    const activeClients = clients.filter(
      (c: any) => c.subscription?.status === "ACTIVE"
    ).length;

    return NextResponse.json({
      alliance,
      totalClients: clients.length,
      activeClients,
      clients: clients.map((c: any) => ({
        name: c.name,
        email: c.email,
        plan: c.subscription?.plan?.name || "Sin plan",
        active: c.subscription?.status === "ACTIVE",
      })),
      revenueShare: activeClients * (alliance.revenueShare || 0),
    });
  } catch (err: any) {
    console.error("[ALLIANCE_STATS]", err);
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}
