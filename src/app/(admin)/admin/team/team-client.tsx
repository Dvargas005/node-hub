"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  timezone: string | null;
  createdAt: string;
  clientCount: number;
  freelancerCount: number;
}

const roleBadge: Record<string, string> = {
  ADMIN: "bg-[var(--gold-bar)]/20 text-[var(--gold-bar)] border-[var(--gold-bar)]/30",
  PM: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

export function TeamClient({ team }: { team: TeamMember[] }) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [createError, setCreateError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    timezone: "America/Chicago",
  });

  const handleCreate = async () => {
    try {
      setCreating(true);
      setCreateError("");
      const res = await fetch("/api/admin/team/create-pm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          timezone: form.timezone || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || "Error al crear PM");
        return;
      }
      setTempPassword(data.tempPassword);
      router.refresh();
    } catch (err: any) {
      setCreateError("Error de conexión");
    } finally {
      setCreating(false);
    }
  };

  const resetDialog = () => {
    setShowCreate(false);
    setTempPassword(null);
    setCreateError("");
    setForm({ name: "", email: "", phone: "", timezone: "America/Chicago" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-[var(--font-lexend)] text-2xl font-bold text-[var(--ice-white)]">
          Equipo
        </h1>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold"
        >
          <Plus className="mr-2 h-4 w-4" /> Nuevo PM
        </Button>
      </div>

      {/* Team Table */}
      <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
        <CardHeader>
          <CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)] text-base">
            {team.length} miembros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[rgba(245,246,252,0.1)] hover:bg-transparent">
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Nombre</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Email</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Role</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Clientes asignados</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Freelancers supervisados</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Fecha registro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-[rgba(245,246,252,0.4)] py-8"
                    >
                      No hay miembros del equipo
                    </TableCell>
                  </TableRow>
                )}
                {team.map((m: any) => (
                  <TableRow
                    key={m.id}
                    className="border-[rgba(245,246,252,0.06)] hover:bg-[rgba(255,255,255,0.03)]"
                  >
                    <TableCell className="text-[var(--ice-white)] font-medium">
                      {m.name}
                    </TableCell>
                    <TableCell className="text-sm text-[rgba(245,246,252,0.6)]">
                      {m.email}
                    </TableCell>
                    <TableCell>
                      <Badge className={roleBadge[m.role] || ""}>
                        {m.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-[var(--ice-white)]">
                      {m.clientCount}
                    </TableCell>
                    <TableCell className="text-sm text-[var(--ice-white)]">
                      {m.freelancerCount}
                    </TableCell>
                    <TableCell className="text-sm text-[rgba(245,246,252,0.5)]">
                      {new Date(m.createdAt).toLocaleDateString("es-MX")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create PM Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => { if (!open) resetDialog(); }}>
        <DialogContent className="border-[rgba(245,246,252,0.1)] bg-[var(--asphalt-black)] text-[var(--ice-white)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--ice-white)]">Crear nuevo PM</DialogTitle>
            <DialogDescription className="text-[rgba(245,246,252,0.5)]">
              Se creará una cuenta con contraseña temporal.
            </DialogDescription>
          </DialogHeader>

          {tempPassword ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-[var(--gold-bar)]/30 bg-[var(--gold-bar)]/10 p-4">
                <p className="text-sm font-bold text-[var(--gold-bar)] mb-2">
                  Password temporal:
                </p>
                <p className="font-mono text-lg text-[var(--ice-white)] select-all break-all">
                  {tempPassword}
                </p>
                <p className="text-xs text-[rgba(245,246,252,0.5)] mt-2">
                  Comparte esto con el nuevo PM. No se puede recuperar.
                </p>
              </div>
              <Button
                onClick={resetDialog}
                className="w-full bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold"
              >
                Cerrar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-[rgba(245,246,252,0.6)] mb-1 block">
                  Nombre *
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nombre completo"
                  className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)]"
                />
              </div>
              <div>
                <label className="text-sm text-[rgba(245,246,252,0.6)] mb-1 block">
                  Email *
                </label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@ejemplo.com"
                  type="email"
                  className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)]"
                />
              </div>
              <div>
                <label className="text-sm text-[rgba(245,246,252,0.6)] mb-1 block">
                  Teléfono (opcional)
                </label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+52 ..."
                  className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)]"
                />
              </div>
              <div>
                <label className="text-sm text-[rgba(245,246,252,0.6)] mb-1 block">
                  Zona horaria
                </label>
                <select
                  value={form.timezone}
                  onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                  className="w-full h-9 rounded-md border border-[rgba(245,246,252,0.2)] bg-[#1a1108] px-3 text-sm text-[var(--ice-white)] [&_option]:bg-[#1a1108] [&_option]:text-[var(--ice-white)]"
                >
                  <option value="America/Chicago">America/Chicago (CST)</option>
                  <option value="America/Mexico_City">America/Mexico_City (CST)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                  <option value="America/Bogota">America/Bogota (COT)</option>
                  <option value="America/Argentina/Buenos_Aires">America/Buenos_Aires (ART)</option>
                  <option value="Europe/Madrid">Europe/Madrid (CET)</option>
                </select>
              </div>

              {createError && (
                <p className="text-sm text-red-400">{createError}</p>
              )}

              <Button
                onClick={handleCreate}
                disabled={creating || !form.name || !form.email}
                className="w-full bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold disabled:opacity-50"
              >
                {creating ? "Creando..." : "Crear PM"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
