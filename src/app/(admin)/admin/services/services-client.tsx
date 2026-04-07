"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { categoryLabels, categoryColors } from "@/lib/status-labels";
import { ChevronDown, ChevronRight, Plus, Pencil, Search } from "lucide-react";

/* ── style tokens ─────────────────────────────────────────── */
const crd = "border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]";
const inp = "w-full rounded-md border border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-sm text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)] focus:outline-none focus:ring-1 focus:ring-[var(--gold-bar)]";
const sel = "h-9 w-full rounded-md border border-[rgba(245,246,252,0.2)] bg-[#1a1108] px-3 text-sm text-[var(--ice-white)] [&_option]:bg-[#1a1108] [&_option]:text-[var(--ice-white)]";
const goldBtn = "bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold text-xs";
const dlg = "border-[rgba(245,246,252,0.1)] bg-[var(--asphalt-black)] text-[var(--ice-white)]";
const lbl = "text-xs font-medium text-[rgba(245,246,252,0.5)]";

/* ── interfaces ───────────────────────────────────────────── */
interface Variant {
  id: string; name: string; creditCost: number; description: string;
  estimatedDays: number; minPlan: string | null; isPopular: boolean;
  isNew: boolean; isActive: boolean; sortOrder: number;
}
interface ServiceData {
  id: string; name: string; slug: string; category: string;
  description: string; longDescription: string | null; icon: string | null;
  tags: string[]; sortOrder: number; isActive: boolean; variants: Variant[];
}

const categories = ["DESIGN", "WEB", "MARKETING"] as const;
const planOptions = [
  { value: "", label: "None" },
  { value: "member", label: "Member" },
  { value: "growth", label: "Growth" },
  { value: "pro", label: "Pro" },
];

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* ================================================================
   MAIN COMPONENT
   ================================================================ */
export function ServicesClient({
  services,
  isAdmin,
}: {
  services: ServiceData[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* ── service dialog state ─────────────────────────────────── */
  const [svcOpen, setSvcOpen] = useState(false);
  const [editSvc, setEditSvc] = useState<ServiceData | null>(null);
  const [svcForm, setSvcForm] = useState({
    name: "", slug: "", category: "DESIGN", description: "",
    longDescription: "", icon: "", tags: "", sortOrder: 0, isActive: true,
  });

  /* ── variant dialog state ─────────────────────────────────── */
  const [varOpen, setVarOpen] = useState(false);
  const [editVar, setEditVar] = useState<Variant | null>(null);
  const [varServiceId, setVarServiceId] = useState("");
  const [varForm, setVarForm] = useState({
    name: "", creditCost: 0, description: "", estimatedDays: 1,
    minPlan: "", isPopular: false, isNew: false, sortOrder: 0,
  });

  /* ── helpers ──────────────────────────────────────────────── */
  const toggleExpand = (id: string) =>
    setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filtered = services.filter((s: any) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  /* ── service CRUD ─────────────────────────────────────────── */
  function openNewService() {
    setEditSvc(null);
    setSvcForm({
      name: "", slug: "", category: "DESIGN", description: "",
      longDescription: "", icon: "", tags: "", sortOrder: 0, isActive: true,
    });
    setError("");
    setSvcOpen(true);
  }

  function openEditService(s: ServiceData) {
    setEditSvc(s);
    setSvcForm({
      name: s.name,
      slug: s.slug,
      category: s.category,
      description: s.description,
      longDescription: s.longDescription || "",
      icon: s.icon || "",
      tags: s.tags.join(", "),
      sortOrder: s.sortOrder,
      isActive: s.isActive,
    });
    setError("");
    setSvcOpen(true);
  }

  async function saveService() {
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...svcForm,
        tags: svcForm.tags
          .split(",")
          .map((t: any) => t.trim())
          .filter(Boolean),
        longDescription: svcForm.longDescription || null,
        icon: svcForm.icon || null,
      };

      const url = editSvc
        ? `/api/admin/services/${editSvc.id}`
        : "/api/admin/services";

      const res = await fetch(url, {
        method: editSvc ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error saving");
        return;
      }

      setSvcOpen(false);
      router.refresh();
    } catch {
      setError("Connection error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleService(id: string) {
    try {
      await fetch(`/api/admin/services/${id}/toggle`, { method: "PATCH" });
      router.refresh();
    } catch {
      /* silent */
    }
  }

  /* ── variant CRUD ─────────────────────────────────────────── */
  function openNewVariant(serviceId: string) {
    setEditVar(null);
    setVarServiceId(serviceId);
    setVarForm({
      name: "", creditCost: 0, description: "", estimatedDays: 1,
      minPlan: "", isPopular: false, isNew: false, sortOrder: 0,
    });
    setError("");
    setVarOpen(true);
  }

  function openEditVariant(serviceId: string, v: Variant) {
    setEditVar(v);
    setVarServiceId(serviceId);
    setVarForm({
      name: v.name,
      creditCost: v.creditCost,
      description: v.description,
      estimatedDays: v.estimatedDays,
      minPlan: v.minPlan || "",
      isPopular: v.isPopular,
      isNew: v.isNew,
      sortOrder: v.sortOrder,
    });
    setError("");
    setVarOpen(true);
  }

  async function saveVariant() {
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...varForm,
        creditCost: Number(varForm.creditCost),
        estimatedDays: Number(varForm.estimatedDays),
        sortOrder: Number(varForm.sortOrder),
        minPlan: varForm.minPlan || null,
      };

      const url = editVar
        ? `/api/admin/services/${varServiceId}/variants/${editVar.id}`
        : `/api/admin/services/${varServiceId}/variants`;

      const res = await fetch(url, {
        method: editVar ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error saving variant");
        return;
      }

      setVarOpen(false);
      router.refresh();
    } catch {
      setError("Connection error");
    } finally {
      setSaving(false);
    }
  }

  /* ── render ───────────────────────────────────────────────── */
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="font-[var(--font-lexend)] text-2xl font-bold text-[var(--ice-white)]">
          Catalogo de Servicios
        </h1>
        {isAdmin && (
          <Button className={goldBtn} onClick={openNewService}>
            <Plus className="mr-1 h-3.5 w-3.5" /> New service
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgba(245,246,252,0.3)]" />
        <input
          placeholder="Search service..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inp} pl-9`}
        />
      </div>

      {/* Categories */}
      {categories.map((cat: any) => {
        const catServices = filtered.filter((s: any) => s.category === cat);
        if (catServices.length === 0) return null;

        return (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-[var(--font-lexend)] text-lg font-semibold text-[var(--ice-white)]">
                {categoryLabels[cat]}
              </h2>
              <Badge className={categoryColors[cat]}>{catServices.length}</Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {catServices.map((service: any) => (
                <Card
                  key={service.id}
                  className={`${crd} ${!service.isActive ? "opacity-50" : ""}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)] text-base truncate">
                            {service.icon && <span className="mr-1">{service.icon}</span>}
                            {service.name}
                          </CardTitle>
                          {!service.isActive && (
                            <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-[9px] py-0">
                              Inactivo
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-[rgba(245,246,252,0.3)] font-mono mt-0.5">
                          /{service.slug}
                        </p>
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => toggleService(service.id)}
                            className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                              service.isActive
                                ? "border-green-500/30 text-green-400 hover:bg-green-500/10"
                                : "border-gray-500/30 text-gray-400 hover:bg-gray-500/10"
                            }`}
                          >
                            {service.isActive ? "Active" : "Inactive"}
                          </button>
                          <button
                            onClick={() => openEditService(service)}
                            className="p-1 rounded hover:bg-[rgba(255,255,255,0.05)] text-[rgba(245,246,252,0.4)] hover:text-[var(--ice-white)] transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-[rgba(245,246,252,0.5)] mt-1">
                      {service.description}
                    </p>
                    {service.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-1">
                        {service.tags.map((tag: any) => (
                          <span
                            key={tag}
                            className="text-[10px] bg-[rgba(255,255,255,0.05)] text-[rgba(245,246,252,0.4)] px-1.5 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-0 pt-0">
                    {/* Expand toggle */}
                    <button
                      onClick={() => toggleExpand(service.id)}
                      className="flex items-center gap-1 text-xs text-[rgba(245,246,252,0.4)] hover:text-[var(--ice-white)] transition-colors w-full py-1"
                    >
                      {expanded[service.id] ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                      {service.variants.length} variante{service.variants.length !== 1 && "s"}
                    </button>

                    {expanded[service.id] && (
                      <div className="space-y-2 mt-2">
                        {service.variants.map((v: any) => (
                          <div
                            key={v.id}
                            className={`flex items-start justify-between border-t border-[rgba(245,246,252,0.06)] pt-2 ${
                              !v.isActive ? "opacity-50" : ""
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-sm text-[var(--ice-white)]">{v.name}</p>
                                {!v.isActive && (
                                  <Badge className="text-[9px] bg-gray-500/20 text-gray-400 border-gray-500/30 py-0">
                                    Inactivo
                                  </Badge>
                                )}
                                {v.isPopular && (
                                  <Badge className="text-[9px] bg-[var(--gold-bar)]/20 text-[var(--gold-bar)] border-[var(--gold-bar)]/30 py-0">
                                    Popular
                                  </Badge>
                                )}
                                {v.isNew && (
                                  <Badge className="text-[9px] bg-green-500/20 text-green-400 border-green-500/30 py-0">
                                    Nuevo
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-[rgba(245,246,252,0.4)]">
                                {v.estimatedDays}d
                                {v.minPlan && ` · Min: ${v.minPlan}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-mono text-sm font-bold text-[var(--gold-bar)]">
                                {v.creditCost}cr
                              </span>
                              {isAdmin && (
                                <button
                                  onClick={() => openEditVariant(service.id, v)}
                                  className="p-1 rounded hover:bg-[rgba(255,255,255,0.05)] text-[rgba(245,246,252,0.4)] hover:text-[var(--ice-white)] transition-colors"
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}

                        {isAdmin && (
                          <button
                            onClick={() => openNewVariant(service.id)}
                            className="flex items-center gap-1 text-xs text-[var(--gold-bar)] hover:opacity-80 pt-1"
                          >
                            <Plus className="h-3 w-3" /> Nueva variante
                          </button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <p className="text-sm text-[rgba(245,246,252,0.4)] text-center py-12">
          No se encontraron servicios.
        </p>
      )}

      {/* ── Service Dialog ──────────────────────────────────────── */}
      <Dialog open={svcOpen} onOpenChange={setSvcOpen}>
        <DialogContent className={dlg + " max-w-lg max-h-[90vh] overflow-y-auto"}>
          <DialogHeader>
            <DialogTitle className="font-[var(--font-lexend)] text-[var(--ice-white)]">
              {editSvc ? "Edit service" : "New service"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
                {error}
              </p>
            )}

            <div>
              <label className={lbl}>Nombre</label>
              <input
                className={inp}
                value={svcForm.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setSvcForm((f) => ({
                    ...f,
                    name,
                    slug: editSvc ? f.slug : slugify(name),
                  }));
                }}
              />
            </div>

            <div>
              <label className={lbl}>Slug</label>
              <input
                className={inp}
                value={svcForm.slug}
                onChange={(e) => setSvcForm((f) => ({ ...f, slug: e.target.value }))}
              />
            </div>

            <div>
              <label className={lbl}>Categoria</label>
              <select
                className={sel}
                value={svcForm.category}
                onChange={(e) => setSvcForm((f) => ({ ...f, category: e.target.value }))}
              >
                <option value="DESIGN">Diseno</option>
                <option value="WEB">Web</option>
                <option value="MARKETING">Marketing</option>
              </select>
            </div>

            <div>
              <label className={lbl}>Descripcion</label>
              <textarea
                className={`${inp} min-h-[60px] resize-y`}
                value={svcForm.description}
                onChange={(e) => setSvcForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div>
              <label className={lbl}>Descripcion larga</label>
              <textarea
                className={`${inp} min-h-[60px] resize-y`}
                value={svcForm.longDescription}
                onChange={(e) => setSvcForm((f) => ({ ...f, longDescription: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Icon</label>
                <input
                  className={inp}
                  placeholder="emoji or class"
                  value={svcForm.icon}
                  onChange={(e) => setSvcForm((f) => ({ ...f, icon: e.target.value }))}
                />
              </div>
              <div>
                <label className={lbl}>Order</label>
                <input
                  type="number"
                  className={inp}
                  value={svcForm.sortOrder}
                  onChange={(e) => setSvcForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div>
              <label className={lbl}>Tags (comma separated)</label>
              <input
                className={inp}
                placeholder="logo, branding, identity"
                value={svcForm.tags}
                onChange={(e) => setSvcForm((f) => ({ ...f, tags: e.target.value }))}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSvcForm((f) => ({ ...f, isActive: !f.isActive }))}
                className={`relative h-5 w-9 rounded-full transition-colors ${
                  svcForm.isActive ? "bg-[var(--gold-bar)]" : "bg-[rgba(255,255,255,0.15)]"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                    svcForm.isActive ? "translate-x-4" : ""
                  }`}
                />
              </button>
              <span className="text-xs text-[var(--ice-white)]">Active</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="border-[rgba(245,246,252,0.2)] text-[var(--ice-white)] hover:bg-[rgba(255,255,255,0.05)] text-xs"
                onClick={() => setSvcOpen(false)}
              >
                Cancelar
              </Button>
              <Button className={goldBtn} size="sm" onClick={saveService} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Variant Dialog ──────────────────────────────────────── */}
      <Dialog open={varOpen} onOpenChange={setVarOpen}>
        <DialogContent className={dlg + " max-w-md max-h-[90vh] overflow-y-auto"}>
          <DialogHeader>
            <DialogTitle className="font-[var(--font-lexend)] text-[var(--ice-white)]">
              {editVar ? "Edit variant" : "New variant"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
                {error}
              </p>
            )}

            <div>
              <label className={lbl}>Nombre</label>
              <input
                className={inp}
                value={varForm.name}
                onChange={(e) => setVarForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Creditos</label>
                <input
                  type="number"
                  className={inp}
                  value={varForm.creditCost}
                  onChange={(e) => setVarForm((f) => ({ ...f, creditCost: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className={lbl}>Dias estimados</label>
                <input
                  type="number"
                  className={inp}
                  value={varForm.estimatedDays}
                  onChange={(e) => setVarForm((f) => ({ ...f, estimatedDays: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div>
              <label className={lbl}>Descripcion</label>
              <textarea
                className={`${inp} min-h-[60px] resize-y`}
                value={varForm.description}
                onChange={(e) => setVarForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Plan minimo</label>
                <select
                  className={sel}
                  value={varForm.minPlan}
                  onChange={(e) => setVarForm((f) => ({ ...f, minPlan: e.target.value }))}
                >
                  {planOptions.map((o: any) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={lbl}>Orden</label>
                <input
                  type="number"
                  className={inp}
                  value={varForm.sortOrder}
                  onChange={(e) => setVarForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVarForm((f) => ({ ...f, isPopular: !f.isPopular }))}
                  className={`relative h-5 w-9 rounded-full transition-colors ${
                    varForm.isPopular ? "bg-[var(--gold-bar)]" : "bg-[rgba(255,255,255,0.15)]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                      varForm.isPopular ? "translate-x-4" : ""
                    }`}
                  />
                </button>
                <span className="text-xs text-[var(--ice-white)]">Popular</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVarForm((f) => ({ ...f, isNew: !f.isNew }))}
                  className={`relative h-5 w-9 rounded-full transition-colors ${
                    varForm.isNew ? "bg-green-500" : "bg-[rgba(255,255,255,0.15)]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                      varForm.isNew ? "translate-x-4" : ""
                    }`}
                  />
                </button>
                <span className="text-xs text-[var(--ice-white)]">New</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="border-[rgba(245,246,252,0.2)] text-[var(--ice-white)] hover:bg-[rgba(255,255,255,0.05)] text-xs"
                onClick={() => setVarOpen(false)}
              >
                Cancelar
              </Button>
              <Button className={goldBtn} size="sm" onClick={saveVariant} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
