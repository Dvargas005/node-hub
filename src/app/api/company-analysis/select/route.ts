import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const { error, session } = await requireApiRole(["CLIENT"]);
  if (error || !session) return error;

  try {
    const { option } = await req.json();
    if (option !== "A" && option !== "B") {
      return NextResponse.json({ error: "Opción inválida" }, { status: 400 });
    }

    const userId = session.user.id;
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { companyAnalysis: true },
    });

    const analysis = user?.companyAnalysis as Record<string, unknown> | null;
    if (!analysis?.options) {
      return NextResponse.json({ error: "No tienes un análisis generado" }, { status: 400 });
    }

    const options = analysis.options as Record<string, unknown>;
    const selected = option === "A" ? options.optionA : options.optionB;

    await db.user.update({
      where: { id: userId },
      data: {
        companyAnalysis: JSON.parse(JSON.stringify({ options: analysis.options, selected, selectedOption: option })),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[COMPANY_ANALYSIS_SELECT]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
