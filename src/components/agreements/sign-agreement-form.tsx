"use client";

import { useState } from "react";

export function SignAgreementForm({ token }: { token: string }) {
  const [name, setName] = useState("");
  const [requestedDate, setRequestedDate] = useState("");
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!agree) return setError("Please check the box to agree.");
    if (name.trim().length < 2) return setError("Please type your full name.");
    setSubmitting(true);
    try {
      const res = await fetch("/api/agreements/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, signerName: name, requestedDate: requestedDate || null, agree }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Something went wrong.");
        setSubmitting(false);
        return;
      }
      setDone(true);
    } catch {
      setError("Network error — please try again.");
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-lg border border-[#FFC919]/40 bg-[#FFC919]/10 p-6 text-center">
        <p className="text-lg font-semibold text-[#FFC919]">Agreement signed ✓</p>
        <p className="mt-2 text-sm opacity-80">
          Thank you, {name}. A confirmation has been emailed to you and our team has been notified. You can close this page.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium opacity-80">Requested completion date</label>
        <input
          type="date"
          min={today}
          value={requestedDate}
          onChange={(e) => setRequestedDate(e.target.value)}
          className="mt-1 w-full rounded-md border border-white/20 bg-transparent px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs opacity-60">Optional — the date you&apos;d like this completed by.</p>
      </div>

      <div>
        <label className="block text-sm font-medium opacity-80">Type your full name to sign</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full legal name"
          className="mt-1 w-full rounded-md border border-white/20 bg-transparent px-3 py-2 text-sm"
        />
      </div>

      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1" />
        <span className="opacity-80">
          By typing my name and checking this box, I agree to this service agreement and intend it to be my electronic
          signature, legally binding under applicable e-signature law (ESIGN/UETA).
        </span>
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-[#FFC919] px-4 py-3 text-sm font-bold text-[#130A06] transition hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "Signing…" : "Sign agreement"}
      </button>
    </form>
  );
}
