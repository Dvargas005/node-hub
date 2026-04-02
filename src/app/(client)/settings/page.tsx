import { requireAuth } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--ice-white)]">
        Configuración
      </h1>
      <p className="text-[rgba(245,246,252,0.5)]">
        Ajusta tu perfil, notificaciones e idioma.
      </p>
    </div>
  );
}
