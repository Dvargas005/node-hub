"use client";

import { useEffect, useState } from "react";

interface DashboardData {
  revenue: { mrr: number; mrrFormatted: string };
  tickets: { thisMonth: number; lastMonth: number; completedThisMonth: number; completedLastMonth: number; avgDeliveryDays: number; firstRoundRate: number };
  clients: { total: number; active: number; newThisMonth: number; churnRate: number };
  team: { totalFreelancers: number; activeFreelancers: number; avgLoad: number; topFreelancers: { name: string; completed: number }[] };
}

function Delta({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  return <span className={pct >= 0 ? "text-green-400 text-sm" : "text-red-400 text-sm"}>{pct >= 0 ? `▲ ${pct}%` : `▼ ${Math.abs(pct)}%`}</span>;
}

function Card({ title, value, sub }: { title: string; value: string | number; sub?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)] p-5">
      <p className="text-[rgba(245,246,252,0.5)] text-sm">{title}</p>
      <p className="text-2xl font-bold text-[var(--ice-white)] font-[var(--font-lexend)] mt-1">{value}</p>
      {sub && <div className="mt-1">{sub}</div>}
    </div>
  );
}

export default function MetricsClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/metrics/dashboard")
      .then((r) => { if (!r.ok) throw new Error("Error loading metrics"); return r.json(); })
      .then(setData)
      .catch((e: any) => setError(e.message));
  }, []);

  if (error) return <p className="text-red-400">{error}</p>;
  if (!data) return <p className="text-[rgba(245,246,252,0.5)]">Loading...</p>;

  const { revenue, tickets, clients, team } = data;

  return (
    <div className="space-y-8">
      {/* Revenue */}
      <section>
        <h2 className="font-[var(--font-lexend)] text-lg font-bold text-[var(--gold-bar)] mb-3">Revenue</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card title="MRR" value={revenue.mrrFormatted} />
          <Card title="Active subscriptions" value={clients.active} />
        </div>
      </section>

      {/* Operations */}
      <section>
        <h2 className="font-[var(--font-lexend)] text-lg font-bold text-[var(--gold-bar)] mb-3">Operations</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Card title="Tickets created" value={tickets.thisMonth} sub={<Delta current={tickets.thisMonth} previous={tickets.lastMonth} />} />
          <Card title="Completed" value={tickets.completedThisMonth} sub={<Delta current={tickets.completedThisMonth} previous={tickets.completedLastMonth} />} />
          <Card title="Avg. delivery" value={`${tickets.avgDeliveryDays} d`} />
          <Card title="Approved 1st round" value={`${tickets.firstRoundRate}%`} />
        </div>
      </section>

      {/* Clients */}
      <section>
        <h2 className="font-[var(--font-lexend)] text-lg font-bold text-[var(--gold-bar)] mb-3">Clients</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Card title="Total" value={clients.total} />
          <Card title="Active" value={clients.active} />
          <Card title="New this month" value={clients.newThisMonth} />
          <Card title="Churn" value={`${clients.churnRate}%`} />
        </div>
      </section>

      {/* Team */}
      <section>
        <h2 className="font-[var(--font-lexend)] text-lg font-bold text-[var(--gold-bar)] mb-3">Team</h2>
        <div className="grid gap-4 md:grid-cols-3 mb-4">
          <Card title="Active freelancers" value={`${team.activeFreelancers} / ${team.totalFreelancers}`} />
          <Card title="Avg. load" value={`${team.avgLoad}%`} />
        </div>
        {team.topFreelancers.length > 0 && (
          <div className="rounded-lg border border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)] p-5">
            <p className="text-[rgba(245,246,252,0.5)] text-sm mb-3">Top 5 completed this month</p>
            <table className="w-full text-sm">
              <thead><tr className="text-[rgba(245,246,252,0.5)]"><th className="text-left pb-2">Name</th><th className="text-right pb-2">Completed</th></tr></thead>
              <tbody>
                {team.topFreelancers.map((f: any) => (
                  <tr key={f.name} className="border-t border-[rgba(245,246,252,0.1)]">
                    <td className="py-2 text-[var(--ice-white)]">{f.name}</td>
                    <td className="py-2 text-right text-[var(--ice-white)]">{f.completed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
