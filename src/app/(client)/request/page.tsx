import { requireAuth } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function RequestPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--ice-white)]">
        Nueva Solicitud
      </h1>
      <p className="text-[rgba(245,246,252,0.5)]">
        Wizard de solicitud — próximamente.
      </p>
    </div>
  );
}
