"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Send, Check, Pencil, X, CreditCard, Calendar,
  User, Download, Loader2, FileText, ExternalLink,
} from "lucide-react";
import {
  ticketStatusLabels, ticketStatusColors, freelancerRoleLabels, categoryColors,
} from "@/lib/status-labels";
import { getGoogleDrivePreview } from "@/lib/file-preview";

interface TicketData {
  id: string; number: number; status: string;
  serviceName: string; serviceCategory: string; variantName: string;
  creditsCharged: number; summary: string | null;
  briefDetails: Record<string, string> | null;
  clientNotes: string | null;
  freelancerName: string | null; freelancerRole: string | null;
  createdAt: string; updatedAt: string;
}

interface Message {
  id: string; senderRole: string; content: string; createdAt: string;
  attachments: { name: string; url: string }[];
}

interface Delivery {
  id: string; round: number; status: string; notes: string | null;
  fileUrl: string | null; fileName: string | null;
  clientFeedback: string | null; createdAt: string;
}

const detailLabels: Record<string, string> = {
  deliverable: "Entregable", style: "Estilo", content: "Contenido",
  deadline: "Plazo", extras: "Notas",
};

const deliveryStatusLabels: Record<string, string> = {
  PENDING_REVIEW: "Pendiente", PM_APPROVED: "Aprobado por PM",
  SENT_TO_CLIENT: "Enviado", CLIENT_APPROVED: "Aprobado",
  REVISION_REQUESTED: "Revisión solicitada",
};

const deliveryStatusColors: Record<string, string> = {
  PENDING_REVIEW: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  PM_APPROVED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  SENT_TO_CLIENT: "bg-green-500/20 text-green-400 border-green-500/30",
  CLIENT_APPROVED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  REVISION_REQUESTED: "bg-red-500/20 text-red-400 border-red-500/30",
};

export function TicketDetailClient({
  ticket, messages: initialMessages, deliveries,
}: {
  ticket: TicketData; messages: Message[]; deliveries: Delivery[];
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState("");
  const [showRevision, setShowRevision] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((prev) => [...prev, {
          id: data.message.id,
          senderRole: "CLIENT",
          content: data.message.content,
          createdAt: data.message.createdAt || new Date().toISOString(),
          attachments: [],
        }]);
        setNewMessage("");
      }
    } catch { setError("No se pudo enviar el mensaje"); } finally { setSending(false); }
  };

  const [confirmApprove, setConfirmApprove] = useState(false);

  const handleApprove = async () => {
    setActing(true); setError("");
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/approve`, { method: "POST" });
      if (res.ok) window.location.reload();
      else { const d = await res.json(); setError(d.error); }
    } catch { setError("Error de conexión"); } finally { setActing(false); setConfirmApprove(false); }
  };

  const handleRevision = async () => {
    if (!revisionFeedback.trim()) return;
    setActing(true); setError("");
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/revision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: revisionFeedback.trim() }),
      });
      if (res.ok) { setShowRevision(false); window.location.reload(); }
      else { const d = await res.json(); setError(d.error); }
    } catch { setError("Error de conexión"); } finally { setActing(false); }
  };

  const handleCancel = async () => {
    setActing(true); setError("");
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/cancel`, { method: "POST" });
      if (res.ok) window.location.reload();
      else { const d = await res.json(); setError(d.error); }
    } catch { setError("Error de conexión"); } finally { setActing(false); setShowCancel(false); }
  };

  // I5: only SENT_TO_CLIENT is approvable by client
  const canApprove = ticket.status === "DELIVERED" && deliveries.some((d) => d.status === "SENT_TO_CLIENT");
  const canCancel = ["NEW", "REVIEWING"].includes(ticket.status);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/tickets" className="flex items-center gap-1 text-[rgba(245,246,252,0.4)] hover:text-[var(--gold-bar)]">
          <ArrowLeft className="h-4 w-4" /> Mis Solicitudes
        </Link>
        <span className="text-[rgba(245,246,252,0.3)]">/</span>
        <span className="text-[var(--ice-white)]">#{String(ticket.number).padStart(3, "0")}</span>
      </div>

      {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-3">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main column */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge className={ticketStatusColors[ticket.status] || ""}>
                {ticketStatusLabels[ticket.status] || ticket.status}
              </Badge>
              <Badge className={categoryColors[ticket.serviceCategory] || ""}>
                {ticket.serviceCategory}
              </Badge>
            </div>
            <h1 className="font-[var(--font-lexend)] text-xl font-bold text-[var(--ice-white)]">
              {ticket.variantName}
            </h1>
            <p className="text-sm text-[rgba(245,246,252,0.5)]">{ticket.serviceName}</p>
          </div>

          {/* Brief */}
          <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
            <CardHeader><CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)] text-base">Brief</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {ticket.summary && <p className="text-sm text-[rgba(245,246,252,0.7)]">{ticket.summary}</p>}
              {ticket.briefDetails && Object.entries(ticket.briefDetails)
                .filter(([k, v]) => v && k !== "pmAlert")
                .map(([k, v]) => (
                  <div key={k}>
                    <span className="text-xs text-[rgba(245,246,252,0.4)]">{detailLabels[k] || k}: </span>
                    <span className="text-sm text-[rgba(245,246,252,0.6)]">{v}</span>
                  </div>
                ))}
              {ticket.clientNotes && !ticket.summary && (
                <p className="text-sm text-[rgba(245,246,252,0.6)]">{ticket.clientNotes}</p>
              )}
            </CardContent>
          </Card>

          {/* Deliveries */}
          {deliveries.length > 0 && (
            <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
              <CardHeader><CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)] text-base">Entregas</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {deliveries.map((d: any) => (
                  <div key={d.id} className="border border-[rgba(245,246,252,0.06)] p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[var(--ice-white)]">Ronda #{d.round}</span>
                      <Badge className={`text-xs ${deliveryStatusColors[d.status] || "bg-[rgba(255,255,255,0.05)] text-[rgba(245,246,252,0.6)] border-[rgba(245,246,252,0.1)]"}`}>
                        {deliveryStatusLabels[d.status] || d.status}
                      </Badge>
                    </div>
                    {d.notes && <p className="text-xs text-[rgba(245,246,252,0.5)] mb-2">{d.notes}</p>}
                    {d.fileUrl && (
                      <div>
                        <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[var(--gold-bar)] hover:underline text-xs">
                          <ExternalLink className="h-3 w-3" /> {d.fileName || "Abrir recurso"}
                        </a>
                        {getGoogleDrivePreview(d.fileUrl) && (
                          <img src={getGoogleDrivePreview(d.fileUrl)!} alt="Preview" className="mt-2 max-w-[200px] opacity-80 rounded" />
                        )}
                      </div>
                    )}
                    {d.clientFeedback && (
                      <div className="mt-2 bg-[rgba(255,255,255,0.02)] p-2 text-xs text-[rgba(245,246,252,0.5)]">
                        Tu feedback: {d.clientFeedback}
                      </div>
                    )}
                  </div>
                ))}

                {/* Approval actions */}
                {canApprove && !showRevision && !confirmApprove && (
                  <div className="flex gap-2">
                    <Button onClick={() => setConfirmApprove(true)} className="bg-green-600 text-white hover:bg-green-700 font-bold text-sm flex-1">
                      <Check className="h-4 w-4 mr-1" /> Aprobar entrega
                    </Button>
                    <Button onClick={() => setShowRevision(true)} variant="outline" className="border-[rgba(245,246,252,0.2)] text-[var(--ice-white)] text-sm flex-1">
                      <Pencil className="h-4 w-4 mr-1" /> Pedir revisión
                    </Button>
                  </div>
                )}
                {confirmApprove && (
                  <div className="bg-green-500/10 border border-green-500/20 p-3 space-y-2">
                    <p className="text-xs text-green-400">¿Confirmas que apruebas esta entrega? El ticket se marcará como completado.</p>
                    <div className="flex gap-2">
                      <Button onClick={handleApprove} disabled={acting} className="flex-1 bg-green-600 text-white hover:bg-green-700 text-sm disabled:opacity-50">
                        {acting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Sí, aprobar"}
                      </Button>
                      <Button onClick={() => setConfirmApprove(false)} variant="outline" className="flex-1 border-[rgba(245,246,252,0.2)] text-[var(--ice-white)] text-sm">
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
                {showRevision && (
                  <div className="space-y-2">
                    <textarea
                      value={revisionFeedback}
                      onChange={(e) => setRevisionFeedback(e.target.value)}
                      placeholder="¿Qué ajustes necesitas?"
                      rows={3}
                      className="w-full border border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)] p-2 text-sm resize-none"
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleRevision} disabled={acting || !revisionFeedback.trim()} className="bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold text-sm disabled:opacity-50">
                        {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar revisión"}
                      </Button>
                      <Button onClick={() => setShowRevision(false)} variant="outline" className="border-[rgba(245,246,252,0.2)] text-[var(--ice-white)] text-sm">
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Messages */}
          <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
            <CardHeader><CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)] text-base">Mensajes</CardTitle></CardHeader>
            <CardContent>
              <div ref={scrollRef} className="space-y-3 max-h-80 overflow-y-auto mb-4">
                {messages.length === 0 && (
                  <p className="text-sm text-[rgba(245,246,252,0.4)] text-center py-4">
                    Tu PM se pondrá en contacto pronto.
                  </p>
                )}
                {messages.map((m: any) => (
                  <div key={m.id} className={`flex ${m.senderRole === "CLIENT" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] px-3 py-2 text-sm ${
                      m.senderRole === "CLIENT"
                        ? "bg-[var(--gold-bar)] text-[var(--asphalt-black)]"
                        : "bg-[#1a1a1a] text-[var(--ice-white)] border border-[rgba(245,246,252,0.08)]"
                    }`}>
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      <p className={`text-[10px] mt-1 ${m.senderRole === "CLIENT" ? "text-[rgba(19,10,6,0.5)]" : "text-[rgba(245,246,252,0.3)]"}`}>
                        {new Date(m.createdAt).toLocaleString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                      {m.attachments.map((a: any) => (
                        <a key={a.url} href={a.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs mt-1 underline">
                          <FileText className="h-3 w-3" /> {a.name}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Send message */}
              {!["COMPLETED", "CANCELED"].includes(ticket.status) && (
                <div className="flex gap-2">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    rows={1}
                    className="flex-1 border border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)] px-3 py-2 text-sm resize-none"
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  />
                  <Button onClick={sendMessage} disabled={sending || !newMessage.trim()} className="bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 px-3 disabled:opacity-50">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
            <CardContent className="py-4 space-y-3">
              <div className="text-center">
                <Badge className={`text-sm px-3 py-1 ${ticketStatusColors[ticket.status] || ""}`}>
                  {ticketStatusLabels[ticket.status] || ticket.status}
                </Badge>
              </div>
              <Separator className="bg-[rgba(245,246,252,0.06)]" />
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-[rgba(245,246,252,0.5)]">
                  <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" /> Créditos</span>
                  <span className="text-[var(--gold-bar)] font-bold">{ticket.creditsCharged}</span>
                </div>
                <div className="flex items-center justify-between text-[rgba(245,246,252,0.5)]">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Creado</span>
                  <span className="text-[var(--ice-white)]">{new Date(ticket.createdAt).toLocaleDateString("es-MX")}</span>
                </div>
                <div className="flex items-center justify-between text-[rgba(245,246,252,0.5)]">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Actualizado</span>
                  <span className="text-[var(--ice-white)]">{new Date(ticket.updatedAt).toLocaleDateString("es-MX")}</span>
                </div>
                <Separator className="bg-[rgba(245,246,252,0.06)]" />
                <div className="flex items-center gap-2 text-[rgba(245,246,252,0.5)]">
                  <User className="h-3 w-3" />
                  {ticket.freelancerName ? (
                    <span className="text-[var(--ice-white)]">
                      {ticket.freelancerName}
                      {ticket.freelancerRole ? ` (${freelancerRoleLabels[ticket.freelancerRole] || ticket.freelancerRole})` : ""}
                    </span>
                  ) : (
                    <span>Pendiente de asignación</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cancel button */}
          {canCancel && (
            <div>
              {!showCancel ? (
                <Button onClick={() => setShowCancel(true)} variant="outline" className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm">
                  <X className="h-4 w-4 mr-1" /> Cancelar solicitud
                </Button>
              ) : (
                <Card className="border-red-500/20 bg-red-500/5">
                  <CardContent className="py-3 space-y-2">
                    <p className="text-xs text-red-400">¿Seguro? Los créditos no se reembolsan.</p>
                    <div className="flex gap-2">
                      <Button onClick={handleCancel} disabled={acting} className="flex-1 bg-red-600 text-white hover:bg-red-700 text-sm disabled:opacity-50">
                        {acting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Sí, cancelar"}
                      </Button>
                      <Button onClick={() => setShowCancel(false)} variant="outline" className="flex-1 border-[rgba(245,246,252,0.2)] text-[var(--ice-white)] text-sm">
                        No
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
