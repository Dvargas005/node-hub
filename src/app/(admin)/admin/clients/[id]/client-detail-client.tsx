"use client";

import { useState } from "react";
import Link from "next/link";
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
import {
  ArrowLeft,
  Coins,
  AlertTriangle,
  Star,
  Globe,
  Mail,
  Phone,
  MessageCircle,
  Send,
  Linkedin,
  Instagram,
  ShieldCheck,
  ShieldAlert,
  Lightbulb,
  TrendingUp,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { getLocale } from "@/lib/i18n";
import { ticketStatusLabels, ticketStatusColors } from "@/lib/status-labels";

interface RecentTicket {
  id: string;
  number: number;
  status: string;
  serviceName: string;
  variantName: string;
  creditsCharged: number;
  createdAt: string;
}

interface ClientDetail {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  businessName: string | null;
  businessIndustry: string | null;
  businessType: string | null;
  businessDescription: string | null;
  targetAudience: string | null;
  website: string | null;
  hasBranding: boolean | null;
  brandColors: string | null;
  brandStyle: string | null;
  socialMedia: Record<string, string> | null;
  priorities: Record<string, number> | null;
  phone: string | null;
  whatsappNumber: string | null;
  telegramId: string | null;
  linkedinUrl: string | null;
  instagramHandle: string | null;
  preferredContact: string | null;
  companyAnalysis: Record<string, unknown> | null;
  companyAnalysisAt: string | null;
  subscription: {
    status: string;
    creditsRemaining: number;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    plan: { name: string; slug: string; priceMonthly: number; monthlyCredits: number };
  } | null;
  freeCredits: number;
  assignedPm: { id: string; name: string; email: string } | null;
  alliance: { name: string; code: string } | null;
  recentTickets: RecentTicket[];
  totalTickets: number;
  completedTickets: number;
}

const planColors: Record<string, string> = {
  member: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  growth: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  pro: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

const swotConfig = [
  { key: "strengths", labelKey: "admin.client.analysis.strengths", icon: ShieldCheck, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
  { key: "weaknesses", labelKey: "admin.client.analysis.weaknesses", icon: ShieldAlert, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  { key: "opportunities", labelKey: "admin.client.analysis.opportunities", icon: Lightbulb, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { key: "threats", labelKey: "admin.client.analysis.threats", icon: TrendingUp, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
];

export function ClientDetailClient({
  client,
  isAdmin,
  pms,
}: {
  client: ClientDetail;
  isAdmin: boolean;
  pms: { id: string; name: string }[];
}) {
  const router = useRouter();
  const { t, lang } = useTranslation();
  const locale = getLocale(lang);

  // Credit dialog state
  const [creditOpen, setCreditOpen] = useState(false);
  const [creditMode, setCreditMode] = useState<"add" | "remove">("add");
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [creditConfirming, setCreditConfirming] = useState(false);
  const [creditSaving, setCreditSaving] = useState(false);
  const [creditError, setCreditError] = useState("");

  const openCreditDialog = () => {
    setCreditOpen(true);
    setCreditMode("add");
    setCreditAmount("");
    setCreditReason("");
    setCreditConfirming(false);
    setCreditError("");
  };

  const handleAdjustCredits = async () => {
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
      const res = await fetch(`/api/admin/clients/${client.id}/credits`, {
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
      setCreditOpen(false);
      router.refresh();
    } catch {
      setCreditError("Connection error");
    } finally {
      setCreditSaving(false);
    }
  };

  const handleAssignPm = async (pmId: string | null) => {
    try {
      const res = await fetch(`/api/admin/clients/${client.id}/assign-pm`, {
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
    } catch {
      toast.error("Connection error");
    }
  };

  const analysisData = client.companyAnalysis as
    | { status?: string; selected?: Record<string, unknown> }
    | null;
  const hasAnalysis =
    analysisData?.status === "complete" && !!analysisData?.selected;
  const profile = analysisData?.selected as Record<string, unknown> | undefined;

  // Stale: analysis older than 90 days
  const isStale = client.companyAnalysisAt
    ? Date.now() - new Date(client.companyAnalysisAt).getTime() >
      1000 * 60 * 60 * 24 * 90
    : false;

  const sm = client.socialMedia || {};
  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(0)}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => router.push("/admin/clients")}
            className="text-[rgba(245,246,252,0.5)] hover:text-[var(--ice-white)] mt-1"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-[var(--font-lexend)] text-2xl font-bold text-[var(--ice-white)]">
              {client.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-[rgba(245,246,252,0.5)]">
              <span>{client.email}</span>
              {client.subscription ? (
                <Badge className={planColors[client.subscription.plan.slug] || "bg-gray-500/20 text-gray-400 border-gray-500/30"}>
                  {client.subscription.plan.name}
                </Badge>
              ) : (
                <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
                  No plan
                </Badge>
              )}
              {client.alliance && (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  {client.alliance.name}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <Button
              onClick={openCreditDialog}
              variant="outline"
              className="border-[rgba(245,246,252,0.2)] text-[var(--ice-white)] hover:bg-[rgba(255,255,255,0.05)]"
            >
              <Coins className="h-4 w-4 mr-2" />
              {t("admin.credits.adjust")}
            </Button>
          )}
          {isAdmin && (
            <select
              value={client.assignedPm?.id || ""}
              onChange={(e) => handleAssignPm(e.target.value || null)}
              className="h-9 rounded-md border border-[rgba(245,246,252,0.2)] bg-[#1a1108] px-3 text-sm text-[var(--ice-white)] [&_option]:bg-[#1a1108] [&_option]:text-[var(--ice-white)]"
            >
              <option value="">Unassigned</option>
              {pms.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Business Profile */}
        <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
          <CardHeader>
            <CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)] text-base">
              {t("admin.client.profile")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-[rgba(245,246,252,0.4)]">Business name</p>
              <p className="text-[var(--ice-white)] font-medium">
                {client.businessName || "—"}
              </p>
            </div>
            {client.businessIndustry && (
              <div>
                <p className="text-xs text-[rgba(245,246,252,0.4)]">Industry</p>
                <p className="text-[rgba(245,246,252,0.7)]">
                  {client.businessIndustry}
                  {client.businessType ? ` · ${client.businessType}` : ""}
                </p>
              </div>
            )}
            {client.businessDescription && (
              <div>
                <p className="text-xs text-[rgba(245,246,252,0.4)]">Description</p>
                <p className="text-[rgba(245,246,252,0.7)]">{client.businessDescription}</p>
              </div>
            )}
            {client.targetAudience && (
              <div>
                <p className="text-xs text-[rgba(245,246,252,0.4)]">Target audience</p>
                <p className="text-[rgba(245,246,252,0.7)]">{client.targetAudience}</p>
              </div>
            )}
            {client.website && (
              <div>
                <p className="text-xs text-[rgba(245,246,252,0.4)]">Website</p>
                <a
                  href={client.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--gold-bar)] hover:underline flex items-center gap-1"
                >
                  <Globe className="h-3 w-3" />
                  {client.website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-[rgba(245,246,252,0.4)]">Branding</p>
                <p className="text-[rgba(245,246,252,0.7)]">
                  {client.hasBranding === null
                    ? "—"
                    : client.hasBranding
                    ? "Yes"
                    : "No"}
                </p>
              </div>
              {client.brandColors && (
                <div>
                  <p className="text-xs text-[rgba(245,246,252,0.4)]">Brand colors</p>
                  <p className="text-[rgba(245,246,252,0.7)]">{client.brandColors}</p>
                </div>
              )}
              {client.brandStyle && (
                <div>
                  <p className="text-xs text-[rgba(245,246,252,0.4)]">Brand style</p>
                  <p className="text-[rgba(245,246,252,0.7)]">{client.brandStyle}</p>
                </div>
              )}
            </div>
            {Object.keys(sm).length > 0 && (
              <div>
                <p className="text-xs text-[rgba(245,246,252,0.4)] mb-1">Social media</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(sm).map(([k, v]) => (
                    <Badge
                      key={k}
                      className="bg-[rgba(255,255,255,0.05)] text-[rgba(245,246,252,0.6)] border-[rgba(245,246,252,0.1)]"
                    >
                      {k}: {v}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {client.priorities && Object.keys(client.priorities).length > 0 && (
              <div>
                <p className="text-xs text-[rgba(245,246,252,0.4)] mb-1">Priorities</p>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(client.priorities).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-1.5 text-xs">
                      <span className="capitalize text-[rgba(245,246,252,0.6)]">
                        {k}
                      </span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-3 w-3 ${
                              s <= (v as number)
                                ? "fill-[var(--gold-bar)] text-[var(--gold-bar)]"
                                : "text-[rgba(245,246,252,0.15)]"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
          <CardHeader>
            <CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)] text-base">
              {t("admin.client.contact")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ContactRow
              icon={Mail}
              label="Email"
              value={client.email}
              href={`mailto:${client.email}`}
              isPreferred={client.preferredContact === "email"}
            />
            {client.phone && (
              <ContactRow
                icon={Phone}
                label="Phone"
                value={client.phone}
                href={`tel:${client.phone}`}
                isPreferred={client.preferredContact === "phone"}
              />
            )}
            {client.whatsappNumber && (
              <ContactRow
                icon={MessageCircle}
                label="WhatsApp"
                value={client.whatsappNumber}
                href={`https://wa.me/${client.whatsappNumber.replace(/[^0-9]/g, "")}`}
                isPreferred={client.preferredContact === "whatsapp"}
              />
            )}
            {client.telegramId && (
              <ContactRow
                icon={Send}
                label="Telegram"
                value={client.telegramId}
                href={`https://t.me/${client.telegramId.replace(/^@/, "")}`}
                isPreferred={client.preferredContact === "telegram"}
              />
            )}
            {client.linkedinUrl && (
              <ContactRow
                icon={Linkedin}
                label="LinkedIn"
                value={client.linkedinUrl.replace(/^https?:\/\//, "")}
                href={client.linkedinUrl}
              />
            )}
            {client.instagramHandle && (
              <ContactRow
                icon={Instagram}
                label="Instagram"
                value={client.instagramHandle}
                href={`https://instagram.com/${client.instagramHandle.replace(/^@/, "")}`}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Company Analysis (FODA) */}
      <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)] text-base">
              {t("admin.client.analysis")}
            </CardTitle>
            {hasAnalysis && client.companyAnalysisAt && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[rgba(245,246,252,0.4)]">
                  {new Date(client.companyAnalysisAt).toLocaleDateString(locale)}
                </span>
                <Badge
                  className={
                    isStale
                      ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                      : "bg-green-500/20 text-green-400 border-green-500/30"
                  }
                >
                  {isStale ? "Stale" : "Current"}
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!hasAnalysis || !profile ? (
            <p className="text-sm text-[rgba(245,246,252,0.4)] py-4 text-center">
              {t("admin.client.analysis.none")}
            </p>
          ) : (
            <div className="space-y-4">
              {profile.tone ? (
                <Badge className="bg-[rgba(255,255,255,0.05)] text-[rgba(245,246,252,0.6)] border-[rgba(245,246,252,0.1)]">
                  {String(profile.tone)}
                </Badge>
              ) : null}
              {profile.description ? (
                <p className="text-sm text-[rgba(245,246,252,0.7)]">
                  {String(profile.description)}
                </p>
              ) : null}
              {profile.valueProposition ? (
                <div className="bg-[rgba(255,201,25,0.05)] border border-[var(--gold-bar)]/20 p-3">
                  <p className="text-xs text-[var(--gold-bar)] font-medium mb-1">
                    Value proposition
                  </p>
                  <p className="text-sm text-[rgba(245,246,252,0.7)]">
                    {String(profile.valueProposition)}
                  </p>
                </div>
              ) : null}

              {/* SWOT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {swotConfig.map((s) => {
                  const swot = profile.swot as
                    | Record<string, string[]>
                    | undefined;
                  const items = swot?.[s.key] || [];
                  return (
                    <div key={s.key} className={`border p-3 ${s.bg}`}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <s.icon className={`h-4 w-4 shrink-0 ${s.color}`} />
                        <p className={`text-xs font-medium ${s.color}`}>
                          {t(s.labelKey)}
                        </p>
                      </div>
                      <ul className="space-y-1">
                        {items.length === 0 ? (
                          <li className="text-xs text-[rgba(245,246,252,0.3)]">
                            —
                          </li>
                        ) : (
                          items.map((item: string, i: number) => (
                            <li
                              key={i}
                              className="text-xs text-[rgba(245,246,252,0.6)] break-words"
                            >
                              • {item}
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  );
                })}
              </div>

              {/* Competitors */}
              {(profile.competitors as string[] | undefined)?.length ? (
                <div>
                  <p className="text-xs text-[rgba(245,246,252,0.4)] mb-2">
                    {t("admin.client.analysis.competitors")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(profile.competitors as string[]).map((c, i) => (
                      <Badge
                        key={i}
                        className="bg-[rgba(255,255,255,0.05)] text-[rgba(245,246,252,0.6)] border-[rgba(245,246,252,0.1)]"
                      >
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Recommendations */}
              {(profile.recommendations as string[] | undefined)?.length ? (
                <div>
                  <p className="text-xs text-[rgba(245,246,252,0.4)] mb-2">
                    {t("admin.client.analysis.recommendations")}
                  </p>
                  <div className="flex flex-col gap-2">
                    {(profile.recommendations as string[]).map((r, i) => {
                      const lower = r.toLowerCase();
                      let cat = "DESIGN";
                      let catColor = "bg-pink-500/20 text-pink-400 border-pink-500/30";
                      if (/web|landing|sitio|seo|página/.test(lower)) {
                        cat = "WEB";
                        catColor = "bg-blue-500/20 text-blue-400 border-blue-500/30";
                      } else if (/redes|marketing|contenido|campaña|social|email/.test(lower)) {
                        cat = "MARKETING";
                        catColor = "bg-purple-500/20 text-purple-400 border-purple-500/30";
                      }
                      return (
                        <div
                          key={i}
                          className="flex items-start gap-2 p-2 border border-[rgba(245,246,252,0.08)] bg-[rgba(255,255,255,0.02)]"
                        >
                          <Badge className={`${catColor} shrink-0 text-[10px]`}>
                            {cat}
                          </Badge>
                          <p className="text-sm text-[rgba(245,246,252,0.7)] break-words">
                            {r}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Subscription */}
        <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
          <CardHeader>
            <CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)] text-base">
              {t("admin.client.subscription")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {client.subscription ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[rgba(245,246,252,0.5)]">Plan</span>
                  <div className="flex items-center gap-2">
                    <Badge className={planColors[client.subscription.plan.slug] || "bg-gray-500/20 text-gray-400 border-gray-500/30"}>
                      {client.subscription.plan.name}
                    </Badge>
                    <span className="text-[rgba(245,246,252,0.7)] text-xs">
                      {formatPrice(client.subscription.plan.priceMonthly)}/mo
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[rgba(245,246,252,0.5)]">Status</span>
                  <Badge
                    className={
                      client.subscription.status === "ACTIVE"
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : "bg-red-500/20 text-red-400 border-red-500/30"
                    }
                  >
                    {client.subscription.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[rgba(245,246,252,0.5)]">Credits</span>
                  <span className="text-[var(--ice-white)] font-medium">
                    {client.subscription.creditsRemaining} /{" "}
                    {client.subscription.plan.monthlyCredits}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[rgba(245,246,252,0.5)]">Period start</span>
                  <span className="text-[rgba(245,246,252,0.7)]">
                    {new Date(client.subscription.currentPeriodStart).toLocaleDateString(locale)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[rgba(245,246,252,0.5)]">Period end</span>
                  <span className="text-[rgba(245,246,252,0.7)]">
                    {new Date(client.subscription.currentPeriodEnd).toLocaleDateString(locale)}
                  </span>
                </div>
                {client.freeCredits > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[rgba(245,246,252,0.5)]">Free credits</span>
                    <span className="text-[var(--gold-bar)] font-medium">
                      +{client.freeCredits}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-2 py-2">
                <p className="text-sm text-[rgba(245,246,252,0.4)]">No active plan</p>
                {client.freeCredits > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[rgba(245,246,252,0.5)]">Free credits</span>
                    <span className="text-[var(--gold-bar)] font-medium">
                      {client.freeCredits}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity */}
        <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
          <CardHeader>
            <CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)] text-base">
              {t("admin.client.activity")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[rgba(245,246,252,0.5)]">
                {t("admin.client.registered")}
              </span>
              <span className="text-[rgba(245,246,252,0.7)]">
                {new Date(client.createdAt).toLocaleDateString(locale)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[rgba(245,246,252,0.5)]">
                {t("admin.client.lastActive")}
              </span>
              <span className="text-[rgba(245,246,252,0.7)]">
                {new Date(client.updatedAt).toLocaleDateString(locale)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[rgba(245,246,252,0.5)]">
                {t("admin.client.totalTickets")}
              </span>
              <span className="text-[var(--ice-white)] font-medium">
                {client.completedTickets} / {client.totalTickets}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[rgba(245,246,252,0.5)]">
                {t("admin.client.assignedPm")}
              </span>
              <span className="text-[rgba(245,246,252,0.7)]">
                {client.assignedPm ? client.assignedPm.name : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[rgba(245,246,252,0.5)]">Email verified</span>
              <Badge
                className={
                  client.emailVerified
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                }
              >
                {client.emailVerified ? "Yes" : "No"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tickets */}
      <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
        <CardHeader>
          <CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)] text-base">
            {t("admin.client.tickets")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {client.recentTickets.length === 0 ? (
            <p className="text-sm text-[rgba(245,246,252,0.4)] text-center py-4">
              No tickets yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[rgba(245,246,252,0.1)] hover:bg-transparent">
                    <TableHead className="text-[rgba(245,246,252,0.5)]">#</TableHead>
                    <TableHead className="text-[rgba(245,246,252,0.5)]">Service</TableHead>
                    <TableHead className="text-[rgba(245,246,252,0.5)]">Status</TableHead>
                    <TableHead className="text-[rgba(245,246,252,0.5)]">Credits</TableHead>
                    <TableHead className="text-[rgba(245,246,252,0.5)]">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {client.recentTickets.map((ticket) => (
                    <TableRow
                      key={ticket.id}
                      onClick={() => router.push(`/admin/tickets/${ticket.id}`)}
                      className="border-[rgba(245,246,252,0.06)] hover:bg-[rgba(255,255,255,0.03)] cursor-pointer"
                    >
                      <TableCell className="text-[var(--ice-white)] font-medium">
                        #{ticket.number}
                      </TableCell>
                      <TableCell className="text-sm text-[rgba(245,246,252,0.7)]">
                        <div>{ticket.serviceName}</div>
                        {ticket.variantName && (
                          <div className="text-xs text-[rgba(245,246,252,0.4)]">
                            {ticket.variantName}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={ticketStatusColors[ticket.status] || ""}>
                          {ticketStatusLabels[ticket.status] || ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-[rgba(245,246,252,0.7)]">
                        {ticket.creditsCharged}
                      </TableCell>
                      <TableCell className="text-sm text-[rgba(245,246,252,0.5)]">
                        {new Date(ticket.createdAt).toLocaleDateString(locale)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credit dialog */}
      <Dialog open={creditOpen} onOpenChange={(open) => setCreditOpen(open)}>
        <DialogContent className="border-[rgba(245,246,252,0.1)] bg-[var(--asphalt-black)] text-[var(--ice-white)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-[var(--font-lexend)]">
              {t("admin.credits.adjust")}
              <span className="block text-sm font-normal text-[rgba(245,246,252,0.5)] mt-1">
                {client.name}
              </span>
            </DialogTitle>
            <DialogDescription className="text-[rgba(245,246,252,0.5)]" />
          </DialogHeader>

          <div className="space-y-4">
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
                onClick={() => setCreditOpen(false)}
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
                {creditSaving
                  ? "..."
                  : creditConfirming
                  ? t("admin.credits.confirm")
                  : t("admin.credits.adjust")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
  isPreferred,
}: {
  icon: any;
  label: string;
  value: string;
  href?: string;
  isPreferred?: boolean;
}) {
  const content = (
    <div className="flex items-center gap-2 group">
      <Icon className="h-4 w-4 text-[rgba(245,246,252,0.4)]" />
      <span className="text-xs text-[rgba(245,246,252,0.4)] w-20 shrink-0">
        {label}
      </span>
      <span className="text-[rgba(245,246,252,0.7)] truncate flex-1">{value}</span>
      {isPreferred && (
        <Badge className="bg-[var(--gold-bar)]/20 text-[var(--gold-bar)] border-[var(--gold-bar)]/30 text-[10px] shrink-0">
          Preferred
        </Badge>
      )}
    </div>
  );

  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block hover:bg-[rgba(255,255,255,0.03)] rounded-sm px-1 py-1 -mx-1 transition-colors"
    >
      {content}
    </a>
  ) : (
    <div className="px-1 py-1 -mx-1">{content}</div>
  );
}
