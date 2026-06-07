import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function GET() {
  const { error } = await requireApiRole(["ADMIN", "PM"]);
  if (error) return error;

  try {
    const [clients, prospects, team] = await Promise.all([
      db.user.count({
        where: {
          role: "CLIENT",
          userTag: null,
          subscription: { status: "ACTIVE" },
        },
      }),
      db.user.count({
        where: {
          role: "CLIENT",
          userTag: null,
          OR: [
            { subscription: null },
            { subscription: { status: { not: "ACTIVE" } } },
          ],
        },
      }),
      db.user.count({
        where: {
          OR: [
            { role: { in: ["ADMIN", "PM", "FREELANCER"] } },
            { userTag: { in: ["testing", "internal"] } },
          ],
        },
      }),
    ]);

    return NextResponse.json({ clients, prospects, team });
  } catch (err) {
    console.error("[ADMIN_CLIENTS_COUNTS]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
