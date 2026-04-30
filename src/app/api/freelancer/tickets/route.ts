import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { t, DEFAULT_LANG } from "@/lib/i18n";

export async function GET(req: NextRequest) {
  const { error, session } = await requireApiRole(["FREELANCER"]);
  if (error || !session) return error;

  const lang = req.cookies.get("node-language")?.value || DEFAULT_LANG;

  try {
    const freelancer = await db.freelancer.findUnique({
      where: { userId: session.user.id },
    });
    if (!freelancer) {
      return NextResponse.json(
        { error: t("api.error.freelancerNotFound", lang) },
        { status: 404 }
      );
    }

    const tickets = await db.ticket.findMany({
      where: {
        freelancerId: freelancer.id,
        status: { in: ["ASSIGNED", "IN_PROGRESS", "DELIVERED", "REVISION"] },
      },
      select: {
        id: true, number: true, status: true, priority: true, pmNotes: true,
        assignedAt: true, startedAt: true, createdAt: true, updatedAt: true,
        user: { select: { name: true, businessName: true } },
        variant: { select: { name: true, service: { select: { name: true, category: true } } } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const serialized = tickets.map((tk: any) => ({
      ...tk,
      createdAt: tk.createdAt.toISOString(),
      updatedAt: tk.updatedAt.toISOString(),
      assignedAt: tk.assignedAt?.toISOString() || null,
      startedAt: tk.startedAt?.toISOString() || null,
    }));

    return NextResponse.json(serialized);
  } catch (err) {
    console.error("[FREELANCER_TICKETS]", err);
    return NextResponse.json(
      { error: t("api.error.internal", lang) },
      { status: 500 }
    );
  }
}
