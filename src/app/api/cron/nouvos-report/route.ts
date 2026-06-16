import { NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Stats = {
  product: string;
  registrations: { last7: number; last30: number; last365: number; allTime: number; byRole?: Record<string, number> };
  subscriptions: { active: number; byTier: Record<string, number> };
  mrrUsd: number;
  arrUsd: number;
} | null;

const since = (days: number) => new Date(Date.now() - days * 86_400_000);

// NODE's own numbers (Prisma). Plan.priceMonthly is in cents.
async function nodeStats(): Promise<Stats> {
  const [allTime, last7, last30, last365, clients] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: since(7) } } }),
    db.user.count({ where: { createdAt: { gte: since(30) } } }),
    db.user.count({ where: { createdAt: { gte: since(365) } } }),
    db.user.count({ where: { role: "CLIENT" } })
  ]);
  const subs = await db.subscription.findMany({
    where: { status: "ACTIVE" },
    select: { plan: { select: { name: true, priceMonthly: true } } }
  });
  const byTier: Record<string, number> = {};
  let mrr = 0;
  for (const s of subs) {
    byTier[s.plan.name] = (byTier[s.plan.name] ?? 0) + 1;
    mrr += s.plan.priceMonthly / 100;
  }
  return { product: "NODE", registrations: { last7, last30, last365, allTime, byRole: { clients } }, subscriptions: { active: subs.length, byTier }, mrrUsd: mrr, arrUsd: mrr * 12 };
}

async function fetchStats(url: string, secret: string): Promise<Stats> {
  try {
    const r = await fetch(url, { headers: { "x-internal-secret": secret }, cache: "no-store" });
    if (!r.ok) return null;
    return (await r.json()) as Stats;
  } catch {
    return null;
  }
}

const money = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

function section(s: Stats, fallbackName: string): string {
  if (!s) return `<h3 style="color:#FFC919;margin:24px 0 6px">${fallbackName}</h3><p style="opacity:.7">⚠️ Could not reach this product's stats this run.</p>`;
  const reg = s.registrations;
  const roles = reg.byRole ? Object.entries(reg.byRole).map(([k, v]) => `${k}: ${v}`).join(" · ") : "";
  const tiers = Object.entries(s.subscriptions.byTier).map(([k, v]) => `${k}: ${v}`).join(" · ") || "—";
  return `
    <h3 style="color:#FFC919;margin:24px 0 6px">${s.product}</h3>
    <p style="margin:2px 0"><b>New registrations</b> — 7d: ${reg.last7} · 30d: ${reg.last30} · 365d: ${reg.last365} · all-time: ${reg.allTime}</p>
    ${roles ? `<p style="margin:2px 0;opacity:.8">By type: ${roles}</p>` : ""}
    <p style="margin:2px 0"><b>Active subscriptions</b>: ${s.subscriptions.active} (${tiers})</p>
    <p style="margin:2px 0"><b>MRR</b> ${money(s.mrrUsd)} · <b>ARR</b> ${money(s.arrUsd)}</p>`;
}

export async function GET(req: Request) {
  // Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}` when CRON_SECRET is set.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const internalSecret = process.env.INTERNAL_STATS_SECRET ?? "";
  const zUrl = process.env.ZANAPRONTO_STATS_URL ?? "https://www.zanapronto.com/api/internal/stats";
  const gUrl = process.env.GGGAMBIT_STATS_URL ?? "https://www.gggambit.com/api/internal/stats";

  const [node, zana, ggg] = await Promise.all([
    nodeStats().catch(() => null),
    fetchStats(zUrl, internalSecret),
    fetchStats(gUrl, internalSecret)
  ]);

  const all = [ggg, zana, node];
  const totalMrr = all.reduce((sum, s) => sum + (s?.mrrUsd ?? 0), 0);
  const totalReg7 = all.reduce((sum, s) => sum + (s?.registrations.last7 ?? 0), 0);

  const html = `<div style="font-family:Arial,sans-serif;background:#130A06;color:#F5F6FC;padding:32px">
    <h1 style="color:#FFC919;margin:0 0 4px">Nouvos weekly report</h1>
    <p style="opacity:.7;margin:0 0 16px">Registrations & revenue across G.G. Gambit, Zanapronto and NODE.</p>
    <div style="background:#FFC919;color:#130A06;border-radius:12px;padding:16px;margin:0 0 8px">
      <p style="margin:0;font-size:18px"><b>Total MRR ${money(totalMrr)}</b> · ARR ${money(totalMrr * 12)}</p>
      <p style="margin:6px 0 0">New registrations this week (all products): <b>${totalReg7}</b></p>
    </div>
    ${section(ggg, "G.G. Gambit")}
    ${section(zana, "Zanapronto")}
    ${section(node, "NODE")}
    <p style="margin-top:28px;opacity:.5;font-size:12px">Generated automatically · Nouvos ONE · figures are run-rate snapshots from active subscriptions.</p>
  </div>`;

  const to = process.env.REPORT_EMAIL ?? "erich@nouvos.one";
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  if (resend) {
    await resend.emails.send({
      from: process.env.FROM_EMAIL || "N.O.D.E. <noreply@node.nouvos.one>",
      to,
      subject: `Nouvos weekly report — ${money(totalMrr)} MRR`,
      html
    });
  }

  return NextResponse.json({ ok: true, totalMrr, emailed: !!resend, products: all.map((s) => s?.product ?? "unreachable") });
}
