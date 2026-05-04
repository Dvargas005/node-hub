"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Coins, AlertTriangle } from "lucide-react";
import { ContactIcons } from "@/components/admin/contact-links";
import { useTranslation } from "@/hooks/useTranslation";
import { getLocale } from "@/lib/i18n";

interface ClientRow {
  id: string;
  name: string;
  email: string;
  businessName: string | null;
  planName: string | null;
  planSlug: string | null;
  creditsRemaining: number | null;
  monthlyCredits: number | null;
  activeTickets: number;
  allianceName: string | null;
  allianceCode: string | null;
  assignedPmId: string | null;
  assignedPmName: string | null;
  createdAt: string;
  phone: string | null;
  whatsappNumber: string | null;
  telegramId: string | null;
  linkedinUrl: string | null;
  instagramHandle: string | null;
  preferredContact: string | null;
}

const planColors: Record<string, string> = {
  member: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  growth: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  pro: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

export function ClientsClient({
  clients,
  plans,
  isAdmin,
  pms,
}: {
  clients: ClientRow[];
  plans: { slug: string; name: string }[];
  isAdmin: boolean;
  pms: { id: string; name: string }[];
}) {
  const router = useRouter();
  const { t, lang } = useTranslation();
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("");
  const [filterAlliance, setFilterAlliance] = useState(false);

  // Credit adjustment dialog
  const [creditTarget, setCreditTarget] = useState<ClientRow | null>(null);
  const [creditMode, setCreditMode] = useState<"add" | "remove">("add");
  const [creditAmount, setCreditAmount] = useState<string>("");
  const [creditReason, setCreditReason] = useState("");
  const [creditConfirming, setCreditConfirming] = useState(false);
  const [creditSaving, setCreditSaving] = useState(false);
  const [creditError, setCreditError] = useState("");

  const openCreditDialog = (client: ClientRow) => {
    setCreditTarget(client);
    setCreditMode("add");
    setCreditAmount("");
    setCreditReason("");
    setCreditConfirming(false);
    setCreditError("");
  };

  const closeCreditDialog = () => {
    setCreditTarget(null);
    setCreditConfirming(false);
    setCreditError("");
  };

  const handleAdjustCredits = async () => {
    if (!creditTarget) return;
    setCreditError("");
    const amountNum = parseInt(creditAmount, 10);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setCreditError("Invalid amount");
      return;
    }
    if (creditReason.trim().length < 3) {
      setCreditError("Reason required (min 3 chars)");
      return;
    }
    if (!creditConfirming) {
      setCreditConfirming(true);
      return;
    }
    setCreditSaving(true);
    try {
      const signed = creditMode === "add" ? amountNum : -amountNum;
      const res = await fetch(`/api/admin/clients/${creditTarget.id}/credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: signed, reason: creditReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreditError(data.error || "Error");
        return;
      }
      toast.success(t("admin.credits.success"));
      closeCreditDialog();
      router.refresh();
    } catch {
      setCreditError("Connection error");
    } finally {
      setCreditSaving(false);
    }
  };

  const handleAssignPm = async (clientId: string, pmId: string | null) => {
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/assign-pm`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pmId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error || "Error assigning PM");
        return;
      }
      toast.success(pmId ? "PM assigned" : "PM unassigned");
      router.refresh();
    } catch (err: any) {
      console.error("Error assigning PM", err);
      toast.error("Connection error");
    }
  };

  const filtered = useMemo(() => {
    return clients.filter((c: any) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !c.name.toLowerCase().includes(q) &&
          !c.email.toLowerCase().includes(q) &&
          !(c.businessName || "").toLowerCase().includes(q)
        )
          return false;
      }
      if (filterPlan) {
        if (filterPlan === "__none") { if (c.planSlug !== null) return false; }
        else if (c.planSlug !== filterPlan) return false;
      }
      if (filterAlliance && !c.allianceName) return false;
      return true;
    });
  }, [clients, search, filterPlan, filterAlliance]);

  return (
    <div className="space-y-6">
      <h1 className="font-[var(--font-lexend)] text-2xl font-bold text-[var(--ice-white)]">
        Clients
      </h1>

      {/* Filters */}
      <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(245,246,252,0.4)]" />
              <Input
                placeholder="Search by name, email or business..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)]"
              />
            </div>
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="h-9 rounded-md border border-[rgba(245,246,252,0.2)] bg-[#1a1108] px-3 text-sm text-[var(--ice-white)] [&_option]:bg-[#1a1108] [&_option]:text-[var(--ice-white)]"
            >
              <option value="">All plans</option>
              {plans.map((p: any) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
              <option value="__none">No plan</option>
            </select>
            <button
              onClick={() => setFilterAlliance(!filterAlliance)}
              className={`h-9 rounded-md border px-3 text-sm transition-colors ${
                filterAlliance
                  ? "border-[var(--gold-bar)] bg-[rgba(255,201,25,0.1)] text-[var(--gold-bar)]"
                  : "border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[rgba(245,246,252,0.5)]"
              }`}
            >
              With alliance
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
        <CardHeader>
          <CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)] text-base">
            {filtered.length} clients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[rgba(245,246,252,0.1)] hover:bg-transparent">
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Name</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Business</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Contact</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Plan</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Credits</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Tickets</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">PM</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Alliance</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center text-[rgba(245,246,252,0.4)] py-8"
                    >
                      No clients found
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((c: any) => (
                  <TableRow
                    key={c.id}
                    onClick={() => router.push(`/admin/clients/${c.id}`)}
                    className="border-[rgba(245,246,252,0.06)] hover:bg-[rgba(255,255,255,0.03)] cursor-pointer"
                  >
                    <TableCell className="text-[var(--ice-white)] font-medium">
                      <div>{c.name}</div>
                      <div className="text-xs text-[rgba(245,246,252,0.5)] font-normal">{c.email}</div>
                    </TableCell>
                    <TableCell className="text-sm text-[rgba(245,246,252,0.6)]">
                      {c.businessName || (
                        <span className="text-[rgba(245,246,252,0.3)]">—</span>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <ContactIcons
                        contact={{
                          email: c.email,
                          phone: c.phone,
                          whatsappNumber: c.whatsappNumber,
                          telegramId: c.telegramId,
                          linkedinUrl: c.linkedinUrl,
                          instagramHandle: c.instagramHandle,
                          preferredContact: c.preferredContact,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {c.planSlug ? (
                        <Badge className={planColors[c.planSlug] || ""}>
                          {c.planName}
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
                          No plan
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-[rgba(245,246,252,0.6)]">
                      <div className="flex items-center gap-1.5">
                        {c.creditsRemaining !== null ? (
                          <span>
                            <span className="text-[var(--ice-white)]">
                              {c.creditsRemaining}
                            </span>
                            /{c.monthlyCredits}
                          </span>
                        ) : (
                          <span className="text-[rgba(245,246,252,0.3)]">—</span>
                        )}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openCreditDialog(c);
                            }}
                            className="text-[rgba(245,246,252,0.4)] hover:text-[var(--gold-bar)] transition-colors p-0.5"
                            title={t("admin.credits.adjust")}
                            aria-label={t("admin.credits.adjust")}
                          >
                            <Coins className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-[var(--ice-white)]">
                      {c.activeTickets}
                    </TableCell>
                    <TableCell className="text-sm text-[rgba(245,246,252,0.6)]">
                      {isAdmin ? (
                        <select
                          value={c.assignedPmId || ""}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleAssignPm(c.id, e.target.value || null)}
                          className="h-9 rounded-md border border-[rgba(245,246,252,0.2)] bg-[#1a1108] px-3 text-sm text-[var(--ice-white)] [&_option]:bg-[#1a1108] [&_option]:text-[var(--ice-white)]"
                        >
                          <option value="">Unassigned</option>
                          {pms.map((p: any) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        c.assignedPmName || (
                          <span className="text-[rgba(245,246,252,0.3)]">—</span>
                        )
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-[rgba(245,246,252,0.6)]">
                      {c.allianceName ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          {c.allianceName}
                        </Badge>
                      ) : (
                        <span className="text-[rgba(245,246,252,0.3)]">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-[rgba(245,246,252,0.5)]">
                      {new Date(c.createdAt).toLocaleDateString(getLocale(lang))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Credit adjustment dialog */}
      <Dialog open={!!creditTarget} onOpenChange={(open) => { if (!open) closeCreditDialog(); }}>
        <DialogContent className="border-[rgba(245,246,252,0.1)] bg-[var(--asphalt-black)] text-[var(--ice-white)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-[var(--font-lexend)]">
              {t("admin.credits.adjust")}
              {creditTarget && (
                <span className="block text-sm font-normal text-[rgba(245,246,252,0.5)] mt-1">
                  {creditTarget.name}
                </span>
              )}
            </DialogTitle>
            <DialogDescription className="text-[rgba(245,246,252,0.5)]" />
          </DialogHeader>

          <div className="space-y-4">
            {/* Add / Remove toggle */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCreditMode("add")}
                className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${
                  creditMode === "add"
                    ? "border-[var(--gold-bar)] bg-[var(--gold-bar)]/15 text-[var(--gold-bar)]"
                    : "border-[rgba(245,246,252,0.2)] text-[rgba(245,246,252,0.6)] hover:border-[var(--gold-bar)]/50"
                }`}
              >
                + {t("admin.credits.add")}
              </button>
              <button
                type="button"
                onClick={() => setCreditMode("remove")}
                className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${
                  creditMode === "remove"
                    ? "border-red-500/60 bg-red-500/10 text-red-400"
                    : "border-[rgba(245,246,252,0.2)] text-[rgba(245,246,252,0.6)] hover:border-red-500/50"
                }`}
              >
                − {t("admin.credits.remove")}
              </button>
            </div>

            <div>
              <label className="text-xs text-[rgba(245,246,252,0.5)] mb-1 block">
                {t("admin.credits.amount")}
              </label>
              <Input
                type="number"
                min={1}
                max={99999}
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="100"
                className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)]"
              />
            </div>

            <div>
              <label className="text-xs text-[rgba(245,246,252,0.5)] mb-1 block">
                {t("admin.credits.reason")}
              </label>
              <textarea
                value={creditReason}
                onChange={(e) => setCreditReason(e.target.value.slice(0, 500))}
                placeholder={t("admin.credits.reason.placeholder")}
                rows={3}
                className="w-full rounded-md border border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-sm text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)] resize-none focus:outline-none focus:border-[var(--gold-bar)]"
              />
            </div>

            <div className="flex items-start gap-2 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-md p-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{t("admin.credits.warning")}</span>
            </div>

            {creditError && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md p-2">
                {creditError}
              </div>
            )}

            {creditConfirming && (
              <div className="text-sm text-[var(--gold-bar)] bg-[var(--gold-bar)]/10 border border-[var(--gold-bar)]/30 rounded-md p-2 text-center">
                {t("admin.credits.confirm")}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={closeCreditDialog}
                className="flex-1 border-[rgba(245,246,252,0.2)] text-[var(--ice-white)]"
              >
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleAdjustCredits}
                disabled={creditSaving}
                className={`flex-1 font-bold ${
                  creditConfirming
                    ? "bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90"
                    : "bg-[rgba(255,255,255,0.1)] text-[var(--ice-white)] hover:bg-[rgba(255,255,255,0.15)]"
                }`}
              >
                {creditSaving ? "..." : creditConfirming ? t("admin.credits.confirm") : t("admin.credits.adjust")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
