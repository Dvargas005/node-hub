"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { categoryLabels, categoryColors } from "@/lib/status-labels";

interface SyncReport {
  id: string;
  data: any;
  appliedAt: string | null;
  createdAt: string;
}

interface PriceRow { service: string; variant: string; currentPrice: number; tigPrice: number; diff: number }
interface NewSuggestion { name: string; category: string; avgPrice: number; minPrice: number; maxPrice: number; sampleSize: number }

const crd = "border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]";
const goldBtn = "bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold";
const secHdr = "font-[var(--font-lexend)] text-sm text-[var(--ice-white)]";
const sub = "text-sm text-[rgba(245,246,252,0.5)]";
const thCls = "text-left text-xs font-medium text-[rgba(245,246,252,0.5)] pb-2";
const tdCls = "py-1.5 text-sm text-[var(--ice-white)]";

function fmt(iso: string) {
  return new Date(iso).toLocaleString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function SyncClient({ reports }: { reports: SyncReport[] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function handleSync() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/sync-tigrenator", { method: "POST" });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || "Error syncing"); return; }
      const data = await res.json();
      setResult(data);
    } catch { setError("Network error"); } finally { setLoading(false); }
  }

  const prices: PriceRow[] = result?.outdatedPrices || [];
  const suggestions: NewSuggestion[] = result?.newSuggestions || [];
  const noMatch: string[] = result?.noMatch || [];

  function reportSummary(r: SyncReport) {
    const d = r.data as any;
    return `${d?.outdatedPrices?.length || 0} precios, ${d?.newSuggestions?.length || 0} nuevos, ${d?.noMatch?.length || 0} sin match`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-[var(--font-lexend)] text-xl font-bold text-[var(--ice-white)]">Sync Tigrenator</h1>
        <Button onClick={handleSync} disabled={loading} className={`${goldBtn} gap-2`}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Sincronizando..." : "Sincronizar con Tigrenator"}
        </Button>
      </div>

      {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md p-3">{error}</div>}

      {result && (
        <div className="space-y-4">
          {/* Outdated Prices */}
          <Card className={crd}>
            <CardHeader className="pb-2"><CardTitle className={secHdr}>Precios desactualizados ({prices.length})</CardTitle></CardHeader>
            <CardContent>
              {prices.length === 0 ? <p className={sub}>All prices are up to date</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr><th className={thCls}>Servicio</th><th className={thCls}>Variante</th><th className={thCls}>Actual</th><th className={thCls}>Tigrenator</th><th className={thCls}>Diferencia</th></tr></thead>
                    <tbody>
                      {prices.map((p: any, i: number) => (
                        <tr key={i} className="border-t border-[rgba(245,246,252,0.05)]">
                          <td className={tdCls}>{p.service}</td>
                          <td className={tdCls}>{p.variant}</td>
                          <td className={tdCls}>{p.currentPrice}</td>
                          <td className={tdCls}>{p.tigPrice}</td>
                          <td className={`${tdCls} ${p.diff > 0 ? "text-green-400" : "text-red-400"}`}>{p.diff > 0 ? "+" : ""}{p.diff}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* New Suggestions */}
          <Card className={crd}>
            <CardHeader className="pb-2"><CardTitle className={secHdr}>Servicios nuevos sugeridos ({suggestions.length})</CardTitle></CardHeader>
            <CardContent>
              {suggestions.length === 0 ? <p className={sub}>No new suggestions</p> : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {suggestions.map((s: any, i: number) => (
                    <div key={i} className="rounded-md border border-[rgba(245,246,252,0.1)] p-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--ice-white)]">{s.name}</span>
                        <Badge className={categoryColors[s.category] || ""}>{categoryLabels[s.category] || s.category}</Badge>
                      </div>
                      <p className="text-xs text-[rgba(245,246,252,0.5)]">Avg: {s.avgPrice} cr &middot; Rango: {s.minPrice}-{s.maxPrice} cr &middot; Muestra: {s.sampleSize}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* No Match */}
          <Card className={crd}>
            <CardHeader className="pb-2"><CardTitle className={secHdr}>No match in Tigrenator ({noMatch.length})</CardTitle></CardHeader>
            <CardContent>
              {noMatch.length === 0 ? <p className={sub}>All services have a match</p> : (
                <ul className="space-y-1">
                  {noMatch.map((name: any, i: number) => <li key={i} className="text-sm text-[rgba(245,246,252,0.7)]">&bull; {name}</li>)}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* History */}
      <Card className={crd}>
        <CardHeader className="pb-2"><CardTitle className={secHdr}>Historial de syncs</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {reports.length === 0 ? <p className={sub}>No history</p> : reports.map((r: any) => (
            <div key={r.id} className="rounded-md border border-[rgba(245,246,252,0.05)] p-2">
              <button className="w-full flex items-center justify-between text-left" onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                <span className="text-sm text-[var(--ice-white)]">{fmt(r.createdAt)}</span>
                <div className="flex items-center gap-2">
                  {r.appliedAt && <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">Aplicado</Badge>}
                  {expandedId === r.id ? <ChevronUp className="h-4 w-4 text-[rgba(245,246,252,0.4)]" /> : <ChevronDown className="h-4 w-4 text-[rgba(245,246,252,0.4)]" />}
                </div>
              </button>
              {expandedId === r.id && <p className="mt-1 text-xs text-[rgba(245,246,252,0.5)]">{reportSummary(r)}</p>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
