"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Ticket, Package, CreditCard } from "lucide-react";
import {
  ticketStatusLabels,
  ticketStatusColors,
  priorityLabels,
  priorityColors,
  availabilityLabels,
  availabilityColors,
  freelancerRoleLabels,
} from "@/lib/status-labels";

interface Metrics {
  activeClients: number;
  openTickets: number;
  deliveredThisMonth: number;
  creditsConsumed: number;
}

interface RecentTicket {
  id: string;
  number: number;
  clientName: string;
  clientBusiness: string | null;
  serviceName: string;
  variantName: string;
  status: string;
  priority: string;
  freelancerName: string | null;
  createdAt: string;
}

interface FreelancerSummary {
  id: string;
  name: string;
  role: string;
  availability: string;
  currentLoad: number;
  clientCapacity: number;
}

export function OverviewClient({
  metrics,
  recentTickets,
  freelancers,
}: {
  metrics: Metrics;
  recentTickets: RecentTicket[];
  freelancers: FreelancerSummary[];
}) {
  const metricCards = [
    {
      label: "Clientes activos",
      value: metrics.activeClients,
      icon: Users,
    },
    {
      label: "Tickets abiertos",
      value: metrics.openTickets,
      icon: Ticket,
    },
    {
      label: "Entregados este mes",
      value: metrics.deliveredThisMonth,
      icon: Package,
    },
    {
      label: "Créditos consumidos",
      value: metrics.creditsConsumed,
      icon: CreditCard,
    },
  ];

  return (
    <div className="space-y-8">
      <h1 className="font-[var(--font-lexend)] text-2xl font-bold text-[var(--ice-white)]">
        Panel General
      </h1>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((m: any) => (
          <Card
            key={m.label}
            className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[rgba(245,246,252,0.5)]">
                {m.label}
              </CardTitle>
              <m.icon className="h-4 w-4 text-[var(--gold-bar)]" />
            </CardHeader>
            <CardContent>
              <p className="font-[var(--font-lexend)] text-3xl font-bold text-[var(--ice-white)]">
                {m.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent tickets */}
      <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
        <CardHeader>
          <CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)]">
            Tickets recientes
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
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTickets.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-[rgba(245,246,252,0.4)] py-8"
                    >
                      Sin tickets aún
                    </TableCell>
                  </TableRow>
                )}
                {recentTickets.map((t: any) => (
                  <TableRow
                    key={t.id}
                    className={`border-[rgba(245,246,252,0.06)] hover:bg-[rgba(255,255,255,0.03)] ${
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
                    <TableCell className="text-sm text-[rgba(245,246,252,0.7)]">
                      {t.serviceName}
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
                    <TableCell className="text-sm text-[rgba(245,246,252,0.7)]">
                      {t.freelancerName || (
                        <span className="text-[rgba(245,246,252,0.3)]">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-[rgba(245,246,252,0.5)]">
                      {new Date(t.createdAt).toLocaleDateString("es-MX")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Freelancers */}
      <div>
        <h2 className="font-[var(--font-lexend)] text-lg font-semibold text-[var(--ice-white)] mb-4">
          Freelancers
        </h2>
        {freelancers.length === 0 ? (
          <p className="text-[rgba(245,246,252,0.4)]">
            No hay freelancers registrados
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {freelancers.map((f: any) => (
              <Card
                key={f.id}
                className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]"
              >
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-[var(--ice-white)]">
                      {f.name}
                    </p>
                    <Badge className={availabilityColors[f.availability] || ""}>
                      {availabilityLabels[f.availability] || f.availability}
                    </Badge>
                  </div>
                  <p className="text-xs text-[rgba(245,246,252,0.5)] mb-3">
                    {freelancerRoleLabels[f.role] || f.role}
                  </p>
                  <div>
                    <div className="flex justify-between text-xs text-[rgba(245,246,252,0.4)] mb-1">
                      <span>Carga</span>
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
