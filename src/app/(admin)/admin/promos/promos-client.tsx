"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  PERCENT_OFF: "% Descuento",
  FIXED_CREDITS: "Créditos",
  FREE_MONTH: "Mes gratis",
};

export function PromosClient({ initialPromos }: { initialPromos: any[] }) {
  const [promos, setPromos] = useState(initialPromos);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    code: "",
    type: "PERCENT_OFF",
    value: "",
    maxUses: "",
    validFrom: "",
    validUntil: "",
  });
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    try {
      setSaving(true);
      const res = await fetch("/api/admin/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          type: form.type,
          value: Number(form.value),
          maxUses: form.maxUses ? Number(form.maxUses) : null,
          validFrom: form.validFrom || null,
          validUntil: form.validUntil || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error || "Error");
        return;
      }
      const promo = await res.json();
      setPromos([promo, ...promos]);
      setShowDialog(false);
      setForm({ code: "", type: "PERCENT_OFF", value: "", maxUses: "", validFrom: "", validUntil: "" });
    } catch {
      alert("Error al crear código");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string) {
    try {
      const res = await fetch(`/api/admin/promos/${id}/toggle`, { method: "PATCH" });
      if (!res.ok) return;
      const updated = await res.json();
      setPromos(promos.map((p: any) => (p.id === id ? updated : p)));
    } catch {
      /* noop */
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--ice-white)]">
          Códigos Promocionales
        </h1>
        <button
          onClick={() => setShowDialog(true)}
          className="inline-flex items-center gap-2 rounded-md bg-[var(--gold-bar)] px-4 py-2 text-sm font-bold text-[var(--asphalt-black)] hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Nuevo código
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
        <table className="w-full text-sm text-[var(--ice-white)]">
          <thead>
            <tr className="border-b border-[rgba(245,246,252,0.1)] text-left text-xs uppercase text-[rgba(245,246,252,0.5)]">
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Usos</th>
              <th className="px-4 py-3">Válido desde</th>
              <th className="px-4 py-3">Válido hasta</th>
              <th className="px-4 py-3">Activo</th>
            </tr>
          </thead>
          <tbody>
            {promos.map((p: any) => (
              <tr
                key={p.id}
                className="border-b border-[rgba(245,246,252,0.05)] hover:bg-[rgba(255,255,255,0.02)]"
              >
                <td className="px-4 py-3 font-mono font-bold">{p.code}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-[rgba(255,255,255,0.08)] px-2 py-0.5 text-xs">
                    {TYPE_LABELS[p.type] || p.type}
                  </span>
                </td>
                <td className="px-4 py-3">{p.value}</td>
                <td className="px-4 py-3">
                  {p.currentUses}/{p.maxUses ?? "∞"}
                </td>
                <td className="px-4 py-3">
                  {p.validFrom
                    ? new Date(p.validFrom).toLocaleDateString()
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  {p.validUntil
                    ? new Date(p.validUntil).toLocaleDateString()
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggle(p.id)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      p.isActive ? "bg-green-500" : "bg-[rgba(255,255,255,0.15)]"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        p.isActive ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </td>
              </tr>
            ))}
            {promos.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-[rgba(245,246,252,0.4)]"
                >
                  No hay códigos promocionales
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-lg border border-[rgba(245,246,252,0.1)] bg-[var(--asphalt-black)] p-6 text-[var(--ice-white)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Nuevo código promocional</h2>
              <button
                onClick={() => setShowDialog(false)}
                className="text-[rgba(245,246,252,0.5)] hover:text-[var(--ice-white)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-[rgba(245,246,252,0.5)]">
                  Código
                </label>
                <input
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value.toUpperCase() })
                  }
                  placeholder="PROMO2024"
                  className="w-full rounded-md border border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-sm text-[var(--ice-white)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-[rgba(245,246,252,0.5)]">
                    Tipo
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="h-9 w-full rounded-md border border-[rgba(245,246,252,0.2)] bg-[#1a1108] px-3 text-sm text-[var(--ice-white)]"
                  >
                    <option value="PERCENT_OFF">% Descuento</option>
                    <option value="FIXED_CREDITS">Créditos</option>
                    <option value="FREE_MONTH">Mes gratis</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[rgba(245,246,252,0.5)]">
                    Valor
                  </label>
                  <input
                    type="number"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    placeholder="10"
                    className="w-full rounded-md border border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-sm text-[var(--ice-white)]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-[rgba(245,246,252,0.5)]">
                  Usos máximos (vacío = ilimitado)
                </label>
                <input
                  type="number"
                  value={form.maxUses}
                  onChange={(e) =>
                    setForm({ ...form, maxUses: e.target.value })
                  }
                  placeholder="100"
                  className="w-full rounded-md border border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-sm text-[var(--ice-white)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-[rgba(245,246,252,0.5)]">
                    Válido desde
                  </label>
                  <input
                    type="date"
                    value={form.validFrom}
                    onChange={(e) =>
                      setForm({ ...form, validFrom: e.target.value })
                    }
                    className="w-full rounded-md border border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-sm text-[var(--ice-white)]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[rgba(245,246,252,0.5)]">
                    Válido hasta
                  </label>
                  <input
                    type="date"
                    value={form.validUntil}
                    onChange={(e) =>
                      setForm({ ...form, validUntil: e.target.value })
                    }
                    className="w-full rounded-md border border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-sm text-[var(--ice-white)]"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowDialog(false)}
                className="rounded-md border border-[rgba(245,246,252,0.2)] px-4 py-2 text-sm text-[var(--ice-white)] hover:bg-[rgba(255,255,255,0.05)]"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !form.code || !form.value}
                className="rounded-md bg-[var(--gold-bar)] px-4 py-2 text-sm font-bold text-[var(--asphalt-black)] hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Creando..." : "Crear código"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
