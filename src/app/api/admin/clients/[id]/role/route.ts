import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireApiRole(["ADMIN"]);
  if (error || !session) return error;

  try {
    const { id } = await params;
    const body = await req.json();
    const { role } = body;

    if (!["ADMIN", "PM", "FREELANCER", "CLIENT"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    if (id === session.user.id && role !== "ADMIN") {
      return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
    }

    await db.user.update({ where: { id }, data: { role } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[ADMIN_CLIENTS_ROLE]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
