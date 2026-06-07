import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireApiRole(["ADMIN"]);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await req.json();
    const { tag } = body;

    if (tag !== null && !["testing", "internal"].includes(tag)) {
      return NextResponse.json({ error: "Invalid tag" }, { status: 400 });
    }

    await db.user.update({
      where: { id },
      data: { userTag: tag },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[ADMIN_CLIENTS_TAG]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
