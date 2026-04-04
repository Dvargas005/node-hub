"use client";

import { useState, useMemo } from "react";
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
import { Plus, Pencil, Eye, EyeOff, Copy } from "lucide-react";
import { toast } from "sonner";
import {
  availabilityLabels,
  availabilityColors,
  freelancerRoleLabels,
  categoryLabels,
} from "@/lib/status-labels";

interface FreelancerRow {
  id: string;
  name: string;
  email: string;
  role: string;
  skills: string[];
  skillTags: string[];
  monthlySalary: number | null;
  currentLoad: number;
  clientCapacity: number;
  availability: string;
  pmName: string;
  phone?: string;
  telegramId?: string;
  bio?: string;
  portfolioUrl?: string;
  timezone?: string;
  tempPassword?: string | null;
}

const AVAILABILITY_OPTIONS = ["AVAILABLE", "BUSY", "ON_LEAVE", "INACTIVE"];
const SKILL_OPTIONS = ["DESIGN", "WEB", "MARKETING"];
const ROLE_OPTIONS = ["GRAPHIC_DESIGNER", "AI_DEVELOPER", "COMMUNITY_MANAGER"];

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  role: "GRAPHIC_DESIGNER",
  skills: [] as string[],
  skillTags: "",
  monthlySalary: "",
  clientCapacity: "",
  bio: "",
  portfolioUrl: "",
  timezone: "America/Caracas",
};

export function FreelancersClient({
  freelancers,
  showSalary,
  isAdmin,
}: {
  freelancers: FreelancerRow[];
  showSalary: boolean;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [filterRole, setFilterRole] = useState("");
  const [filterAvailability, setFilterAvailability] = useState("");

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ ...emptyForm });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Edit dialog
  const [editTarget, setEditTarget] = useState<FreelancerRow | null>(null);
  const [editForm, setEditForm] = useState({ ...emptyForm });
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState("");

  // Availability toggle
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return freelancers.filter((f: any) => {
      if (filterRole && f.role !== filterRole) return false;
      if (filterAvailability && f.availability !== filterAvailability)
        return false;
      return true;
    });
  }, [freelancers, filterRole, filterAvailability]);

  /* ---------- Create ---------- */
  const openCreate = () => {
    setCreateForm({ ...emptyForm });
    setCreateError("");
    setShowCreate(true);
  };

  const handleCreate = async () => {
    if (!createForm.name.trim() || !createForm.email.trim()) {
      setCreateError("Nombre y email son obligatorios");
      return;
    }
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch("/api/admin/freelancers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name.trim(),
          email: createForm.email.trim(),
          phone: createForm.phone.trim() || undefined,
          role: createForm.role,
          skills: createForm.skills,
          skillTags: createForm.skillTags
            .split(",")
            .map((t: any) => t.trim())
            .filter(Boolean),
          monthlySalary: createForm.monthlySalary
            ? Math.round(Number(createForm.monthlySalary) * 100)
            : undefined,
          clientCapacity: createForm.clientCapacity
            ? Number(createForm.clientCapacity)
            : undefined,
          bio: createForm.bio.trim() || undefined,
          portfolioUrl: createForm.portfolioUrl.trim() || undefined,
          timezone: createForm.timezone,
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        router.refresh();
      } else {
        const data = await res.json();
        setCreateError(data.error || "Error al crear freelancer");
      }
    } catch {
      setCreateError("Error de conexión");
    } finally {
      setCreating(false);
    }
  };

  /* ---------- Edit ---------- */
  const openEdit = (f: FreelancerRow) => {
    setEditTarget(f);
    setEditForm({
      name: f.name,
      email: f.email,
      phone: f.phone || "",
      role: f.role,
      skills: [...f.skills],
      skillTags: f.skillTags.join(", "),
      monthlySalary:
        f.monthlySalary != null ? String(f.monthlySalary / 100) : "",
      clientCapacity: String(f.clientCapacity),
      bio: f.bio || "",
      portfolioUrl: f.portfolioUrl || "",
      timezone: f.timezone || "America/Caracas",
    });
    setEditError("");
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    if (!editForm.name.trim() || !editForm.email.trim()) {
      setEditError("Nombre y email son obligatorios");
      return;
    }
    setEditing(true);
    setEditError("");
    try {
      const res = await fetch(`/api/admin/freelancers/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim(),
          email: editForm.email.trim(),
          phone: editForm.phone.trim() || undefined,
          role: editForm.role,
          skills: editForm.skills,
          skillTags: editForm.skillTags
            .split(",")
            .map((t: any) => t.trim())
            .filter(Boolean),
          monthlySalary: editForm.monthlySalary
            ? Math.round(Number(editForm.monthlySalary) * 100)
            : undefined,
          clientCapacity: editForm.clientCapacity
            ? Number(editForm.clientCapacity)
            : undefined,
          bio: editForm.bio.trim() || undefined,
          portfolioUrl: editForm.portfolioUrl.trim() || undefined,
          timezone: editForm.timezone,
        }),
      });
      if (res.ok) {
        setEditTarget(null);
        router.refresh();
      } else {
        const data = await res.json();
        setEditError(data.error || "Error al editar freelancer");
      }
    } catch {
      setEditError("Error de conexión");
    } finally {
      setEditing(false);
    }
  };

  /* ---------- Availability toggle ---------- */
  const cycleAvailability = async (f: FreelancerRow) => {
    const idx = AVAILABILITY_OPTIONS.indexOf(f.availability);
    const next = AVAILABILITY_OPTIONS[(idx + 1) % AVAILABILITY_OPTIONS.length];
    setTogglingId(f.id);
    try {
      const res = await fetch(`/api/admin/freelancers/${f.id}/availability`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability: next }),
      });
      if (res.ok) router.refresh();
    } finally {
      setTogglingId(null);
    }
  };

  /* ---------- Shared form fields renderer ---------- */
  const renderFormFields = (
    form: typeof emptyForm,
    setForm: (v: typeof emptyForm) => void,
    showSalaryField: boolean
  ) => (
    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
      {/* Name */}
      <div>
        <label className="text-xs text-[rgba(245,246,252,0.5)] mb-1 block">
          Nombre *
        </label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full h-9 rounded-md border border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] px-3 text-sm outline-none focus:border-[var(--gold-bar)]"
          placeholder="Nombre completo"
        />
      </div>
      {/* Email */}
      <div>
        <label className="text-xs text-[rgba(245,246,252,0.5)] mb-1 block">
          Email *
        </label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full h-9 rounded-md border border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] px-3 text-sm outline-none focus:border-[var(--gold-bar)]"
          placeholder="email@ejemplo.com"
        />
      </div>
      {/* Phone */}
      <div>
        <label className="text-xs text-[rgba(245,246,252,0.5)] mb-1 block">
          Teléfono
        </label>
        <input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full h-9 rounded-md border border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] px-3 text-sm outline-none focus:border-[var(--gold-bar)]"
          placeholder="+58 412 000 0000"
        />
      </div>
      {/* Role */}
      <div>
        <label className="text-xs text-[rgba(245,246,252,0.5)] mb-1 block">
          Rol
        </label>
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="w-full h-9 rounded-md border border-[rgba(245,246,252,0.2)] bg-[#1a1108] px-3 text-sm text-[var(--ice-white)] [&_option]:bg-[#1a1108] [&_option]:text-[var(--ice-white)]"
        >
          {ROLE_OPTIONS.map((r: any) => (
            <option key={r} value={r}>
              {freelancerRoleLabels[r] || r}
            </option>
          ))}
        </select>
      </div>
      {/* Skills (multi-checkbox) */}
      <div>
        <label className="text-xs text-[rgba(245,246,252,0.5)] mb-1 block">
          Skills
        </label>
        <div className="flex gap-4">
          {SKILL_OPTIONS.map((s: any) => (
            <label
              key={s}
              className="flex items-center gap-1.5 text-sm text-[var(--ice-white)] cursor-pointer"
            >
              <input
                type="checkbox"
                checked={form.skills.includes(s)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...form.skills, s]
                    : form.skills.filter((x: any) => x !== s);
                  setForm({ ...form, skills: next });
                }}
                className="accent-[var(--gold-bar)]"
              />
              {categoryLabels[s] || s}
            </label>
          ))}
        </div>
      </div>
      {/* Skill Tags */}
      <div>
        <label className="text-xs text-[rgba(245,246,252,0.5)] mb-1 block">
          Skill Tags (separados por coma)
        </label>
        <input
          value={form.skillTags}
          onChange={(e) => setForm({ ...form, skillTags: e.target.value })}
          className="w-full h-9 rounded-md border border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] px-3 text-sm outline-none focus:border-[var(--gold-bar)]"
          placeholder="figma, illustrator, react"
        />
      </div>
      {/* Salary */}
      {showSalaryField && (
        <div>
          <label className="text-xs text-[rgba(245,246,252,0.5)] mb-1 block">
            Salario mensual (USD)
          </label>
          <input
            type="number"
            value={form.monthlySalary}
            onChange={(e) =>
              setForm({ ...form, monthlySalary: e.target.value })
            }
            className="w-full h-9 rounded-md border border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] px-3 text-sm outline-none focus:border-[var(--gold-bar)]"
            placeholder="500"
          />
        </div>
      )}
      {/* Client Capacity */}
      <div>
        <label className="text-xs text-[rgba(245,246,252,0.5)] mb-1 block">
          Capacidad de clientes
        </label>
        <input
          type="number"
          value={form.clientCapacity}
          onChange={(e) =>
            setForm({ ...form, clientCapacity: e.target.value })
          }
          className="w-full h-9 rounded-md border border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] px-3 text-sm outline-none focus:border-[var(--gold-bar)]"
          placeholder="5"
        />
      </div>
      {/* Bio */}
      <div>
        <label className="text-xs text-[rgba(245,246,252,0.5)] mb-1 block">
          Bio
        </label>
        <textarea
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          rows={3}
          className="w-full rounded-md border border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] px-3 py-2 text-sm outline-none focus:border-[var(--gold-bar)] resize-none"
          placeholder="Breve descripción..."
        />
      </div>
      {/* Portfolio URL */}
      <div>
        <label className="text-xs text-[rgba(245,246,252,0.5)] mb-1 block">
          Portfolio URL
        </label>
        <input
          value={form.portfolioUrl}
          onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })}
          className="w-full h-9 rounded-md border border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] px-3 text-sm outline-none focus:border-[var(--gold-bar)]"
          placeholder="https://portfolio.com"
        />
      </div>
      {/* Timezone */}
      <div>
        <label className="text-xs text-[rgba(245,246,252,0.5)] mb-1 block">
          Timezone
        </label>
        <input
          value={form.timezone}
          onChange={(e) => setForm({ ...form, timezone: e.target.value })}
          className="w-full h-9 rounded-md border border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] px-3 text-sm outline-none focus:border-[var(--gold-bar)]"
          placeholder="America/Caracas"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-[var(--font-lexend)] text-2xl font-bold text-[var(--ice-white)]">
          Freelancers
        </h1>
        {isAdmin && (
          <Button
            onClick={openCreate}
            className="bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Crear freelancer
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="h-9 rounded-md border border-[rgba(245,246,252,0.2)] bg-[#1a1108] px-3 text-sm text-[var(--ice-white)] [&_option]:bg-[#1a1108] [&_option]:text-[var(--ice-white)]"
            >
              <option value="">Todos los roles</option>
              <option value="GRAPHIC_DESIGNER">Diseñador</option>
              <option value="AI_DEVELOPER">Desarrollador IA</option>
              <option value="COMMUNITY_MANAGER">Community Manager</option>
            </select>
            <select
              value={filterAvailability}
              onChange={(e) => setFilterAvailability(e.target.value)}
              className="h-9 rounded-md border border-[rgba(245,246,252,0.2)] bg-[#1a1108] px-3 text-sm text-[var(--ice-white)] [&_option]:bg-[#1a1108] [&_option]:text-[var(--ice-white)]"
            >
              <option value="">Toda disponibilidad</option>
              <option value="AVAILABLE">Disponible</option>
              <option value="BUSY">Ocupado</option>
              <option value="ON_LEAVE">Ausente</option>
              <option value="INACTIVE">Inactivo</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
        <CardHeader>
          <CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)] text-base">
            {filtered.length} freelancers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[rgba(245,246,252,0.1)] hover:bg-transparent">
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Nombre</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Email</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Rol</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Skills</TableHead>
                  {showSalary && <TableHead className="text-[rgba(245,246,252,0.5)]">Salario</TableHead>}
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Carga</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Disponibilidad</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">PM</TableHead>
                  {isAdmin && <TableHead className="text-[rgba(245,246,252,0.5)]">Credenciales</TableHead>}
                  {isAdmin && <TableHead className="text-[rgba(245,246,252,0.5)]">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={isAdmin ? (showSalary ? 9 : 8) : (showSalary ? 8 : 7)}
                      className="text-center text-[rgba(245,246,252,0.4)] py-8"
                    >
                      No hay freelancers
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((f: any) => (
                  <TableRow
                    key={f.id}
                    className="border-[rgba(245,246,252,0.06)] hover:bg-[rgba(255,255,255,0.03)]"
                  >
                    <TableCell className="text-[var(--ice-white)] font-medium">
                      {f.name}
                    </TableCell>
                    <TableCell className="text-sm text-[rgba(245,246,252,0.6)]">
                      {f.email}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-[rgba(255,255,255,0.05)] text-[rgba(245,246,252,0.7)] border-[rgba(245,246,252,0.1)]">
                        {freelancerRoleLabels[f.role] || f.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {f.skills.map((s: any) => (
                          <Badge
                            key={s}
                            className="text-[10px] bg-[rgba(255,255,255,0.05)] text-[rgba(245,246,252,0.5)] border-[rgba(245,246,252,0.1)]"
                          >
                            {categoryLabels[s] || s}
                          </Badge>
                        ))}
                        {f.skillTags.map((t: any) => (
                          <span
                            key={t}
                            className="text-[10px] bg-[rgba(255,255,255,0.03)] text-[rgba(245,246,252,0.4)] px-1.5 py-0.5 rounded"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    {showSalary && (
                      <TableCell className="text-sm text-[rgba(245,246,252,0.6)]">
                        ${((f.monthlySalary ?? 0) / 100).toLocaleString()}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="w-20">
                        <div className="flex justify-between text-xs text-[rgba(245,246,252,0.4)] mb-1">
                          <span>
                            {f.currentLoad}/{f.clientCapacity}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.1)]">
                          <div
                            className="h-full rounded-full bg-[var(--gold-bar)]"
                            style={{
                              width: `${Math.min(
                                (f.clientCapacity > 0 ? (f.currentLoad / f.clientCapacity) * 100 : 0),
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => cycleAvailability(f)}
                        disabled={togglingId === f.id}
                        className="cursor-pointer disabled:opacity-50"
                      >
                        <Badge
                          className={availabilityColors[f.availability] || ""}
                        >
                          {togglingId === f.id
                            ? "..."
                            : availabilityLabels[f.availability] || f.availability}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell className="text-sm text-[rgba(245,246,252,0.6)]">
                      {f.pmName}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <PasswordReveal password={f.tempPassword ?? null} />
                      </TableCell>
                    )}
                    {isAdmin && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(f)}
                          className="h-7 gap-1 text-xs text-[var(--gold-bar)] hover:text-[var(--gold-bar)] hover:bg-[rgba(255,201,25,0.1)]"
                        >
                          <Pencil className="h-3 w-3" />
                          Editar
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
              Crear Freelancer
            </DialogTitle>
            <DialogDescription className="text-[rgba(245,246,252,0.5)]">
              Completa los campos para registrar un nuevo freelancer.
            </DialogDescription>
          </DialogHeader>

          {renderFormFields(createForm, setCreateForm, isAdmin)}

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
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold"
            >
              {creating ? "Creando..." : "Crear"}
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
              Editar Freelancer
            </DialogTitle>
            <DialogDescription className="text-[rgba(245,246,252,0.5)]">
              Modifica los campos del freelancer.
            </DialogDescription>
          </DialogHeader>

          {renderFormFields(editForm, setEditForm, isAdmin)}

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
              Cancelar
            </Button>
            <Button
              onClick={handleEdit}
              disabled={editing}
              className="bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold"
            >
              {editing ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PasswordReveal({ password }: { password: string | null }) {
  const [visible, setVisible] = useState(false);
  if (!password) return <span className="text-[rgba(245,246,252,0.3)] text-xs">Activo</span>;
  return (
    <div className="flex items-center gap-1.5">
      <code className="text-xs text-[rgba(245,246,252,0.6)]">{visible ? password : "••••••••••••"}</code>
      <button onClick={() => setVisible(!visible)} className="text-[rgba(245,246,252,0.4)] hover:text-[var(--ice-white)]">
        {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
      <button onClick={() => { navigator.clipboard.writeText(password); toast.success("Copiado"); }} className="text-[rgba(245,246,252,0.4)] hover:text-[var(--ice-white)]">
        <Copy className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
