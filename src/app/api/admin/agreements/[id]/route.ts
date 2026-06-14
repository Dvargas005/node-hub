import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

// PM/Admin edits the draft agreement scope before sending it for signature.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireApiRole(["ADMIN", "PM"]);
  if (error || !session) return error;

  try {
    const body = await req.json();
    const ag = await db.agreement.findUnique({ where: { id: params.id } });
    if (!ag) return NextResponse.json({ error: "Agreement not found" }, { status: 404 });
    if (ag.status === "SIGNED") return NextResponse.json({ error: "A signed agreement can't be edited" }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (typeof body.title === "string") data.title = body.title.slice(0, 200);
    if (typeof body.scope === "string") data.scope = body.scope.slice(0, 8000);
    if (typeof body.method === "string") data.method = body.method.slice(0, 8000);
    if (Array.isArray(body.deliverables))
      data.deliverables = body.deliverables.map((s: unknown) => String(s).slice(0, 300).trim()).filter(Boolean).slice(0, 40);
    if (Number.isFinite(body.timelineDays)) data.timelineDays = Math.max(1, Math.round(body.timelineDays));
    if (body.targetDate) {
      const d = new Date(body.targetDate);
      if (!Number.isNaN(d.getTime())) data.targetDate = d;
    }

    const updated = await db.agreement.update({ where: { id: params.id }, data });
    return NextResponse.json({ agreement: updated });
  } catch (e) {
    console.error("[AGREEMENT_PATCH]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
