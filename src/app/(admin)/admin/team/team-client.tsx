"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
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
import { Plus, Calendar } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  timezone: string | null;
  calendlyUrl: string | null;
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
  const { t } = useTranslation();
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

  const [editingCalendly, setEditingCalendly] = useState<TeamMember | null>(null);
  const [calendlyDraft, setCalendlyDraft] = useState("");
  const [savingCalendly, setSavingCalendly] = useState(false);

  const openCalendlyEdit = (member: TeamMember) => {
    setEditingCalendly(member);
    setCalendlyDraft(member.calendlyUrl || "");
  };

  const handleSaveCalendly = async () => {
    if (!editingCalendly) return;
    const value = calendlyDraft.trim();
    if (value && !value.startsWith("https://calendly.com/")) {
      toast.error("URL must start with https://calendly.com/");
      return;
    }
    setSavingCalendly(true);
    try {
      const res = await fetch(`/api/admin/team/${editingCalendly.id}/calendly`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendlyUrl: value || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to save");
        return;
      }
      toast.success(t("calendly.saved"));
      setEditingCalendly(null);
      router.refresh();
    } catch {
      toast.error("Connection error");
    } finally {
      setSavingCalendly(false);
    }
  };

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
        setCreateError(data.error || "Error creating PM");
        return;
      }
      setTempPassword(data.tempPassword);
      router.refresh();
    } catch (err: any) {
      setCreateError("Connection error");
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
          Team
        </h1>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold"
        >
          <Plus className="mr-2 h-4 w-4" /> New PM
        </Button>
      </div>

      {/* Team Table */}
      <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
        <CardHeader>
          <CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)] text-base">
            {team.length} members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[rgba(245,246,252,0.1)] hover:bg-transparent">
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Name</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Email</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Role</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Calendly</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Assigned clients</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Supervised freelancers</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-[rgba(245,246,252,0.4)] py-8"
                    >
                      No team members
                    </TableCell>
                  </TableRow>
                )}
                {team.map((m: TeamMember) => (
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
                    <TableCell className="text-sm">
                      <button
                        type="button"
                        onClick={() => openCalendlyEdit(m)}
                        className="flex items-center gap-1.5 text-[rgba(245,246,252,0.6)] hover:text-[var(--gold-bar)] transition-colors"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        {m.calendlyUrl ? (
                          <span className="truncate max-w-[180px]">{m.calendlyUrl.replace("https://calendly.com/", "")}</span>
                        ) : (
                          <span className="text-[rgba(245,246,252,0.3)] italic">Not set</span>
                        )}
                      </button>
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

      {/* Edit Calendly Dialog */}
      <Dialog open={!!editingCalendly} onOpenChange={(open) => { if (!open) setEditingCalendly(null); }}>
        <DialogContent className="border-[rgba(245,246,252,0.1)] bg-[var(--asphalt-black)] text-[var(--ice-white)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--ice-white)]">
              {editingCalendly?.name} — Calendly URL
            </DialogTitle>
            <DialogDescription className="text-[rgba(245,246,252,0.5)]">
              Clients with this PM assigned will be able to book meetings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={calendlyDraft}
              onChange={(e) => setCalendlyDraft(e.target.value)}
              placeholder="https://calendly.com/your-name/30min"
              className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)]"
            />
            <p className="text-xs text-[rgba(245,246,252,0.4)]">
              Must start with <code className="text-[var(--gold-bar)]">https://calendly.com/</code>. Leave empty to remove.
            </p>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setEditingCalendly(null)}
                className="flex-1 border-[rgba(245,246,252,0.2)] text-[var(--ice-white)]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveCalendly}
                disabled={savingCalendly}
                className="flex-1 bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold"
              >
                {savingCalendly ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create PM Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => { if (!open) resetDialog(); }}>
        <DialogContent className="border-[rgba(245,246,252,0.1)] bg-[var(--asphalt-black)] text-[var(--ice-white)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--ice-white)]">Create new PM</DialogTitle>
            <DialogDescription className="text-[rgba(245,246,252,0.5)]">
              An account will be created with a temporary password.
            </DialogDescription>
          </DialogHeader>

          {tempPassword ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-[var(--gold-bar)]/30 bg-[var(--gold-bar)]/10 p-4">
                <p className="text-sm font-bold text-[var(--gold-bar)] mb-2">
                  Temporary password:
                </p>
                <p className="font-mono text-lg text-[var(--ice-white)] select-all break-all">
                  {tempPassword}
                </p>
                <p className="text-xs text-[rgba(245,246,252,0.5)] mt-2">
                  Share this with the new PM. It cannot be recovered.
                </p>
              </div>
              <Button
                onClick={resetDialog}
                className="w-full bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold"
              >
                Close
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-[rgba(245,246,252,0.6)] mb-1 block">
                  Name *
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Full name"
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
                  placeholder="email@example.com"
                  type="email"
                  className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)]"
                />
              </div>
              <div>
                <label className="text-sm text-[rgba(245,246,252,0.6)] mb-1 block">
                  Phone (optional)
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
                  Timezone
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
                {creating ? "Creating..." : "Create PM"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
