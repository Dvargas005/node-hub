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
    const { feedback } = await req.json();
    if (!feedback || typeof feedback !== "string" || feedback.trim().length === 0) {
      return NextResponse.json({ error: t("api.error.describeAdjustments", lang) }, { status: 400 });
    }

    // I9: all inside transaction
    await db.$transaction(async (tx: any) => {
      const ticket = await tx.ticket.findUnique({
        where: { id: params.id, userId: session.user.id },
      });
      if (!ticket) throw new Error("NOT_FOUND");
      if (ticket.status !== "DELIVERED") throw new Error("INVALID_STATUS");

      const delivery = await tx.delivery.findFirst({
        where: { ticketId: ticket.id, status: "SENT_TO_CLIENT" },
        orderBy: { round: "desc" },
      });
      if (!delivery) throw new Error("NO_DELIVERY");

      await tx.delivery.update({
        where: { id: delivery.id },
        data: { status: "REVISION_REQUESTED", clientFeedback: feedback.trim().substring(0, 2000) },
      });

      // Count previous revisions
      const revisionCount = await tx.delivery.count({
        where: { ticketId: ticket.id, status: "REVISION_REQUESTED" },
      });

      // Auto-surcharge on 3rd+ revision (10% of original cost)
      if (revisionCount >= 2) {
        const surchargeAmount = Math.ceil(ticket.creditsCharged * 0.1);

        // Check user has credits
        const usr = await tx.user.findUnique({ where: { id: session.user.id }, select: { freeCredits: true } });
        const sub = await tx.subscription.findUnique({ where: { userId: session.user.id } });
        const totalCr = (usr?.freeCredits || 0) + ((sub as any)?.status === "ACTIVE" ? (sub as any).creditsRemaining : 0);

        if (totalCr < surchargeAmount) {
          throw new Error("INSUFFICIENT_CREDITS_REVISION");
        }

        // Deduct
        let rem = surchargeAmount;
        if ((usr?.freeCredits || 0) > 0) {
          const fromFree = Math.min(usr!.freeCredits, rem);
          await tx.user.update({ where: { id: session.user.id }, data: { freeCredits: { decrement: fromFree } } });
          rem -= fromFree;
        }
        if (rem > 0 && sub) {
          await tx.subscription.update({ where: { id: (sub as any).id }, data: { creditsRemaining: { decrement: rem } } });
        }

        await tx.ticketSurcharge.create({
          data: { ticketId: ticket.id, amount: surchargeAmount, reason: t("api.notification.additionalRevision", lang).replace("{count}", String(revisionCount + 1)), addedBy: session.user.id },
        });

        await tx.ticketMessage.create({
          data: { ticketId: ticket.id, senderId: session.user.id, senderRole: "CLIENT", content: t("api.notification.revisionCost", lang).replace("{amount}", String(surchargeAmount)), isInternal: false },
        });
      }

      await tx.ticket.update({
        where: { id: ticket.id },
        data: { status: "REVISION" },
      });
      await tx.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: session.user.id,
          senderRole: "CLIENT",
          content: feedback.trim().substring(0, 2000),
          isInternal: false,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "NOT_FOUND") return NextResponse.json({ error: t("api.error.ticketNotFound", lang) }, { status: 404 });
    if (msg === "INVALID_STATUS") return NextResponse.json({ error: t("api.error.noDeliveryToReview", lang) }, { status: 400 });
    if (msg === "NO_DELIVERY") return NextResponse.json({ error: t("api.error.noPendingDelivery", lang) }, { status: 400 });
    if (msg === "INSUFFICIENT_CREDITS_REVISION") return NextResponse.json({ error: t("api.error.insufficientCreditsRevision", lang) }, { status: 402 });
    console.error("[TICKET_REVISION]", err);
    return NextResponse.json({ error: t("api.error.internal", lang) }, { status: 500 });
  }
}
