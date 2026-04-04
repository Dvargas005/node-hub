"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { getGoogleDrivePreview } from "@/lib/file-preview";

interface DeliveryRow {
  id: string;
  ticketId: string;
  ticketNumber: number;
  serviceName: string;
  round: number;
  status: string;
  fileUrl: string | null;
  fileName: string | null;
  createdAt: string;
}

const deliveryStatusLabels: Record<string, string> = {
  PENDING_REVIEW: "Pendiente de revision",
  PM_APPROVED: "Aprobada por PM",
  SENT_TO_CLIENT: "Enviada al cliente",
  CLIENT_APPROVED: "Aprobada por cliente",
  REVISION_REQUESTED: "Revision solicitada",
};
const deliveryStatusColors: Record<string, string> = {
  PENDING_REVIEW: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  PM_APPROVED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  SENT_TO_CLIENT: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  CLIENT_APPROVED: "bg-green-500/20 text-green-400 border-green-500/30",
  REVISION_REQUESTED: "bg-red-500/20 text-red-400 border-red-500/30",
};

const ALL_STATUSES = [
  "PENDING_REVIEW",
  "PM_APPROVED",
  "SENT_TO_CLIENT",
  "CLIENT_APPROVED",
  "REVISION_REQUESTED",
];

const crd = "border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]";
const sub = "text-sm text-[rgba(245,246,252,0.5)]";
const sel =
  "h-9 rounded-md border border-[rgba(245,246,252,0.2)] bg-[#1a1108] px-3 text-sm text-[var(--ice-white)] [&_option]:bg-[#1a1108] [&_option]:text-[var(--ice-white)]";

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export function DeliveriesClient({
  deliveries,
}: {
  deliveries: DeliveryRow[];
}) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered =
    statusFilter === "ALL"
      ? deliveries
      : deliveries.filter((d: any) => d.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-[var(--font-lexend)] text-[var(--ice-white)]">
          Entregas
        </h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={sel}
        >
          <option value="ALL">Todos los estados</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {deliveryStatusLabels[s] || s}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className={sub}>No hay entregas con este filtro.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((d: any) => (
            <Card
              key={d.id}
              className={`${crd} cursor-pointer hover:bg-[rgba(255,255,255,0.06)] transition-colors`}
              onClick={() => router.push(`/freelancer/tickets/${d.ticketId}`)}
            >
              <CardContent className="py-3 px-4 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <span className="text-[var(--gold-bar)] font-mono text-sm font-bold min-w-[60px]">
                  #{d.ticketNumber}
                </span>
                <span className="text-[var(--ice-white)] text-sm flex-1">
                  {d.serviceName}
                </span>
                <span className="text-xs text-[var(--ice-white)]">
                  Ronda {d.round}
                </span>
                <Badge
                  variant="outline"
                  className={`text-xs ${deliveryStatusColors[d.status] || ""}`}
                >
                  {deliveryStatusLabels[d.status] || d.status}
                </Badge>
                {d.fileUrl && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <a
                      href={d.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[var(--gold-bar)] hover:underline text-xs"
                    >
                      <ExternalLink className="h-3 w-3" /> {d.fileName || "Abrir recurso"}
                    </a>
                    {getGoogleDrivePreview(d.fileUrl) && (
                      <img src={getGoogleDrivePreview(d.fileUrl)!} alt="Preview" className="mt-2 max-w-[200px] opacity-80 rounded" />
                    )}
                  </div>
                )}
                <span className="text-xs text-[rgba(245,246,252,0.3)]">
                  {fmt(d.createdAt)}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
