"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Send, Upload, ExternalLink, UserPlus, Save, Clock, AlertTriangle, DollarSign } from "lucide-react";
import { ticketStatusLabels, ticketStatusColors, priorityLabels, priorityColors, freelancerRoleLabels, categoryLabels } from "@/lib/status-labels";
import { getGoogleDrivePreview } from "@/lib/file-preview";

interface TicketData {
  id: string; number: number; status: string; priority: string; creditsCharged: number;
  clientNotes: string | null; pmNotes: string | null; briefStructured: Record<string, unknown> | null;
  createdAt: string; updatedAt: string; assignedAt: string | null; startedAt: string | null;
  deliveredAt: string | null; completedAt: string | null;
  user: { name: string; email: string; businessName: string | null; plan: string | null };
  service: { name: string; slug: string; category: string };
  variant: { name: string };
  freelancer: { id: string; name: string; email: string; role: string } | null;
  messages: { id: string; content: string; senderRole: string; senderName: string; isInternal: boolean; createdAt: string }[];
  deliveries: { id: string; round: number; status: string; notes: string | null; fileUrl: string | null; fileName: string | null; pmApproved: boolean; clientApproved: boolean; pmFeedback: string | null; clientFeedback: string | null; createdAt: string }[];
  files: { id: string; name: string; url: string; type: string }[];
  surcharges: { id: string; amount: number; reason: string; createdAt: string }[];
}
interface Freelancer { id: string; name: string; role: string; skills: string[]; skillTags: string[]; currentLoad: number; clientCapacity: number }

const ALL_STATUS = ["NEW","REVIEWING","ASSIGNED","IN_PROGRESS","DELIVERED","REVISION","COMPLETED","CANCELED"];
const dlvLabels: Record<string, string> = { PENDING_REVIEW: "Pendiente", PM_APPROVED: "Aprobada PM", SENT_TO_CLIENT: "Enviada", CLIENT_APPROVED: "Aprobada cliente", REVISION_REQUESTED: "Revisión" };
const dlvColors: Record<string, string> = { PENDING_REVIEW: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", PM_APPROVED: "bg-blue-500/20 text-blue-400 border-blue-500/30", SENT_TO_CLIENT: "bg-green-500/20 text-green-400 border-green-500/30", CLIENT_APPROVED: "bg-green-500/20 text-green-400 border-green-500/30", REVISION_REQUESTED: "bg-red-500/20 text-red-400 border-red-500/30" };

const sel = "h-9 w-full rounded-md border border-[rgba(245,246,252,0.2)] bg-[#1a1108] px-3 text-sm text-[var(--ice-white)] [&_option]:bg-[#1a1108] [&_option]:text-[var(--ice-white)]";
const inp = "w-full rounded-md border border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-sm text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)] focus:outline-none focus:ring-1 focus:ring-[var(--gold-bar)]";
const txa = `${inp} min-h-[72px] resize-y`;
const crd = "border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]";
const lbl = "text-xs font-medium text-[rgba(245,246,252,0.5)]";
const val = "text-sm text-[var(--ice-white)]";
const sub = "text-sm text-[rgba(245,246,252,0.5)]";
const goldBtn = "bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold text-xs";
const outBtn = "border-[rgba(245,246,252,0.2)] text-[var(--ice-white)] hover:bg-[rgba(255,255,255,0.05)] text-xs";
const secHdr = "font-[var(--font-lexend)] text-xs text-[rgba(245,246,252,0.5)] uppercase tracking-wider";

const fmt = (iso: string) => new Date(iso).toLocaleString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const fmtS = (iso: string) => new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });

export function TicketAdminClient({ ticket: t, availableFreelancers }: { ticket: TicketData; availableFreelancers: Freelancer[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [clientMsg, setClientMsg] = useState("");
  const [internalMsg, setInternalMsg] = useState("");
  const [showDlv, setShowDlv] = useState(false);
  const [dlvUrl, setDlvUrl] = useState("");
  const [dlvName, setDlvName] = useState("");
  const [dlvNotes, setDlvNotes] = useState("");
  const [pmNotes, setPmNotes] = useState(t.pmNotes || "");
  const [showAssign, setShowAssign] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [showSurcharge, setShowSurcharge] = useState<"recargo" | "reembolso" | null>(null);
  const [surAmt, setSurAmt] = useState("");
  const [surReason, setSurReason] = useState("");

  async function api(url: string, opts: RequestInit) {
    setError(""); setSaving(true);
    try {
      const res = await fetch(url, { ...opts, headers: { "Content-Type": "application/json" } });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || "Error en la operación"); return null; }
      router.refresh();
      return await res.json();
    } catch (e: any) { setError("Error de red"); return null; } finally { setSaving(false); }
  }

  const changeStatus = (status: string) => api(`/api/admin/tickets/${t.id}/status`, { method: "POST", body: JSON.stringify({ status }) });

  const sendMessage = async (isInternal: boolean) => {
    const content = (isInternal ? internalMsg : clientMsg).trim();
    if (!content) return;
    const r = await api(`/api/admin/tickets/${t.id}/message`, { method: "POST", body: JSON.stringify({ content, isInternal }) });
    if (r) { isInternal ? setInternalMsg("") : setClientMsg(""); }
  };

  const createDelivery = async () => {
    const r = await api(`/api/admin/tickets/${t.id}/delivery`, { method: "POST", body: JSON.stringify({ fileUrl: dlvUrl || null, fileName: dlvName || null, notes: dlvNotes || null }) });
    if (r) { setDlvUrl(""); setDlvName(""); setDlvNotes(""); setShowDlv(false); }
  };

  const sendToClient = (deliveryId: string) => api(`/api/admin/tickets/${t.id}/send-to-client`, { method: "POST", body: JSON.stringify({ deliveryId }) });
  const savePmNotes = () => api(`/api/admin/tickets/${t.id}/notes`, { method: "PATCH", body: JSON.stringify({ pmNotes }) });

  const handleAssign = async (freelancerId: string) => {
    setAssigning(true);
    const r = await api(`/api/admin/tickets/${t.id}/assign`, { method: "POST", body: JSON.stringify({ freelancerId }) });
    setAssigning(false);
    if (r) setShowAssign(false);
  };

  const submitSurcharge = async () => {
    const amount = showSurcharge === "reembolso" ? -Math.abs(Number(surAmt)) : Math.abs(Number(surAmt));
    if (!amount || !surReason.trim()) return;
    const endpoint = showSurcharge === "reembolso" ? `/api/admin/tickets/${t.id}/refund` : `/api/admin/tickets/${t.id}/surcharge`;
    const r = await api(endpoint, { method: "POST", body: JSON.stringify({ amount: Math.abs(Number(surAmt)), reason: surReason.trim() }) });
    if (r) { setSurAmt(""); setSurReason(""); setShowSurcharge(null); }
  };

  const isPmAlert = t.pmNotes && (t.pmNotes.startsWith("[AUTO]") || t.pmNotes.startsWith("[SYSTEM]") || t.pmNotes.includes("alerta"));
  const briefEntries = t.briefStructured ? Object.entries(t.briefStructured).filter(([k]: any) => k !== "pmAlert") : [];

  return (
    <div className="space-y-4">
      <Link href="/admin/tickets">
        <Button variant="ghost" size="sm" className="text-[rgba(245,246,252,0.5)] hover:text-[var(--ice-white)] hover:bg-[rgba(255,255,255,0.05)]">
          <ArrowLeft className="h-4 w-4 mr-1" /> Tickets
        </Button>
      </Link>

      {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md p-3">{error}</div>}

      <div className="flex flex-col md:flex-row gap-4">
        {/* MAIN COLUMN */}
        <div className="md:w-2/3 space-y-4">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-[var(--font-lexend)] text-xl font-bold text-[var(--ice-white)]">#{t.number}</h1>
            <span className="text-[rgba(245,246,252,0.7)] text-sm">{t.service.name} &middot; {t.variant.name}</span>
            <Badge className={ticketStatusColors[t.status] || ""}>{ticketStatusLabels[t.status] || t.status}</Badge>
            <span className={`text-sm font-medium ${priorityColors[t.priority] || ""}`}>{priorityLabels[t.priority] || t.priority}</span>
          </div>

          {isPmAlert && (
            <div className="flex items-start gap-2 rounded-md bg-yellow-500/10 border border-yellow-500/20 p-3 text-sm text-yellow-400">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Nota del sistema: {t.pmNotes}</span>
            </div>
          )}

          {/* Brief */}
          {(briefEntries.length > 0 || t.clientNotes) && (
            <Card className={crd}>
              <CardHeader className="pb-2"><CardTitle className="font-[var(--font-lexend)] text-sm text-[var(--ice-white)]">Brief</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {briefEntries.map(([key, v]: any) => (
                  <div key={key}><span className={lbl}>{key}: </span><span className="text-[rgba(245,246,252,0.8)]">{typeof v === "string" ? v : JSON.stringify(v)}</span></div>
                ))}
                {t.clientNotes && (<><Separator className="bg-[rgba(245,246,252,0.1)]" /><div><span className={lbl}>Notas del cliente: </span><span className="text-[rgba(245,246,252,0.8)]">{t.clientNotes}</span></div></>)}
              </CardContent>
            </Card>
          )}

          {/* Messages */}
          <Card className={crd}>
            <CardHeader className="pb-2"><CardTitle className="font-[var(--font-lexend)] text-sm text-[var(--ice-white)]">Mensajes</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {t.messages.length === 0 && <p className={sub}>Sin mensajes aún</p>}
              {t.messages.map((m: any) => {
                const border = m.isInternal ? "" : m.senderRole === "CLIENT" ? "border-l-2 border-l-[var(--gold-bar)]" : "border-l-2 border-l-blue-500";
                return (
                  <div key={m.id} className={`rounded-md p-3 ${border} ${m.isInternal ? "bg-[rgba(255,255,255,0.05)]" : ""}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-[var(--ice-white)]">{m.senderName}</span>
                      {m.isInternal && <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-[10px] px-1.5">Interno</Badge>}
                      <span className="text-[10px] text-[rgba(245,246,252,0.4)] ml-auto">{fmt(m.createdAt)}</span>
                    </div>
                    <p className="text-sm text-[rgba(245,246,252,0.8)] whitespace-pre-wrap">{m.content}</p>
                  </div>
                );
              })}
              <Separator className="bg-[rgba(245,246,252,0.1)]" />
              <div className="space-y-2">
                <label className={lbl}>Mensaje al cliente</label>
                <textarea className={txa} value={clientMsg} onChange={(e) => setClientMsg(e.target.value)} placeholder="Escribe un mensaje visible para el cliente..." />
                <Button size="sm" disabled={saving || !clientMsg.trim()} onClick={() => sendMessage(false)} className={`${goldBtn} gap-1`}><Send className="h-3 w-3" /> Enviar</Button>
              </div>
              <div className="space-y-2 rounded-md bg-[rgba(255,255,255,0.05)] p-3">
                <label className={lbl}>Nota interna <span className="ml-2 text-[rgba(245,246,252,0.3)]">Solo visible para el equipo</span></label>
                <textarea className={txa} value={internalMsg} onChange={(e) => setInternalMsg(e.target.value)} placeholder="Nota interna..." />
                <Button size="sm" variant="outline" disabled={saving || !internalMsg.trim()} onClick={() => sendMessage(true)} className={`${outBtn} gap-1`}><Send className="h-3 w-3" /> Enviar nota</Button>
              </div>
            </CardContent>
          </Card>

          {/* Deliveries */}
          <Card className={crd}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="font-[var(--font-lexend)] text-sm text-[var(--ice-white)]">Entregas</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setShowDlv(!showDlv)} className={`${outBtn} gap-1`}><Upload className="h-3 w-3" /> Subir entrega</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {showDlv && (
                <div className="space-y-2 rounded-md border border-[rgba(245,246,252,0.1)] p-3">
                  <input className={inp} placeholder="URL del archivo" value={dlvUrl} onChange={(e) => setDlvUrl(e.target.value)} />
                  <input className={inp} placeholder="Nombre del archivo" value={dlvName} onChange={(e) => setDlvName(e.target.value)} />
                  <textarea className={txa} placeholder="Notas de la entrega" value={dlvNotes} onChange={(e) => setDlvNotes(e.target.value)} />
                  <Button size="sm" disabled={saving} onClick={createDelivery} className={goldBtn}>Crear entrega</Button>
                </div>
              )}
              {t.deliveries.length === 0 && !showDlv && <p className={sub}>Sin entregas aún</p>}
              {t.deliveries.map((d: any) => (
                <div key={d.id} className="rounded-md border border-[rgba(245,246,252,0.1)] p-3 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-[var(--ice-white)]">Ronda {d.round}</span>
                    <Badge className={dlvColors[d.status] || ""}>{dlvLabels[d.status] || d.status}</Badge>
                    <span className="text-[10px] text-[rgba(245,246,252,0.4)] ml-auto">{fmt(d.createdAt)}</span>
                  </div>
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
                  {d.notes && <p className="text-xs text-[rgba(245,246,252,0.7)]">{d.notes}</p>}
                  {d.pmFeedback && <p className="text-xs text-[rgba(245,246,252,0.5)]"><span className="font-medium">PM:</span> {d.pmFeedback}</p>}
                  {d.clientFeedback && <p className="text-xs text-[rgba(245,246,252,0.5)]"><span className="font-medium">Cliente:</span> {d.clientFeedback}</p>}
                  {d.status === "PENDING_REVIEW" && <Button size="sm" disabled={saving} onClick={() => sendToClient(d.id)} className={`${goldBtn} gap-1`}><Send className="h-3 w-3" /> Enviar al cliente</Button>}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* SIDEBAR */}
        <div className="md:w-1/3 space-y-4">
          <Card className={crd}>
            <CardContent className="pt-4 space-y-3">
              <div>
                <label className={lbl}>Estado</label>
                <select className={sel} value={t.status} onChange={(e) => changeStatus(e.target.value)} disabled={saving}>
                  {ALL_STATUS.map((s: any) => <option key={s} value={s}>{ticketStatusLabels[s] || s}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Prioridad</label>
                <p className={`text-sm font-medium ${priorityColors[t.priority] || ""}`}>{priorityLabels[t.priority] || t.priority}</p>
              </div>
              <Separator className="bg-[rgba(245,246,252,0.1)]" />
              <div>
                <label className={lbl}>Servicio</label>
                <p className={val}>{t.service.name}</p>
                <p className={sub}>{t.variant.name} &middot; {categoryLabels[t.service.category] || t.service.category}</p>
              </div>
              <div><label className={lbl}>Créditos</label><p className={val}>{t.creditsCharged}</p></div>
            </CardContent>
          </Card>

          <Card className={crd}>
            <CardHeader className="pb-2"><CardTitle className={secHdr}>Cliente</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              <p className={val}>{t.user.name}</p>
              <p className={sub}>{t.user.email}</p>
              {t.user.businessName && <p className={sub}>{t.user.businessName}</p>}
              {t.user.plan && <p className="text-xs text-[var(--gold-bar)]">Plan: {t.user.plan}</p>}
            </CardContent>
          </Card>

          <Card className={crd}>
            <CardHeader className="pb-2"><CardTitle className={secHdr}>Freelancer</CardTitle></CardHeader>
            <CardContent>
              {t.freelancer ? (
                <div className="space-y-1">
                  <p className={val}>{t.freelancer.name}</p>
                  <p className={sub}>{t.freelancer.email}</p>
                  <p className={sub}>{freelancerRoleLabels[t.freelancer.role] || t.freelancer.role}</p>
                </div>
              ) : (
                <Button size="sm" onClick={() => setShowAssign(true)} className={`${goldBtn} gap-1`}><UserPlus className="h-3 w-3" /> Asignar freelancer</Button>
              )}
            </CardContent>
          </Card>

          <Card className={crd}>
            <CardHeader className="pb-2"><CardTitle className={secHdr}>Notas PM</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <textarea className={txa} value={pmNotes} onChange={(e) => setPmNotes(e.target.value)} placeholder="Notas internas del PM..." />
              <Button size="sm" variant="outline" disabled={saving} onClick={savePmNotes} className={`${outBtn} gap-1`}><Save className="h-3 w-3" /> Guardar</Button>
            </CardContent>
          </Card>

          <Card className={crd}>
            <CardHeader className="pb-2"><CardTitle className={secHdr}>Ajustes</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowSurcharge(showSurcharge === "recargo" ? null : "recargo")} className={`${outBtn} gap-1`}><DollarSign className="h-3 w-3" /> Recargo</Button>
                <Button size="sm" variant="outline" onClick={() => setShowSurcharge(showSurcharge === "reembolso" ? null : "reembolso")} className={`${outBtn} gap-1`}><DollarSign className="h-3 w-3" /> Reembolso</Button>
              </div>
              {showSurcharge && (
                <div className="space-y-2 rounded-md border border-[rgba(245,246,252,0.1)] p-2">
                  <label className={lbl}>{showSurcharge === "recargo" ? "Recargo" : "Reembolso"}</label>
                  <input type="number" className={inp} placeholder="Monto (créditos)" value={surAmt} onChange={(e) => setSurAmt(e.target.value)} />
                  <input className={inp} placeholder="Razón" value={surReason} onChange={(e) => setSurReason(e.target.value)} />
                  <Button size="sm" disabled={saving || !surAmt || !surReason.trim()} onClick={submitSurcharge} className={goldBtn}>Aplicar</Button>
                </div>
              )}
              {t.surcharges.length > 0 && (
                <div className="space-y-1 pt-1">
                  {t.surcharges.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between text-xs">
                      <span className={s.amount > 0 ? "text-red-400" : "text-green-400"}>{s.amount > 0 ? "+" : ""}{s.amount} cr</span>
                      <span className="text-[rgba(245,246,252,0.5)] truncate max-w-[120px]" title={s.reason}>{s.reason}</span>
                      <span className="text-[rgba(245,246,252,0.3)]">{fmtS(s.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={crd}>
            <CardHeader className="pb-2"><CardTitle className={secHdr}>Fechas</CardTitle></CardHeader>
            <CardContent className="space-y-1.5">
              {([["Creado", t.createdAt], ["Asignado", t.assignedAt], ["Iniciado", t.startedAt], ["Entregado", t.deliveredAt], ["Completado", t.completedAt]] as [string, string | null][])
                .filter(([, v]: any) => v)
                .map(([label, v]: any) => (
                  <div key={label} className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-[rgba(245,246,252,0.3)]" />
                    <span className="text-xs text-[rgba(245,246,252,0.5)]">{label}:</span>
                    <span className="text-xs text-[var(--ice-white)]">{fmtS(v)}</span>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assign Dialog */}
      <Dialog open={showAssign} onOpenChange={(open) => !open && setShowAssign(false)}>
        <DialogContent className="border-[rgba(245,246,252,0.1)] bg-[var(--asphalt-black)] text-[var(--ice-white)] max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-[var(--font-lexend)]">Asignar Ticket #{t.number}</DialogTitle>
            <DialogDescription className="text-[rgba(245,246,252,0.5)]">{t.service.name} &mdash; {t.variant.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {availableFreelancers.length === 0 ? (
              <p className="text-sm text-[rgba(245,246,252,0.4)] text-center py-4">No hay freelancers disponibles</p>
            ) : availableFreelancers.map((f: any) => (
              <div key={f.id} className="flex items-center justify-between rounded-md border border-[rgba(245,246,252,0.1)] p-3 hover:bg-[rgba(255,255,255,0.03)]">
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--ice-white)]">{f.name}</p>
                  <p className="text-xs text-[rgba(245,246,252,0.5)]">{freelancerRoleLabels[f.role] || f.role} &middot; Carga: {f.currentLoad}/{f.clientCapacity}</p>
                  {f.skillTags.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {f.skillTags.map((tag: any) => <span key={tag} className="text-[10px] bg-[rgba(255,255,255,0.05)] text-[rgba(245,246,252,0.5)] px-1.5 py-0.5 rounded">{tag}</span>)}
                    </div>
                  )}
                </div>
                <Button size="sm" disabled={assigning} onClick={() => handleAssign(f.id)} className={`ml-3 ${goldBtn} h-7`}>Asignar</Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
