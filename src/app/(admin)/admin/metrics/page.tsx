import { requireRole } from "@/lib/session";
import MetricsClient from "./metrics-client";

export const dynamic = "force-dynamic";

export default async function AdminMetricsPage() {
  await requireRole(["ADMIN"]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--ice-white)] font-[var(--font-lexend)]">
        Metricas
      </h1>
      <p className="text-[rgba(245,246,252,0.5)]">
        KPIs, ingresos y rendimiento del equipo.
      </p>
      <MetricsClient />
    </div>
  );
}
