"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import { getLocale } from "@/lib/i18n";
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
import { UserPlus, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import {
  ticketStatusLabels,
  ticketStatusColors,
  priorityLabels,
  priorityColors,
  freelancerRoleLabels,
  categoryLabels,
} from "@/lib/status-labels";

interface AddedService {
  id: string;
  variants: { id: string; creditCost: number }[];
}

function AddServiceForm({
  t,
  selectClass,
  onSave,
  onCancel,
}: {
  t: (key: string) => string;
  selectClass: string;
  onSave: (service: AddedService) => void;
  onCancel: () => void;
}) {
  const [category, setCategory] = useState("DESIGN");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [variantName, setVariantName] = useState("");
  const [creditCost, setCreditCost] = useState(75);
  const [estimatedDays, setEstimatedDays] = useState(5);
  const [saving, setSaving] = useState(false);

  const inputClass =
    "w-full rounded-md border border-[rgba(245,246,252,0.2)] bg-[#1a1108] px-3 py-2 text-sm text-[var(--ice-white)] outline-none";

  async function handleSave() {
    if (!name.trim() || !variantName.trim() || creditCost < 1) return;
    setSaving(true);
    try {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const svcRes = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug,
          category,
          description: description.trim() || name.trim(),
          icon: "box",
          isActive: true,
        }),
      });
      const svc = await svcRes.json();
      if (!svcRes.ok) throw new Error(svc.error || "Error creating service");

      const varRes = await fetch(`/api/admin/services/${svc.id}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: variantName.trim(),
          creditCost,
          description: variantName.trim(),
          estimatedDays,
          isActive: true,
          sortOrder: 1,
        }),
      });
      const variant = await varRes.json();
      if (!varRes.ok) throw new Error(variant.error || "Error creating variant");

      onSave({ id: svc.id, variants: [{ id: variant.id, creditCost: variant.creditCost }] });
    } catch (err: any) {
      toast.error(err.message || "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onCancel}
        className="flex items-center gap-1 text-sm text-[rgba(245,246,252,0.5)] hover:text-[var(--ice-white)]"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("admin.tickets.create.backToTicket")}
      </button>
      <h3 className="text-lg font-bold text-[var(--ice-white)] font-[var(--font-lexend)]">
        {t("admin.tickets.create.addService")}
      </h3>

      {/* Category */}
      <div className="space-y-1">
        <label className="text-xs text-[rgba(245,246,252,0.5)]">
          {t("admin.tickets.create.service.category")} *
        </label>
        <div className="flex gap-2 flex-wrap mt-1">
          {["DESIGN", "WEB", "MARKETING"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                category === cat
                  ? "bg-[var(--gold-bar)] text-[var(--asphalt-black)]"
                  : "border border-[rgba(245,246,252,0.2)] text-[rgba(245,246,252,0.6)] hover:border-[rgba(245,246,252,0.4)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Service name */}
      <div className="space-y-1">
        <label className="text-xs text-[rgba(245,246,252,0.5)]">
          {t("admin.tickets.create.service.name")} *
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          placeholder="Video Editing"
        />
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label className="text-xs text-[rgba(245,246,252,0.5)]">
          {t("admin.tickets.create.service.description")}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`${inputClass} resize-none`}
          rows={2}
        />
      </div>

      <hr className="border-[rgba(245,246,252,0.1)]" />
      <p className="text-xs text-[rgba(245,246,252,0.5)]">
        {t("admin.tickets.create.service.firstVariant")}
      </p>

      {/* Variant name */}
      <div className="space-y-1">
        <label className="text-xs text-[rgba(245,246,252,0.5)]">
          {t("admin.tickets.createVariant")} *
        </label>
        <input
          value={variantName}
          onChange={(e) => setVariantName(e.target.value)}
          className={inputClass}
          placeholder="Basic"
        />
      </div>

      {/* Credit cost + days */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-[rgba(245,246,252,0.5)]">
            {t("admin.tickets.createCredits")} *
          </label>
          <input
            type="number"
            min={1}
            value={creditCost}
            onChange={(e) => setCreditCost(Number(e.target.value))}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-[rgba(245,246,252,0.5)]">
            {t("admin.tickets.create.service.days")} *
          </label>
          <input
            type="number"
            min={1}
            value={estimatedDays}
            onChange={(e) => setEstimatedDays(Number(e.target.value))}
            className={inputClass}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <Button
          variant="ghost"
          onClick={onCancel}
          className="flex-1 border border-[rgba(245,246,252,0.2)] text-[rgba(245,246,252,0.5)] hover:text-[var(--ice-white)]"
        >
          {t("common.cancel")}
        </Button>
        <Button
          disabled={saving || !name.trim() || !variantName.trim() || creditCost < 1}
          onClick={handleSave}
          className="flex-1 bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold text-sm disabled:opacity-50"
        >
          {saving ? "..." : t("admin.tickets.create.saveAndBack")}
        </Button>
      </div>
    </div>
  );
}

interface TicketRow {
  id: string;
  number: number;
  userId: string;
  clientName: string;
  clientBusiness: string | null;
  serviceName: string;
  serviceCategory: string;
  variantName: string;
  status: string;
  priority: string;
  freelancerName: string | null;
  freelancerId: string | null;
  clientNotes: string | null;
  briefStructured: Record<string, unknown> | null;
  pmNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AvailableFreelancer {
  id: string;
  name: string;
  role: string;
  skills: string[];
  skillTags: string[];
  currentLoad: number;
  clientCapacity: number;
}

interface ClientOption {
  id: string;
  name: string;
  businessName: string | null;
}

interface ServiceVariantOption {
  id: string;
  name: string;
  creditCost: number;
}

interface ServiceOption {
  id: string;
  name: string;
  variants: ServiceVariantOption[];
}

const statusOptions = [
  { value: "", label: "All" },
  { value: "NEW", label: "New" },
  { value: "REVIEWING", label: "Reviewing" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "REVISION", label: "Revision" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELED", label: "Canceled" },
];

const categoryOptions = [
  { value: "", label: "All" },
  { value: "DESIGN", label: "Design" },
  { value: "WEB", label: "Web" },
  { value: "MARKETING", label: "Marketing" },
];

const priorityOptions = [
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

const createStatusOptions = [
  { value: "NEW", label: "New" },
  { value: "REVIEWING", label: "Reviewing" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
];

const selectClass =
  "h-9 rounded-md border border-[rgba(245,246,252,0.2)] bg-[#1a1108] px-3 text-sm text-[var(--ice-white)] [&_option]:bg-[#1a1108] [&_option]:text-[var(--ice-white)]";

export function TicketsClient({
  tickets,
  availableFreelancers,
}: {
  tickets: TicketRow[];
  availableFreelancers: AvailableFreelancer[];
}) {
  const router = useRouter();
  const { t, lang } = useTranslation();

  // Filters
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [clients, setClients] = useState<ClientOption[]>([]);

  // Assign dialog
  const [assignTicket, setAssignTicket] = useState<TicketRow | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");

  // Create dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [createServices, setCreateServices] = useState<ServiceOption[]>([]);
  const [createForm, setCreateForm] = useState({
    userId: "",
    serviceId: "",
    variantId: "",
    priority: "NORMAL",
    status: "NEW",
    clientNotes: "",
    creditsCharged: 0,
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    fetch("/api/admin/clients?minimal=true")
      .then((r) => r.json())
      .then((data) => setClients(data.clients || []));
  }, []);

  const refetchServices = async () => {
    const r = await fetch("/api/admin/services");
    const data = await r.json();
    setCreateServices(data.services || []);
  };

  useEffect(() => {
    if (!showCreateDialog) return;
    refetchServices();
  }, [showCreateDialog]);

  const selectedService = useMemo(
    () => createServices.find((s) => s.id === createForm.serviceId) || null,
    [createServices, createForm.serviceId]
  );

  const filtered = useMemo(() => {
    return tickets.filter((t: any) => {
      if (filterStatus && t.status !== filterStatus) return false;
      if (filterPriority && t.priority !== filterPriority) return false;
      if (filterCategory && t.serviceCategory !== filterCategory) return false;
      if (filterClient && t.userId !== filterClient) return false;
      return true;
    });
  }, [tickets, filterStatus, filterPriority, filterCategory, filterClient]);

  const matchingFreelancers = useMemo(() => {
    if (!assignTicket) return availableFreelancers;
    const cat = assignTicket.serviceCategory;
    return availableFreelancers.filter(
      (f) => f.skills.includes(cat) || f.skills.length === 0
    );
  }, [assignTicket, availableFreelancers]);

  const handleAssign = async (freelancerId: string) => {
    if (!assignTicket) return;
    setAssigning(true);
    setAssignError("");
    try {
      const res = await fetch(
        `/api/admin/tickets/${assignTicket.id}/assign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ freelancerId }),
        }
      );
      if (res.ok) {
        setAssignTicket(null);
        router.refresh();
      } else {
        const data = await res.json();
        setAssignError(data.error || "Error assigning");
      }
    } finally {
      setAssigning(false);
    }
  };

  const handleCreate = async () => {
    setCreateError("");
    if (!createForm.userId || !createForm.variantId) {
      setCreateError(t("admin.tickets.createErrorRequired"));
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: createForm.userId,
          variantId: createForm.variantId,
          priority: createForm.priority,
          status: createForm.status,
          clientNotes: createForm.clientNotes || null,
          creditsCharged: createForm.creditsCharged,
        }),
      });
      if (res.ok) {
        setShowCreateDialog(false);
        setCreateForm({
          userId: "",
          serviceId: "",
          variantId: "",
          priority: "NORMAL",
          status: "NEW",
          clientNotes: "",
          creditsCharged: 0,
        });
        router.refresh();
      } else {
        const data = await res.json();
        setCreateError(data.error || "Error creating ticket");
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-[var(--font-lexend)] text-2xl font-bold text-[var(--ice-white)]">
          All Tickets
        </h1>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-[var(--gold-bar)] text-[var(--asphalt-black)] font-bold hover:opacity-90 text-sm"
        >
          + {t("admin.tickets.create")}
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={selectClass}
            >
              {statusOptions.map((o: any) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className={selectClass}
            >
              <option value="">All priorities</option>
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className={selectClass}
            >
              {categoryOptions.map((o: any) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className={selectClass}
            >
              <option value="">{t("admin.tickets.allClients")}</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.businessName ? ` — ${c.businessName}` : ""}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
        <CardHeader>
          <CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)] text-base">
            {filtered.length} tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[rgba(245,246,252,0.1)] hover:bg-transparent">
                  <TableHead className="text-[rgba(245,246,252,0.5)]">#</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Client</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Service</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Status</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Priority</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Freelancer</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Created</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-[rgba(245,246,252,0.4)] py-8"
                    >
                      No tickets
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((t: any) => (
                  <TableRow
                    key={t.id}
                    onClick={() => router.push(`/admin/tickets/${t.id}`)}
                    className={`border-[rgba(245,246,252,0.06)] hover:bg-[rgba(255,255,255,0.03)] cursor-pointer ${
                      t.status === "NEW"
                        ? "border-l-2 border-l-[var(--gold-bar)]"
                        : ""
                    }`}
                  >
                    <TableCell className="text-[var(--ice-white)] font-mono text-sm">
                      {t.number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-[var(--ice-white)]">
                          {t.clientName}
                        </p>
                        {t.clientBusiness && (
                          <p className="text-xs text-[rgba(245,246,252,0.4)]">
                            {t.clientBusiness}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-[rgba(245,246,252,0.7)]">
                          {t.serviceName}
                        </p>
                        <p className="text-xs text-[rgba(245,246,252,0.4)]">
                          {t.variantName}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={ticketStatusColors[t.status] || ""}>
                        {ticketStatusLabels[t.status] || t.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-sm ${priorityColors[t.priority] || ""}`}
                      >
                        {priorityLabels[t.priority] || t.priority}
                      </span>
                    </TableCell>
                    <TableCell>
                      {t.freelancerName ? (
                        <span className="text-sm text-[rgba(245,246,252,0.7)]">
                          {t.freelancerName}
                        </span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e: any) => {
                            e.stopPropagation();
                            setAssignTicket(t);
                          }}
                          className="h-7 gap-1 text-xs text-[var(--gold-bar)] hover:text-[var(--gold-bar)] hover:bg-[rgba(255,201,25,0.1)]"
                        >
                          <UserPlus className="h-3 w-3" />
                          Assign
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-[rgba(245,246,252,0.5)]">
                      {new Date(t.createdAt).toLocaleDateString(getLocale(lang))}
                    </TableCell>
                    <TableCell className="text-sm text-[rgba(245,246,252,0.5)]">
                      {new Date(t.updatedAt).toLocaleDateString(getLocale(lang))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Assign Dialog */}
      <Dialog
        open={!!assignTicket}
        onOpenChange={(open) => !open && setAssignTicket(null)}
      >
        <DialogContent className="border-[rgba(245,246,252,0.1)] bg-[var(--asphalt-black)] text-[var(--ice-white)] max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-[var(--font-lexend)]">
              Assign Ticket #{assignTicket?.number}
            </DialogTitle>
            <DialogDescription className="text-[rgba(245,246,252,0.5)]">
              {assignTicket?.serviceName} — {assignTicket?.variantName}
            </DialogDescription>
          </DialogHeader>

          {assignTicket?.pmNotes && (
            <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 p-3 text-sm text-yellow-400">
              <span>⚠️</span>
              <span>System note: {assignTicket.pmNotes}</span>
            </div>
          )}

          {(assignTicket?.briefStructured || assignTicket?.clientNotes) && (
            <div className="rounded-md bg-[rgba(255,255,255,0.03)] border border-[rgba(245,246,252,0.1)] p-3 mb-2">
              <p className="text-xs font-medium text-[rgba(245,246,252,0.5)] mb-1">
                Client brief
              </p>
              <p className="text-sm text-[rgba(245,246,252,0.7)]">
                {assignTicket?.briefStructured
                  ? JSON.stringify(assignTicket.briefStructured, null, 2)
                  : assignTicket?.clientNotes}
              </p>
            </div>
          )}

          <p className="text-xs text-[rgba(245,246,252,0.4)] mb-2">
            Category:{" "}
            <Badge className="ml-1 bg-[rgba(255,255,255,0.05)]">
              {categoryLabels[assignTicket?.serviceCategory || ""] ||
                assignTicket?.serviceCategory}
            </Badge>
          </p>

          {assignError && (
            <div className="text-sm text-red-400 text-center bg-red-500/10 border border-red-500/20 rounded-md p-2">
              {assignError}
            </div>
          )}

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {matchingFreelancers.length === 0 ? (
              <p className="text-sm text-[rgba(245,246,252,0.4)] text-center py-4">
                No freelancers available for this category
              </p>
            ) : (
              matchingFreelancers.map((f: any) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between rounded-md border border-[rgba(245,246,252,0.1)] p-3 hover:bg-[rgba(255,255,255,0.03)]"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--ice-white)]">
                      {f.name}
                    </p>
                    <p className="text-xs text-[rgba(245,246,252,0.5)]">
                      {freelancerRoleLabels[f.role] || f.role} · Load:{" "}
                      {f.currentLoad}/{f.clientCapacity}
                    </p>
                    {f.skillTags.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {f.skillTags.map((tag: any) => (
                          <span
                            key={tag}
                            className="text-[10px] bg-[rgba(255,255,255,0.05)] text-[rgba(245,246,252,0.5)] px-1.5 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    disabled={assigning}
                    onClick={() => handleAssign(f.id)}
                    className="ml-3 bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold text-xs h-7"
                  >
                    Asignar
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Ticket Dialog */}
      <Dialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setShowAddService(false);
            setCreateError("");
            setCreateForm({
              userId: "",
              serviceId: "",
              variantId: "",
              priority: "NORMAL",
              status: "NEW",
              clientNotes: "",
              creditsCharged: 0,
            });
          }
        }}
      >
        <DialogContent className="border-[rgba(245,246,252,0.1)] bg-[var(--asphalt-black)] text-[var(--ice-white)] max-w-lg">
          {showAddService ? (
            <AddServiceForm
              t={t}
              selectClass={selectClass}
              onSave={async (newService) => {
                await refetchServices();
                setCreateForm((f) => ({
                  ...f,
                  serviceId: newService.id,
                  variantId: newService.variants[0]?.id ?? "",
                  creditsCharged: newService.variants[0]?.creditCost ?? 0,
                }));
                setShowAddService(false);
                toast.success(t("admin.tickets.create.serviceCreated"));
              }}
              onCancel={() => setShowAddService(false)}
            />
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="font-[var(--font-lexend)]">
                  {t("admin.tickets.createTitle")}
                </DialogTitle>
                <DialogDescription className="text-[rgba(245,246,252,0.5)]">
                  {t("admin.tickets.createHint")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Client */}
                <div className="space-y-1">
                  <label className="text-xs text-[rgba(245,246,252,0.5)]">
                    {t("admin.tickets.createClient")} *
                  </label>
                  <select
                    value={createForm.userId}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, userId: e.target.value }))
                    }
                    className={`${selectClass} w-full h-auto py-2`}
                  >
                    <option value="">{t("admin.tickets.allClients")}</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}{c.businessName ? ` — ${c.businessName}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Service */}
                <div className="space-y-1">
                  <label className="text-xs text-[rgba(245,246,252,0.5)]">
                    {t("admin.tickets.createService")} *
                  </label>
                  <select
                    value={createForm.serviceId}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        serviceId: e.target.value,
                        variantId: "",
                        creditsCharged: 0,
                      }))
                    }
                    className={`${selectClass} w-full h-auto py-2`}
                  >
                    <option value="">—</option>
                    {createServices.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddService(true)}
                    className="mt-1 text-sm text-[var(--gold-bar)] hover:underline"
                  >
                    + {t("admin.tickets.create.addService")}
                  </button>
                </div>

                {/* Variant */}
                {selectedService && (
                  <div className="space-y-1">
                    <label className="text-xs text-[rgba(245,246,252,0.5)]">
                      {t("admin.tickets.createVariant")} *
                    </label>
                    <select
                      value={createForm.variantId}
                      onChange={(e) => {
                        const v = selectedService.variants.find(
                          (vv) => vv.id === e.target.value
                        );
                        setCreateForm((f) => ({
                          ...f,
                          variantId: e.target.value,
                          creditsCharged: v?.creditCost ?? 0,
                        }));
                      }}
                      className={`${selectClass} w-full h-auto py-2`}
                    >
                      <option value="">—</option>
                      {selectedService.variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.creditCost} cr)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {/* Priority */}
                  <div className="space-y-1">
                    <label className="text-xs text-[rgba(245,246,252,0.5)]">
                      {t("admin.tickets.createPriority")}
                    </label>
                    <select
                      value={createForm.priority}
                      onChange={(e) =>
                        setCreateForm((f) => ({ ...f, priority: e.target.value }))
                      }
                      className={`${selectClass} w-full h-auto py-2`}
                    >
                      {priorityOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div className="space-y-1">
                    <label className="text-xs text-[rgba(245,246,252,0.5)]">
                      {t("admin.tickets.createStatus")}
                    </label>
                    <select
                      value={createForm.status}
                      onChange={(e) =>
                        setCreateForm((f) => ({ ...f, status: e.target.value }))
                      }
                      className={`${selectClass} w-full h-auto py-2`}
                    >
                      {createStatusOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Credits */}
                <div className="space-y-1">
                  <label className="text-xs text-[rgba(245,246,252,0.5)]">
                    {t("admin.tickets.createCredits")}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={createForm.creditsCharged}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        creditsCharged: Number(e.target.value),
                      }))
                    }
                    className="h-9 w-full rounded-md border border-[rgba(245,246,252,0.2)] bg-[#1a1108] px-3 text-sm text-[var(--ice-white)] outline-none"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-xs text-[rgba(245,246,252,0.5)]">
                    {t("admin.tickets.createNotes")}
                  </label>
                  <textarea
                    value={createForm.clientNotes}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        clientNotes: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full rounded-md border border-[rgba(245,246,252,0.2)] bg-[#1a1108] px-3 py-2 text-sm text-[var(--ice-white)] outline-none resize-none"
                  />
                </div>

                {createError && (
                  <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md p-2">
                    {createError}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    variant="ghost"
                    onClick={() => setShowCreateDialog(false)}
                    className="text-[rgba(245,246,252,0.5)] hover:text-[var(--ice-white)]"
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    disabled={creating}
                    onClick={handleCreate}
                    className="bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold text-sm"
                  >
                    {creating ? "..." : t("admin.tickets.createConfirm")}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
