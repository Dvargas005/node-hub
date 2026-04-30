import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { t, DEFAULT_LANG } from "@/lib/i18n";

const validTransitions: Record<string, string[]> = {
  NEW: ["REVIEWING", "CANCELED"],
  REVIEWING: ["ASSIGNED", "CANCELED"],
  ASSIGNED: ["IN_PROGRESS", "CANCELED"],
  IN_PROGRESS: ["DELIVERED", "REVISION", "CANCELED"],
  DELIVERED: ["COMPLETED", "REVISION"],
  REVISION: ["IN_PROGRESS"],
};

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireApiRole(["ADMIN", "PM"]);
  if (error || !session) return error;

  const lang = req.cookies.get("node-language")?.value || DEFAULT_LANG;

  try {
    const { status } = await req.json();
    const ticketId = params.id;

    const ticket = await db.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
    }

    const allowed = validTransitions[ticket.status];
    if (!allowed || !allowed.includes(status)) {
      return NextResponse.json(
        { error: t("api.error.invalidTransition", lang).replace("{from}", ticket.status).replace("{to}", status) },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = { status };

    if (status === "IN_PROGRESS" && !ticket.startedAt) {
      data.startedAt = new Date();
    }
    if (status === "DELIVERED" && !ticket.deliveredAt) {
      data.deliveredAt = new Date();
    }
    if (status === "COMPLETED") {
      data.completedAt = new Date();
    }

    const updated = await db.ticket.update({
      where: { id: ticketId },
      data,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[TICKET_STATUS]", err);
    return NextResponse.json({ error: t("api.error.internal", lang) }, { status: 500 });
  }
}
