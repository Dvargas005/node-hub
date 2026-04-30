import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { t, DEFAULT_LANG } from "@/lib/i18n";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const lang = req.cookies.get("node-language")?.value || DEFAULT_LANG;
  const { error, session } = await requireApiRole(["CLIENT"]);
  if (error || !session) return error;

  try {
    const ticketId = params.id;
    const userId = session.user.id;

    // C12: Wrap in transaction for atomicity + refund
    await db.$transaction(async (tx: any) => {
      const ticket = await tx.ticket.findUnique({
        where: { id: ticketId, userId },
      });

      if (!ticket) {
        throw new Error("NOT_FOUND");
      }

      if (!["NEW", "REVIEWING"].includes(ticket.status)) {
        throw new Error("INVALID_STATUS");
      }

      await tx.ticket.update({
        where: { id: ticketId },
        data: { status: "CANCELED" },
      });

      // I5: Refund credits if ticket is NEW (no work done yet)
      if (ticket.status === "NEW" && ticket.creditsCharged > 0) {
        const user = await tx.user.findUnique({ where: { id: userId }, select: { freeCredits: true } });
        // Refund to free credits first (up to 10 cap), rest to plan
        const maxFreeRefund = Math.max(0, 10 - (user?.freeCredits || 0));
        const freeRefund = Math.min(ticket.creditsCharged, maxFreeRefund);
        const planRefund = ticket.creditsCharged - freeRefund;

        if (freeRefund > 0) {
          await tx.user.update({ where: { id: userId }, data: { freeCredits: { increment: freeRefund } } });
        }
        if (planRefund > 0) {
          const sub = await tx.subscription.findUnique({ where: { userId } });
          if (sub) {
            await tx.subscription.update({ where: { id: sub.id }, data: { creditsRemaining: { increment: planRefund } } });
          }
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "NOT_FOUND") {
      return NextResponse.json({ error: t("api.error.ticketNotFound", lang) }, { status: 404 });
    }
    if (msg === "INVALID_STATUS") {
      return NextResponse.json(
        { error: t("api.error.cannotCancelInProgress", lang) },
        { status: 400 }
      );
    }
    console.error("[TICKET_CANCEL]", err);
    return NextResponse.json({ error: t("api.error.internal", lang) }, { status: 500 });
  }
}
