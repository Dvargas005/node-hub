import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

const MAX_ABS_AMOUNT = 99999;
const MIN_REASON_LEN = 3;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error, session } = await requireApiRole(["ADMIN"]);
  if (error || !session) return error;

  try {
    const { id: clientId } = await params;
    const body = await req.json();

    const amount = Number(body.amount);
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    if (!Number.isFinite(amount) || amount === 0 || !Number.isInteger(amount)) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    if (Math.abs(amount) > MAX_ABS_AMOUNT) {
      return NextResponse.json({ error: "Amount too large" }, { status: 400 });
    }
    if (reason.length < MIN_REASON_LEN) {
      return NextResponse.json({ error: "Reason required" }, { status: 400 });
    }

    const client = await db.user.findUnique({
      where: { id: clientId },
      select: { id: true, role: true },
    });
    if (!client || client.role !== "CLIENT") {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    await db.$transaction(async (tx: any) => {
      if (amount > 0) {
        // Add to freeCredits (always grants — never to plan credits which reset monthly)
        await tx.user.update({
          where: { id: clientId },
          data: { freeCredits: { increment: amount } },
        });
      } else {
        // Remove: drain freeCredits first, then plan credits
        const absAmount = Math.abs(amount);
        const user = await tx.user.findUnique({
          where: { id: clientId },
          select: { freeCredits: true },
        });
        const free = user?.freeCredits || 0;
        const fromFree = Math.min(free, absAmount);
        const fromPlan = absAmount - fromFree;

        if (fromFree > 0) {
          await tx.user.update({
            where: { id: clientId },
            data: { freeCredits: { decrement: fromFree } },
          });
        }
        if (fromPlan > 0) {
          const sub = await tx.subscription.findUnique({ where: { userId: clientId } });
          if (sub && sub.creditsRemaining >= fromPlan) {
            await tx.subscription.update({
              where: { id: sub.id },
              data: { creditsRemaining: { decrement: fromPlan } },
            });
          } else {
            // Not enough credits to remove — abort the whole transaction
            throw new Error("INSUFFICIENT_CREDITS_TO_REMOVE");
          }
        }
      }

      await tx.notification.create({
        data: {
          userId: clientId,
          title: amount > 0 ? "Credits added" : "Credits adjusted",
          message: `${Math.abs(amount)} credits ${amount > 0 ? "added" : "removed"} by admin. Reason: ${reason}`,
          type: "system",
          link: "/billing",
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === "INSUFFICIENT_CREDITS_TO_REMOVE") {
      return NextResponse.json(
        { error: "Client does not have enough credits to remove this amount" },
        { status: 400 },
      );
    }
    console.error("[ADMIN_CREDITS]", err);
    return NextResponse.json({ error: "Error adjusting credits" }, { status: 500 });
  }
}
