"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ticketStatusLabels,
  ticketStatusColors,
  priorityLabels,
  priorityColors,
  availabilityLabels,
  availabilityColors,
  freelancerRoleLabels,
} from "@/lib/status-labels";
import { ChevronDown, ChevronUp } from "lucide-react";

interface TicketRow {
  id: string; number: number; status: string; priority: string;
  serviceName: string; variantName: string; clientName: string;
  businessName: string | null; assignedAt: string | null; completedAt: string | null;
}
interface Props {
  freelancer: { name: string; role: string; availability: string; currentLoad: number; clientCapacity: number };
  activeTickets: TicketRow[]; completedTickets: TicketRow[];
  activeCount: number; completedThisMonth: number;
}

const crd = "border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]";
const sub = "text-sm text-[rgba(245,246,252,0.5)]";
const fmt = (iso: string) => new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
const AVAILABILITY_CYCLE = ["AVAILABLE", "BUSY", "ON_LEAVE"];

export function PortalClient({ freelancer, activeTickets, completedTickets, activeCount, completedThisMonth }: Props) {
  const router = useRouter();
  const [toggling, setToggling] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const firstName = freelancer.name.split(" ")[0];
  const loadPct = freelancer.clientCapacity > 0 ? Math.round((freelancer.currentLoad / freelancer.clientCapacity) * 100) : 0;

  async function toggleAvailability() {
    const idx = AVAILABILITY_CYCLE.indexOf(freelancer.availability);
    const next = AVAILABILITY_CYCLE[(idx + 1) % AVAILABILITY_CYCLE.length];
    setToggling(true);
    try {
      await fetch("/api/freelancer/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability: next }),
      });
      router.refresh();
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold font-[var(--font-lexend)] text-[var(--ice-white)]">
          Hola, {firstName}
        </h1>
        <Badge
          variant="outline"
          className="border-[var(--gold-bar)] text-[var(--gold-bar)]"
        >
          {freelancerRoleLabels[freelancer.role] || freelancer.role}
        </Badge>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={crd}>
          <CardContent className="pt-4 pb-4">
            <p className={sub}>Tickets activos</p>
            <p className="text-2xl font-bold text-[var(--ice-white)]">
              {activeCount}
            </p>
          </CardContent>
        </Card>

        <Card className={crd}>
          <CardContent className="pt-4 pb-4">
            <p className={sub}>Completados este mes</p>
            <p className="text-2xl font-bold text-[var(--ice-white)]">
              {completedThisMonth}
            </p>
          </CardContent>
        </Card>

        <Card className={crd}>
          <CardContent className="pt-4 pb-4">
            <p className={sub}>Carga</p>
            <p className="text-lg font-bold text-[var(--ice-white)]">
              {freelancer.currentLoad} / {freelancer.clientCapacity}
            </p>
            <div className="mt-2 h-2 rounded-full bg-[rgba(255,255,255,0.1)]">
              <div
                className="h-2 rounded-full bg-[var(--gold-bar)] transition-all"
                style={{ width: `${Math.min(loadPct, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className={crd}>
          <CardContent className="pt-4 pb-4">
            <p className={sub}>Disponibilidad</p>
            <button
              onClick={toggleAvailability}
              disabled={toggling}
              className="mt-1"
            >
              <Badge
                variant="outline"
                className={`cursor-pointer ${availabilityColors[freelancer.availability] || ""}`}
              >
                {toggling
                  ? "..."
                  : availabilityLabels[freelancer.availability] ||
                    freelancer.availability}
              </Badge>
            </button>
            <p className="text-xs text-[rgba(245,246,252,0.3)] mt-1">
              Click para cambiar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Tickets */}
      <div>
        <h2 className="font-[var(--font-lexend)] text-sm text-[rgba(245,246,252,0.5)] uppercase tracking-wider mb-3">
          Tickets activos
        </h2>
        {activeTickets.length === 0 ? (
          <p className={sub}>No tienes tickets activos.</p>
        ) : (
          <div className="space-y-2">
            {activeTickets.map((t: any) => (
              <Card
                key={t.id}
                className={`${crd} cursor-pointer hover:bg-[rgba(255,255,255,0.06)] transition-colors`}
                onClick={() => router.push(`/freelancer/tickets/${t.id}`)}
              >
                <CardContent className="py-3 px-4 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <span className="text-[var(--gold-bar)] font-mono text-sm font-bold min-w-[60px]">
                    #{t.number}
                  </span>
                  <span className="text-[var(--ice-white)] text-sm flex-1">
                    {t.serviceName}{" "}
                    <span className="text-[rgba(245,246,252,0.4)]">
                      ({t.variantName})
                    </span>
                  </span>
                  <span className={`text-xs ${sub}`}>
                    {t.clientName}
                    {t.businessName ? ` - ${t.businessName}` : ""}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${ticketStatusColors[t.status] || ""}`}
                  >
                    {ticketStatusLabels[t.status] || t.status}
                  </Badge>
                  <span
                    className={`text-xs ${priorityColors[t.priority] || ""}`}
                  >
                    {priorityLabels[t.priority] || t.priority}
                  </span>
                  {t.assignedAt && (
                    <span className="text-xs text-[rgba(245,246,252,0.3)]">
                      {fmt(t.assignedAt)}
                    </span>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Completed Tickets */}
      {completedTickets.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 font-[var(--font-lexend)] text-sm text-[rgba(245,246,252,0.5)] uppercase tracking-wider mb-3 hover:text-[rgba(245,246,252,0.7)] transition-colors"
          >
            Completados recientes
            {showCompleted ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          {showCompleted && (
            <div className="space-y-2 opacity-70">
              {completedTickets.map((t: any) => (
                <Card
                  key={t.id}
                  className={`${crd} cursor-pointer hover:bg-[rgba(255,255,255,0.06)] transition-colors`}
                  onClick={() => router.push(`/freelancer/tickets/${t.id}`)}
                >
                  <CardContent className="py-3 px-4 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                    <span className="text-[rgba(245,246,252,0.4)] font-mono text-sm font-bold min-w-[60px]">
                      #{t.number}
                    </span>
                    <span className="text-[rgba(245,246,252,0.6)] text-sm flex-1">
                      {t.serviceName}{" "}
                      <span className="text-[rgba(245,246,252,0.3)]">
                        ({t.variantName})
                      </span>
                    </span>
                    <span className="text-xs text-[rgba(245,246,252,0.3)]">
                      {t.clientName}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${ticketStatusColors[t.status] || ""}`}
                    >
                      {ticketStatusLabels[t.status] || t.status}
                    </Badge>
                    {t.completedAt && (
                      <span className="text-xs text-[rgba(245,246,252,0.3)]">
                        {fmt(t.completedAt)}
                      </span>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
