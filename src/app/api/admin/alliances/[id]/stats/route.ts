import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { t, DEFAULT_LANG } from "@/lib/i18n";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const lang = req.cookies.get("node-language")?.value || DEFAULT_LANG;

  try {
    const { error, session } = await requireApiRole(["ADMIN"]);
    if (error || !session) return error;

    const alliance = await db.alliance.findUnique({
      where: { id: params.id },
    });

    if (!alliance) {
      return NextResponse.json(
        { error: t("api.error.allianceNotFound", lang) },
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
        plan: c.subscription?.plan?.name || t("billing.starter", lang),
        active: c.subscription?.status === "ACTIVE",
      })),
      revenueShare: activeClients * (alliance.revenueShare || 0),
    });
  } catch (err: any) {
    console.error("[ALLIANCE_STATS]", err);
    return NextResponse.json(
      { error: t("api.error.statsError", lang) },
      { status: 500 }
    );
  }
}
