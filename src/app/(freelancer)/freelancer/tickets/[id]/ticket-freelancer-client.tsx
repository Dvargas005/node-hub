"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, Upload, ExternalLink } from "lucide-react";
import { ticketStatusLabels, ticketStatusColors, priorityLabels, priorityColors } from "@/lib/status-labels";

interface Message { id: string; content: string; senderRole: string; senderName: string; createdAt: string }
interface DeliveryRow { id: string; round: number; status: string; notes: string | null; fileUrl: string | null; fileName: string | null; pmFeedback: string | null; clientFeedback: string | null; createdAt: string }
interface FileRow { id: string; name: string; url: string; type: string }
interface TicketData {
  id: string; number: number; status: string; priority: string; pmNotes: string | null;
  briefStructured: Record<string, unknown> | null;
  assignedAt: string | null; startedAt: string | null; deliveredAt: string | null; completedAt: string | null;
  serviceName: string; variantName: string; clientName: string; businessName: string | null;
  messages: Message[]; deliveries: DeliveryRow[]; files: FileRow[];
}

const crd = "border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]";
const inp = "w-full rounded-md border border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-sm text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)] focus:outline-none focus:ring-1 focus:ring-[var(--gold-bar)]";
const txa = `${inp} min-h-[72px] resize-y`;
const lbl = "text-xs font-medium text-[rgba(245,246,252,0.5)]";
const val = "text-sm text-[var(--ice-white)]";
const secHdr = "font-[var(--font-lexend)] text-xs text-[rgba(245,246,252,0.5)] uppercase tracking-wider";
const goldBtn = "bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold text-xs";
const dlvLabels: Record<string, string> = { PENDING_REVIEW: "Pendiente", PM_APPROVED: "Aprobada PM", SENT_TO_CLIENT: "Enviada", CLIENT_APPROVED: "Aprobada cliente", REVISION_REQUESTED: "Revision" };
const dlvColors: Record<string, string> = { PENDING_REVIEW: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", PM_APPROVED: "bg-blue-500/20 text-blue-400 border-blue-500/30", SENT_TO_CLIENT: "bg-purple-500/20 text-purple-400 border-purple-500/30", CLIENT_APPROVED: "bg-green-500/20 text-green-400 border-green-500/30", REVISION_REQUESTED: "bg-red-500/20 text-red-400 border-red-500/30" };
const BRIEF_LABELS: Record<string, string> = { objective: "Objetivo", audience: "Audiencia", tone: "Tono", style: "Estilo", dimensions: "Dimensiones", format: "Formato", references: "Referencias", extras: "Extras", description: "Descripcion" };
const fmt = (iso: string) => new Date(iso).toLocaleString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const fmtD = (iso: string) => new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });

export function TicketFreelancerClient({ ticket: t }: { ticket: TicketData }) {
  const router = useRouter();
  const [msgContent, setMsgContent] = useState("");
  const [sending, setSending] = useState(false);
  const [dlvNotes, setDlvNotes] = useState("");
  const [dlvUrl, setDlvUrl] = useState("");
  const [dlvName, setDlvName] = useState("");
  const [uploading, setUploading] = useState(false);

  async function sendMessage() {
    if (!msgContent.trim()) return;
    setSending(true);
    try {
      await fetch(`/api/freelancer/tickets/${t.id}/message`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: msgContent.trim() }) });
      setMsgContent("");
      router.refresh();
    } finally { setSending(false); }
  }

  async function submitDelivery() {
    if (!dlvUrl.trim()) return;
    setUploading(true);
    try {
      await fetch(`/api/freelancer/tickets/${t.id}/delivery`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes: dlvNotes.trim() || null, fileUrl: dlvUrl.trim(), fileName: dlvName.trim() || null }) });
      setDlvNotes(""); setDlvUrl(""); setDlvName("");
      router.refresh();
    } finally { setUploading(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/freelancer/portal")} className="text-[rgba(245,246,252,0.5)] hover:text-[var(--ice-white)]">
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver
        </Button>
        <h1 className="text-xl font-bold font-[var(--font-lexend)] text-[var(--ice-white)]">Ticket #{t.number}</h1>
        <Badge variant="outline" className={ticketStatusColors[t.status] || ""}>{ticketStatusLabels[t.status] || t.status}</Badge>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Main */}
        <div className="flex-1 md:w-2/3 space-y-6">
          {t.pmNotes && (
            <Card className="border-blue-500/30 bg-blue-500/5"><CardContent className="py-4">
              <p className={`${secHdr} text-blue-400 mb-2`}>Instrucciones del PM</p>
              <p className="text-sm text-[var(--ice-white)] whitespace-pre-wrap">{t.pmNotes}</p>
            </CardContent></Card>
          )}

          {t.briefStructured && (
            <Card className={crd}><CardContent className="py-4">
              <p className={`${secHdr} mb-3`}>Brief</p>
              <div className="space-y-2">
                {Object.entries(t.briefStructured).map(([key, value]: any) => value ? (
                  <div key={key}><span className={lbl}>{BRIEF_LABELS[key] || key}:</span> <span className={val}>{typeof value === "string" ? value : JSON.stringify(value)}</span></div>
                ) : null)}
              </div>
            </CardContent></Card>
          )}

          {t.files.length > 0 && (
            <Card className={crd}><CardContent className="py-4">
              <p className={`${secHdr} mb-3`}>Archivos</p>
              <div className="space-y-1">
                {t.files.map((f: any) => (
                  <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-400 hover:underline">
                    <ExternalLink className="w-3 h-3" /> {f.name}
                  </a>
                ))}
              </div>
            </CardContent></Card>
          )}

          {/* Messages */}
          <Card className={crd}><CardContent className="py-4">
            <p className={`${secHdr} mb-3`}>Canal interno con PM</p>
            <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4">
              {t.messages.length === 0 && <p className="text-xs text-[rgba(245,246,252,0.3)]">No hay mensajes aun.</p>}
              {t.messages.map((m: any) => {
                const isPm = m.senderRole === "PM" || m.senderRole === "ADMIN";
                return (
                  <div key={m.id} className={`rounded-lg border p-3 ${isPm ? "border-blue-500/30 bg-blue-500/5" : "border-[var(--gold-bar)]/30 bg-[var(--gold-bar)]/5"}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-[var(--ice-white)]">{m.senderName}</span>
                      <span className="text-xs text-[rgba(245,246,252,0.3)]">{fmt(m.createdAt)}</span>
                    </div>
                    <p className="text-sm text-[rgba(245,246,252,0.8)] whitespace-pre-wrap">{m.content}</p>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2">
              <textarea value={msgContent} onChange={(e) => setMsgContent(e.target.value)} placeholder="Escribe un mensaje..." className={txa} rows={2} />
              <Button onClick={sendMessage} disabled={sending || !msgContent.trim()} className={`${goldBtn} self-end`} size="sm">
                <Send className="w-3 h-3 mr-1" />{sending ? "..." : "Enviar"}
              </Button>
            </div>
          </CardContent></Card>

          {/* Deliveries */}
          <Card className={crd}><CardContent className="py-4">
            <p className={`${secHdr} mb-3`}>Entregas</p>
            {t.deliveries.length === 0 ? <p className="text-xs text-[rgba(245,246,252,0.3)] mb-4">No hay entregas aun.</p> : (
              <div className="space-y-3 mb-4">
                {t.deliveries.map((d: any) => (
                  <div key={d.id} className="rounded-lg border border-[rgba(245,246,252,0.1)] p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-bold text-[var(--ice-white)]">Ronda {d.round}</span>
                      <Badge variant="outline" className={`text-xs ${dlvColors[d.status] || ""}`}>{dlvLabels[d.status] || d.status}</Badge>
                      <span className="text-xs text-[rgba(245,246,252,0.3)] ml-auto">{fmt(d.createdAt)}</span>
                    </div>
                    {d.notes && <p className="text-xs text-[rgba(245,246,252,0.6)] mb-1">{d.notes}</p>}
                    {d.fileUrl && <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3" />{d.fileName || "Archivo"}</a>}
                    {d.pmFeedback && <p className="text-xs text-blue-400 mt-1"><span className="font-medium">PM:</span> {d.pmFeedback}</p>}
                    {d.clientFeedback && <p className="text-xs text-purple-400 mt-1"><span className="font-medium">Cliente:</span> {d.clientFeedback}</p>}
                  </div>
                ))}
              </div>
            )}
            <div className="border-t border-[rgba(245,246,252,0.1)] pt-4 space-y-2">
              <p className="text-xs font-medium text-[rgba(245,246,252,0.5)]">Subir entrega</p>
              <input type="text" value={dlvUrl} onChange={(e) => setDlvUrl(e.target.value)} placeholder="URL del archivo" className={inp} />
              <input type="text" value={dlvName} onChange={(e) => setDlvName(e.target.value)} placeholder="Nombre del archivo" className={inp} />
              <textarea value={dlvNotes} onChange={(e) => setDlvNotes(e.target.value)} placeholder="Notas (opcional)" className={txa} rows={2} />
              <Button onClick={submitDelivery} disabled={uploading || !dlvUrl.trim()} className={goldBtn} size="sm">
                <Upload className="w-3 h-3 mr-1" />{uploading ? "Subiendo..." : "Subir entrega"}
              </Button>
            </div>
          </CardContent></Card>
        </div>

        {/* Sidebar */}
        <div className="md:w-1/3 space-y-4">
          <Card className={crd}><CardContent className="py-4 space-y-4">
            <div><p className={lbl}>Estado</p><Badge variant="outline" className={`mt-1 ${ticketStatusColors[t.status] || ""}`}>{ticketStatusLabels[t.status] || t.status}</Badge></div>
            <div><p className={lbl}>Prioridad</p><span className={`text-sm ${priorityColors[t.priority] || ""}`}>{priorityLabels[t.priority] || t.priority}</span></div>
            <div><p className={lbl}>Servicio</p><p className={val}>{t.serviceName}</p><p className="text-xs text-[rgba(245,246,252,0.4)]">{t.variantName}</p></div>
            <div><p className={lbl}>Cliente</p><p className={val}>{t.clientName}</p>{t.businessName && <p className="text-xs text-[rgba(245,246,252,0.4)]">{t.businessName}</p>}</div>
          </CardContent></Card>

          <Card className={crd}><CardContent className="py-4 space-y-3">
            <p className={`${secHdr} mb-1`}>Fechas</p>
            {t.assignedAt && <div><p className={lbl}>Asignado</p><p className="text-xs text-[var(--ice-white)]">{fmtD(t.assignedAt)}</p></div>}
            {t.startedAt && <div><p className={lbl}>Iniciado</p><p className="text-xs text-[var(--ice-white)]">{fmtD(t.startedAt)}</p></div>}
            {t.deliveredAt && <div><p className={lbl}>Entregado</p><p className="text-xs text-[var(--ice-white)]">{fmtD(t.deliveredAt)}</p></div>}
            {t.completedAt && <div><p className={lbl}>Completado</p><p className="text-xs text-[var(--ice-white)]">{fmtD(t.completedAt)}</p></div>}
            <div><p className={lbl}>Entregas</p><p className="text-xs text-[var(--ice-white)]">{t.deliveries.length}</p></div>
          </CardContent></Card>
        </div>
      </div>
    </div>
  );
}
