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
import { UserPlus } from "lucide-react";
import {
  ticketStatusLabels,
  ticketStatusColors,
  priorityLabels,
  priorityColors,
  freelancerRoleLabels,
  categoryLabels,
} from "@/lib/status-labels";

interface TicketRow {
  id: string;
  number: number;
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

const statusOptions = [
  { value: "", label: "Todos" },
  { value: "NEW", label: "Nuevo" },
  { value: "REVIEWING", label: "En revisión" },
  { value: "ASSIGNED", label: "Asignado" },
  { value: "IN_PROGRESS", label: "En progreso" },
  { value: "DELIVERED", label: "Entregado" },
  { value: "REVISION", label: "Revisión" },
  { value: "COMPLETED", label: "Completado" },
  { value: "CANCELED", label: "Cancelado" },
];

const categoryOptions = [
  { value: "", label: "Todas" },
  { value: "DESIGN", label: "Diseño" },
  { value: "WEB", label: "Web" },
  { value: "MARKETING", label: "Marketing" },
];

export function TicketsClient({
  tickets,
  availableFreelancers,
}: {
  tickets: TicketRow[];
  availableFreelancers: AvailableFreelancer[];
}) {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [assignTicket, setAssignTicket] = useState<TicketRow | null>(null);
  const [assigning, setAssigning] = useState(false);

  const filtered = useMemo(() => {
    return tickets.filter((t: any) => {
      if (filterStatus && t.status !== filterStatus) return false;
      if (filterPriority && t.priority !== filterPriority) return false;
      if (filterCategory && t.serviceCategory !== filterCategory) return false;
      return true;
    });
  }, [tickets, filterStatus, filterPriority, filterCategory]);

  const matchingFreelancers = useMemo(() => {
    if (!assignTicket) return availableFreelancers;
    const cat = assignTicket.serviceCategory;
    return availableFreelancers.filter(
      (f) => f.skills.includes(cat) || f.skills.length === 0
    );
  }, [assignTicket, availableFreelancers]);

  const [assignError, setAssignError] = useState("");

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
        setAssignError(data.error || "Error al asignar");
      }
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-[var(--font-lexend)] text-2xl font-bold text-[var(--ice-white)]">
        Todos los Tickets
      </h1>

      {/* Filters */}
      <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-9 rounded-md border border-[rgba(245,246,252,0.2)] bg-[#1a1108] px-3 text-sm text-[var(--ice-white)] [&_option]:bg-[#1a1108] [&_option]:text-[var(--ice-white)]"
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
              className="h-9 rounded-md border border-[rgba(245,246,252,0.2)] bg-[#1a1108] px-3 text-sm text-[var(--ice-white)] [&_option]:bg-[#1a1108] [&_option]:text-[var(--ice-white)]"
            >
              <option value="">Toda prioridad</option>
              <option value="LOW">Baja</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">Alta</option>
              <option value="URGENT">Urgente</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-9 rounded-md border border-[rgba(245,246,252,0.2)] bg-[#1a1108] px-3 text-sm text-[var(--ice-white)] [&_option]:bg-[#1a1108] [&_option]:text-[var(--ice-white)]"
            >
              {categoryOptions.map((o: any) => (
                <option key={o.value} value={o.value}>
                  {o.label}
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
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Cliente</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Servicio</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Estado</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Prioridad</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Freelancer</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Creado</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Actualizado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-[rgba(245,246,252,0.4)] py-8"
                    >
                      Sin tickets
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
                          Asignar
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-[rgba(245,246,252,0.5)]">
                      {new Date(t.createdAt).toLocaleDateString("es-MX")}
                    </TableCell>
                    <TableCell className="text-sm text-[rgba(245,246,252,0.5)]">
                      {new Date(t.updatedAt).toLocaleDateString("es-MX")}
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
              Asignar Ticket #{assignTicket?.number}
            </DialogTitle>
            <DialogDescription className="text-[rgba(245,246,252,0.5)]">
              {assignTicket?.serviceName} — {assignTicket?.variantName}
            </DialogDescription>
          </DialogHeader>

          {/* PM Alert */}
          {assignTicket?.pmNotes && (
            <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 p-3 text-sm text-yellow-400">
              <span>⚠️</span>
              <span>Nota del sistema: {assignTicket.pmNotes}</span>
            </div>
          )}

          {/* Brief */}
          {(assignTicket?.briefStructured || assignTicket?.clientNotes) && (
            <div className="rounded-md bg-[rgba(255,255,255,0.03)] border border-[rgba(245,246,252,0.1)] p-3 mb-2">
              <p className="text-xs font-medium text-[rgba(245,246,252,0.5)] mb-1">
                Brief del cliente
              </p>
              <p className="text-sm text-[rgba(245,246,252,0.7)]">
                {assignTicket?.briefStructured
                  ? JSON.stringify(assignTicket.briefStructured, null, 2)
                  : assignTicket?.clientNotes}
              </p>
            </div>
          )}

          {/* Category */}
          <p className="text-xs text-[rgba(245,246,252,0.4)] mb-2">
            Categoría:{" "}
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

          {/* Freelancer list */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {matchingFreelancers.length === 0 ? (
              <p className="text-sm text-[rgba(245,246,252,0.4)] text-center py-4">
                No hay freelancers disponibles para esta categoría
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
                      {freelancerRoleLabels[f.role] || f.role} · Carga:{" "}
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
    </div>
  );
}
