import { requireAuth } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function FreelancerDeliveriesPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--ice-white)]">Entregas</h1>
      <p className="text-[rgba(245,246,252,0.5)]">
        Gestión de entregas y revisiones.
      </p>
    </div>
  );
}
