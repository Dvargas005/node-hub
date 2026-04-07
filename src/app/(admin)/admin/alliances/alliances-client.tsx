"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface AllianceRow {
  id: string;
  name: string;
  slug: string;
  code: string;
  discountPercent: number;
  bonusCredits: number;
  revenueShare: number;
  referredCount: number;
  isActive: boolean;
  contactName: string | null;
  contactEmail: string | null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const emptyForm = {
  name: "",
  slug: "",
  code: "",
  contactName: "",
  contactEmail: "",
  discountPercent: "",
  bonusCredits: "",
  revenueShare: "",
};

export function AlliancesClient({
  alliances,
  isAdmin,
}: {
  alliances: AllianceRow[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const { t } = useTranslation();

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ ...emptyForm });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Edit dialog
  const [editTarget, setEditTarget] = useState<AllianceRow | null>(null);
  const [editForm, setEditForm] = useState({ ...emptyForm });
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState("");

  // Toggle
  const [togglingId, setTogglingId] = useState<string | null>(null);

  /* ---------- Create ---------- */
  const openCreate = () => {
    setCreateForm({ ...emptyForm });
    setCreateError("");
    setShowCreate(true);
  };

  const updateCreateName = (name: string) => {
    setCreateForm((prev: any) => ({
      ...prev,
      name,
      slug: slugify(name),
    }));
  };

  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      setCreateError(t("admin.alliances.requiredName"));
      return;
    }
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch("/api/admin/alliances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name.trim(),
          slug: createForm.slug || slugify(createForm.name),
          code: createForm.code.toUpperCase().trim(),
          contactName: createForm.contactName.trim() || undefined,
          contactEmail: createForm.contactEmail.trim() || undefined,
          discountPercent: createForm.discountPercent
            ? Number(createForm.discountPercent)
            : 0,
          bonusCredits: createForm.bonusCredits
            ? Number(createForm.bonusCredits)
            : 0,
          revenueShare: createForm.revenueShare
            ? Number(createForm.revenueShare)
            : 0,
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        router.refresh();
      } else {
        const data = await res.json();
        setCreateError(data.error || t("admin.alliances.errorCreating"));
      }
    } catch {
      setCreateError(t("common.connectionError"));
    } finally {
      setCreating(false);
    }
  };

  /* ---------- Edit ---------- */
  const openEdit = (a: AllianceRow) => {
    setEditTarget(a);
    setEditForm({
      name: a.name,
      slug: a.slug,
      code: a.code,
      contactName: a.contactName || "",
      contactEmail: a.contactEmail || "",
      discountPercent: String(a.discountPercent),
      bonusCredits: String(a.bonusCredits),
      revenueShare: String(a.revenueShare),
    });
    setEditError("");
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    if (!editForm.name.trim()) {
      setEditError(t("admin.alliances.requiredName"));
      return;
    }
    setEditing(true);
    setEditError("");
    try {
      const res = await fetch(`/api/admin/alliances/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim(),
          slug: editForm.slug || slugify(editForm.name),
          code: editForm.code.toUpperCase().trim(),
          contactName: editForm.contactName.trim() || undefined,
          contactEmail: editForm.contactEmail.trim() || undefined,
          discountPercent: editForm.discountPercent
            ? Number(editForm.discountPercent)
            : 0,
          bonusCredits: editForm.bonusCredits
            ? Number(editForm.bonusCredits)
            : 0,
          revenueShare: editForm.revenueShare
            ? Number(editForm.revenueShare)
            : 0,
        }),
      });
      if (res.ok) {
        setEditTarget(null);
        router.refresh();
      } else {
        const data = await res.json();
        setEditError(data.error || t("admin.alliances.errorEditing"));
      }
    } catch {
      setEditError(t("common.connectionError"));
    } finally {
      setEditing(false);
    }
  };

  /* ---------- Toggle active ---------- */
  const handleToggle = async (a: AllianceRow) => {
    setTogglingId(a.id);
    try {
      const res = await fetch(`/api/admin/alliances/${a.id}/toggle`, {
        method: "PATCH",
      });
      if (res.ok) router.refresh();
    } finally {
      setTogglingId(null);
    }
  };

  /* ---------- Shared form fields ---------- */
  const renderFormFields = (
    form: typeof emptyForm,
    setForm: (v: typeof emptyForm) => void,
    autoSlug: boolean
  ) => (
    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
      {/* Name */}
      <div>
        <label className="text-xs text-[rgba(245,246,252,0.5)] mb-1 block">
          Nombre *
        </label>
        <input
          value={form.name}
          onChange={(e) => {
            if (autoSlug) {
              setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) });
            } else {
              setForm({ ...form, name: e.target.value });
            }
          }}
          className="w-full h-9 rounded-md border border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] px-3 text-sm outline-none focus:border-[var(--gold-bar)]"
          placeholder="Alliance name"
        />
      </div>
      {/* Slug */}
      <div>
        <label className="text-xs text-[rgba(245,246,252,0.5)] mb-1 block">
          Slug
        </label>
        <input
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
          className="w-full h-9 rounded-md border border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] px-3 text-sm outline-none focus:border-[var(--gold-bar)]"
          placeholder="auto-generado"
        />
      </div>
      {/* Code */}
      <div>
        <label className="text-xs text-[rgba(245,246,252,0.5)] mb-1 block">
          Code (uppercase)
        </label>
        <input
          value={form.code}
          onChange={(e) =>
            setForm({ ...form, code: e.target.value.toUpperCase() })
          }
          className="w-full h-9 rounded-md border border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] px-3 text-sm outline-none focus:border-[var(--gold-bar)] uppercase"
          placeholder="ALLIANCE2024"
        />
      </div>
      {/* Contact Name */}
      <div>
        <label className="text-xs text-[rgba(245,246,252,0.5)] mb-1 block">
          Contact name
        </label>
        <input
          value={form.contactName}
          onChange={(e) => setForm({ ...form, contactName: e.target.value })}
          className="w-full h-9 rounded-md border border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] px-3 text-sm outline-none focus:border-[var(--gold-bar)]"
          placeholder="Contact name"
        />
      </div>
      {/* Contact Email */}
      <div>
        <label className="text-xs text-[rgba(245,246,252,0.5)] mb-1 block">
          Email de contacto
        </label>
        <input
          type="email"
          value={form.contactEmail}
          onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
          className="w-full h-9 rounded-md border border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] px-3 text-sm outline-none focus:border-[var(--gold-bar)]"
          placeholder="contacto@alianza.com"
        />
      </div>
      {/* Discount */}
      <div>
        <label className="text-xs text-[rgba(245,246,252,0.5)] mb-1 block">
          Descuento (%)
        </label>
        <input
          type="number"
          value={form.discountPercent}
          onChange={(e) =>
            setForm({ ...form, discountPercent: e.target.value })
          }
          className="w-full h-9 rounded-md border border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] px-3 text-sm outline-none focus:border-[var(--gold-bar)]"
          placeholder="10"
        />
      </div>
      {/* Bonus Credits */}
      <div>
        <label className="text-xs text-[rgba(245,246,252,0.5)] mb-1 block">
          Bonus credits
        </label>
        <input
          type="number"
          value={form.bonusCredits}
          onChange={(e) =>
            setForm({ ...form, bonusCredits: e.target.value })
          }
          className="w-full h-9 rounded-md border border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] px-3 text-sm outline-none focus:border-[var(--gold-bar)]"
          placeholder="0"
        />
      </div>
      {/* Revenue Share */}
      <div>
        <label className="text-xs text-[rgba(245,246,252,0.5)] mb-1 block">
          Revenue share
        </label>
        <input
          type="number"
          value={form.revenueShare}
          onChange={(e) =>
            setForm({ ...form, revenueShare: e.target.value })
          }
          className="w-full h-9 rounded-md border border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] px-3 text-sm outline-none focus:border-[var(--gold-bar)]"
          placeholder="0"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-[var(--font-lexend)] text-2xl font-bold text-[var(--ice-white)]">
          Alianzas
        </h1>
        {isAdmin && (
          <Button
            onClick={openCreate}
            className="bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Crear alianza
          </Button>
        )}
      </div>

      <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
        <CardHeader>
          <CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)] text-base">
            {alliances.length} alianzas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[rgba(245,246,252,0.1)] hover:bg-transparent">
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Nombre</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Código</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Descuento</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Bonus credits</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Revenue share</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Referidos</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Estado</TableHead>
                  {isAdmin && <TableHead className="text-[rgba(245,246,252,0.5)]">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {alliances.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={isAdmin ? 8 : 7}
                      className="text-center text-[rgba(245,246,252,0.4)] py-8"
                    >
                      No hay alianzas
                    </TableCell>
                  </TableRow>
                )}
                {alliances.map((a: any) => (
                  <TableRow
                    key={a.id}
                    className="border-[rgba(245,246,252,0.06)] hover:bg-[rgba(255,255,255,0.03)]"
                  >
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-[var(--ice-white)]">
                          {a.name}
                        </p>
                        {a.contactName && (
                          <p className="text-xs text-[rgba(245,246,252,0.4)]">
                            {a.contactName}
                            {a.contactEmail && ` · ${a.contactEmail}`}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-[var(--gold-bar)]">
                      {a.code}
                    </TableCell>
                    <TableCell className="text-sm text-[var(--ice-white)]">
                      {a.discountPercent}%
                    </TableCell>
                    <TableCell className="text-sm text-[var(--ice-white)]">
                      {a.bonusCredits}
                    </TableCell>
                    <TableCell className="text-sm text-[var(--ice-white)]">
                      ${a.revenueShare}
                    </TableCell>
                    <TableCell className="text-sm text-[var(--ice-white)]">
                      {a.referredCount}
                    </TableCell>
                    <TableCell>
                      {isAdmin ? (
                        <button
                          onClick={() => handleToggle(a)}
                          disabled={togglingId === a.id}
                          className="cursor-pointer disabled:opacity-50"
                        >
                          {a.isActive ? (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              {togglingId === a.id ? "..." : t("admin.alliances.active")}
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
                              {togglingId === a.id ? "..." : t("admin.alliances.inactive")}
                            </Badge>
                          )}
                        </button>
                      ) : a.isActive ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          {t("admin.alliances.active")}
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
                          {t("admin.alliances.inactive")}
                        </Badge>
                      )}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(a)}
                          className="h-7 gap-1 text-xs text-[var(--gold-bar)] hover:text-[var(--gold-bar)] hover:bg-[rgba(255,201,25,0.1)]"
                        >
                          <Pencil className="h-3 w-3" />
                          {t("common.edit")}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => !open && setShowCreate(false)}>
        <DialogContent className="border-[rgba(245,246,252,0.1)] bg-[var(--asphalt-black)] text-[var(--ice-white)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-[var(--font-lexend)]">
              Create Alliance
            </DialogTitle>
            <DialogDescription className="text-[rgba(245,246,252,0.5)]">
              Fill the fields to register a new alliance.
            </DialogDescription>
          </DialogHeader>

          {renderFormFields(createForm, setCreateForm, true)}

          {createError && (
            <div className="text-sm text-red-400 text-center bg-red-500/10 border border-red-500/20 rounded-md p-2">
              {createError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => setShowCreate(false)}
              className="text-[rgba(245,246,252,0.6)] hover:text-[var(--ice-white)]"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold"
            >
              {creating ? t("common.creating") : t("common.create")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
      >
        <DialogContent className="border-[rgba(245,246,252,0.1)] bg-[var(--asphalt-black)] text-[var(--ice-white)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-[var(--font-lexend)]">
              Edit Alliance
            </DialogTitle>
            <DialogDescription className="text-[rgba(245,246,252,0.5)]">
              Edit alliance details.
            </DialogDescription>
          </DialogHeader>

          {renderFormFields(editForm, setEditForm, false)}

          {editError && (
            <div className="text-sm text-red-400 text-center bg-red-500/10 border border-red-500/20 rounded-md p-2">
              {editError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => setEditTarget(null)}
              className="text-[rgba(245,246,252,0.6)] hover:text-[var(--ice-white)]"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleEdit}
              disabled={editing}
              className="bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold"
            >
              {editing ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
