"use client";

import { useState } from "react";

type Agreement = {
  id: string;
  status: "DRAFT" | "SENT" | "SIGNED" | "DECLINED" | "EXPIRED";
  title: string;
  scope: string;
  deliverables: string[];
  method: string;
  timelineDays: number;
  priceCredits: number;
  token: string;
  signerName: string | null;
  signedAt: string | null;
  sentAt: string | null;
  requestedDate: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#9CA3AF",
  SENT: "#FFC919",
  SIGNED: "#34D399",
  DECLINED: "#F87171",
  EXPIRED: "#F87171",
};

export function AgreementAdminPanel({ agreement }: { agreement: Agreement | null }) {
  const [scope, setScope] = useState(agreement?.scope ?? "");
  const [deliverables, setDeliverables] = useState((agreement?.deliverables ?? []).join("\n"));
  const [method, setMethod] = useState(agreement?.method ?? "");
  const [timelineDays, setTimelineDays] = useState(agreement?.timelineDays ?? 1);
  const [status, setStatus] = useState(agreement?.status ?? "DRAFT");
  const [busy, setBusy] = useState<null | "save" | "send">(null);
  const [msg, setMsg] = useState<string | null>(null);

  if (!agreement) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-5 text-sm opacity-70">
        No service agreement on this request (created before agreements existed, or draft generation failed).
      </div>
    );
  }

  const signUrl = `https://node.nouvos.one/sign-agreement?token=${agreement.token}`;
  const locked = status === "SIGNED";

  async function save() {
    setBusy("save");
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/agreements/${agreement!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope,
          method,
          timelineDays: Number(timelineDays),
          deliverables: deliverables.split("\n").map((s) => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      setMsg(res.ok ? "Saved." : data?.error || "Save failed.");
    } catch {
      setMsg("Network error.");
    }
    setBusy(null);
  }

  async function send() {
    setBusy("send");
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/agreements/${agreement!.id}/send`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setStatus("SENT");
        setMsg("Sent to the client for signature.");
      } else {
        setMsg(data?.error || "Send failed.");
      }
    } catch {
      setMsg("Network error.");
    }
    setBusy(null);
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Service agreement</h3>
        <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ color: STATUS_COLORS[status], border: `1px solid ${STATUS_COLORS[status]}` }}>
          {status}
        </span>
      </div>

      {locked ? (
        <div className="mt-4 space-y-2 text-sm">
          <p className="opacity-80">Signed by <strong>{agreement.signerName}</strong>{agreement.signedAt ? ` on ${new Date(agreement.signedAt).toLocaleString()}` : ""}.</p>
          {agreement.requestedDate && <p className="opacity-70">Client requested by: {new Date(agreement.requestedDate).toLocaleDateString()}</p>}
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide opacity-50">Deliverables</p>
            <ul className="mt-1 list-disc pl-5 opacity-90">{agreement.deliverables.map((d, i) => <li key={i}>{d}</li>)}</ul>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-4 text-sm">
          <Field label="Scope (what will be provided)">
            <textarea value={scope} onChange={(e) => setScope(e.target.value)} rows={3} className="w-full rounded-md border border-white/20 bg-transparent px-3 py-2" />
          </Field>
          <Field label="Deliverables (one per line)">
            <textarea value={deliverables} onChange={(e) => setDeliverables(e.target.value)} rows={4} className="w-full rounded-md border border-white/20 bg-transparent px-3 py-2" />
          </Field>
          <Field label="How it will be provided">
            <textarea value={method} onChange={(e) => setMethod(e.target.value)} rows={2} className="w-full rounded-md border border-white/20 bg-transparent px-3 py-2" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Timeline (working days)">
              <input type="number" min={1} value={timelineDays} onChange={(e) => setTimelineDays(Number(e.target.value))} className="w-full rounded-md border border-white/20 bg-transparent px-3 py-2" />
            </Field>
            <Field label="Price">
              <p className="px-3 py-2 opacity-80">${agreement.priceCredits.toLocaleString()} ({agreement.priceCredits} cr)</p>
            </Field>
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={save} disabled={busy !== null} className="rounded-md border border-white/20 px-4 py-2 font-medium hover:bg-white/10 disabled:opacity-50">
              {busy === "save" ? "Saving…" : "Save draft"}
            </button>
            <button onClick={send} disabled={busy !== null} className="rounded-md bg-[#FFC919] px-4 py-2 font-bold text-[#130A06] hover:opacity-90 disabled:opacity-50">
              {busy === "send" ? "Sending…" : status === "SENT" ? "Resend to client" : "Send for signature"}
            </button>
          </div>

          {status === "SENT" && (
            <p className="break-all text-xs opacity-60">Sign link: <a href={signUrl} className="underline" target="_blank" rel="noreferrer">{signUrl}</a></p>
          )}
        </div>
      )}

      {msg && <p className="mt-3 text-xs text-[#FFC919]">{msg}</p>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide opacity-50">{label}</label>
      {children}
    </div>
  );
}
