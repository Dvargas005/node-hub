import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { classifyPlanChange } from "@/lib/plan-terms";

export async function GET(req: NextRequest) {
  const { error, session } = await requireApiRole(["CLIENT"]);
  if (error || !session) return error;

  try {
    const url = new URL(req.url);
    const planSlug = url.searchParams.get("plan");
    if (!planSlug) {
      return NextResponse.json({ error: "Plan required" }, { status: 400 });
    }

    const sub = await db.subscription.findUnique({
      where: { userId: session.user.id },
      include: { plan: true },
    });
    if (!sub || sub.status !== "ACTIVE") {
      return NextResponse.json({ error: "No active subscription" }, { status: 400 });
    }

    const newPlan = await db.plan.findUnique({ where: { slug: planSlug } });
    if (!newPlan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const change = classifyPlanChange(sub.plan, newPlan);
    if (change.kind === "blocked") {
      return NextResponse.json({ error: change.reason }, { status: 400 });
    }

    const currentPlan = {
      slug: sub.plan.slug,
      name: sub.plan.name,
      priceMonthly: sub.plan.priceMonthly,
      setupFee: sub.plan.setupFee,
    };

    // Same tier, Flexible to 12-month: nothing is charged today; the 12-month rate and term
    // start with the next billing period (see checkout route).
    if (change.kind === "switch-to-annual") {
      return NextResponse.json({
        currentPlan,
        newPlan: {
          slug: newPlan.slug,
          name: newPlan.name,
          priceMonthly: newPlan.priceMonthly,
          setupFee: newPlan.setupFee,
          monthlyCredits: newPlan.monthlyCredits + newPlan.bonusCredits,
        },
        currentCredits: sub.creditsRemaining,
        newPlanCredits: 0,
        totalCreditsAfter: sub.creditsRemaining,
        proratedMonthlyDiff: 0,
        setupFeeDiff: 0,
        estimatedCharge: 0,
        daysRemaining: 0,
        switchTerm: true,
        termStartsAt: (sub.currentPeriodEnd ?? new Date()).toISOString(),
        newMinTermMonths: newPlan.minTermMonths,
      });
    }

    // Estimate prorated monthly difference based on days remaining in current period
    const now = new Date();
    const periodEnd = sub.currentPeriodEnd || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const periodStart = sub.currentPeriodStart || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const totalMs = Math.max(1, periodEnd.getTime() - periodStart.getTime());
    const remainingMs = Math.max(0, periodEnd.getTime() - now.getTime());
    const daysRemaining = Math.max(1, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));

    const monthlyDiffCents = newPlan.priceMonthly - sub.plan.priceMonthly;
    const proratedMonthlyDiff = Math.round(monthlyDiffCents * (remainingMs / totalMs));
    const setupFeeDiff = Math.max(0, (newPlan.setupFee || 0) - (sub.plan.setupFee || 0));
    const estimatedCharge = proratedMonthlyDiff + setupFeeDiff;

    return NextResponse.json({
      currentPlan,
      newPlan: {
        slug: newPlan.slug,
        name: newPlan.name,
        priceMonthly: newPlan.priceMonthly,
        setupFee: newPlan.setupFee,
        monthlyCredits: newPlan.monthlyCredits + newPlan.bonusCredits,
      },
      currentCredits: sub.creditsRemaining,
      newPlanCredits: newPlan.monthlyCredits + newPlan.bonusCredits,
      totalCreditsAfter: sub.creditsRemaining + newPlan.monthlyCredits + newPlan.bonusCredits,
      proratedMonthlyDiff,
      setupFeeDiff,
      estimatedCharge,
      daysRemaining,
      switchTerm: false,
      restartTermMonths: change.restartTermMonths ?? null,
    });
  } catch (err) {
    console.error("[UPGRADE_PREVIEW]", err);
    return NextResponse.json({ error: "Failed to compute preview" }, { status: 500 });
  }
}
