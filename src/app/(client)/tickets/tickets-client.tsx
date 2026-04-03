"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Ticket, CreditCard, Calendar, User } from "lucide-react";
import {
  ticketStatusLabels,
  ticketStatusColors,
  freelancerRoleLabels,
  categoryColors,
  categoryLabels,
} from "@/lib/status-labels";

interface TicketRow {
  id: string;
  number: number;
  serviceName: string;
  serviceCategory: string;
  variantName: string;
  status: string;
  creditsCharged: number;
  summary: string | null;
  freelancerName: string | null;
  freelancerRole: string | null;
  createdAt: string;
}

const tabs = [
  { key: "all", label: "Todos" },
  { key: "active", label: "Activos", statuses: ["NEW", "REVIEWING", "ASSIGNED", "IN_PROGRESS"] },
  { key: "delivered", label: "Entregados", statuses: ["DELIVERED", "REVISION"] },
  { key: "completed", label: "Completados", statuses: ["COMPLETED"] },
  { key: "canceled", label: "Cancelados", statuses: ["CANCELED"] },
];

export function TicketsClient({ tickets }: { tickets: TicketRow[] }) {
  const [activeTab, setActiveTab] = useState("all");

  const filtered = useMemo(() => {
    const tab = tabs.find((t) => t.key === activeTab);
    if (!tab || !tab.statuses) return tickets;
    return tickets.filter((t) => tab.statuses!.includes(t.status));
  }, [tickets, activeTab]);

  if (tickets.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="font-[var(--font-lexend)] text-2xl font-bold text-[var(--ice-white)]">
          Mis Solicitudes
        </h1>
        <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
          <CardContent className="py-16 text-center space-y-4">
            <Ticket className="h-12 w-12 text-[rgba(245,246,252,0.2)] mx-auto" />
            <p className="text-[rgba(245,246,252,0.5)]">
              Aún no tienes solicitudes
            </p>
            <Link href="/request">
              <Button className="bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold">
                Crear mi primera solicitud
                <Plus className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-[var(--font-lexend)] text-2xl font-bold text-[var(--ice-white)]">
        Mis Solicitudes
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => {
          const count = tab.statuses
            ? tickets.filter((t) => tab.statuses!.includes(t.status)).length
            : tickets.length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-sm transition-colors ${
                activeTab === tab.key
                  ? "bg-[var(--gold-bar)] text-[var(--asphalt-black)] font-medium"
                  : "bg-[rgba(255,255,255,0.05)] text-[rgba(245,246,252,0.5)] hover:text-[var(--ice-white)]"
              }`}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      <p className="text-xs text-[rgba(245,246,252,0.4)]">
        {filtered.length} solicitud{filtered.length !== 1 ? "es" : ""}
      </p>

      {/* Ticket cards */}
      <div className="space-y-3">
        {filtered.map((t) => (
          <Link key={t.id} href={`/tickets/${t.id}`}>
            <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)] hover:border-[var(--gold-bar)] hover:bg-[rgba(255,201,25,0.02)] transition-all cursor-pointer mb-3">
              <CardContent className="py-4">
                {/* Header: number + status */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-[rgba(245,246,252,0.5)]">
                      #{String(t.number).padStart(3, "0")}
                    </span>
                    <Badge className={categoryColors[t.serviceCategory] || ""}>
                      {categoryLabels[t.serviceCategory] || t.serviceCategory}
                    </Badge>
                  </div>
                  <Badge className={ticketStatusColors[t.status] || ""}>
                    {ticketStatusLabels[t.status] || t.status}
                  </Badge>
                </div>

                {/* Service name */}
                <p className="font-[var(--font-lexend)] font-semibold text-[var(--ice-white)]">
                  {t.variantName}
                  <span className="font-normal text-[rgba(245,246,252,0.5)]">
                    {" "}— {t.serviceName}
                  </span>
                </p>

                {/* Summary */}
                {t.summary && (
                  <p className="mt-1 text-sm text-[rgba(245,246,252,0.4)] line-clamp-2">
                    &ldquo;{t.summary.substring(0, 120)}
                    {t.summary.length > 120 ? "..." : ""}&rdquo;
                  </p>
                )}

                {/* Meta row */}
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-[rgba(245,246,252,0.4)]">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(t.createdAt).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    {t.creditsCharged} créditos
                  </span>
                  {t.freelancerName && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {t.freelancerName}
                      {t.freelancerRole
                        ? ` (${freelancerRoleLabels[t.freelancerRole] || t.freelancerRole})`
                        : ""}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
