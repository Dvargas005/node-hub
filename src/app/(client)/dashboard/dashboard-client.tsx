"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard, Plus, Ticket, ArrowRight, Search, Globe, Instagram,
  Facebook, User, Mail, Pencil, Loader2, Star, ChevronDown, ChevronUp,
  ShieldCheck, TrendingUp, AlertTriangle, Target, Palette, Monitor, Megaphone, RefreshCw,
} from "lucide-react";
import { ticketStatusLabels, ticketStatusColors } from "@/lib/status-labels";

// ─── Types ──────────────────────────────────────────
interface Profile {
  businessName: string;
  businessIndustry: string;
  businessDescription: string;
  targetAudience: string;
  hasBranding: boolean | null | undefined;
  brandColors: string;
  brandStyle: string;
  website: string;
  socialMedia: Record<string, string>;
  priorities: Record<string, number>;
}

interface TicketRow { id: string; number: number; serviceName: string; variantName: string; status: string; createdAt: string; }

interface Props {
  userName: string;
  freeCredits: number;
  subscription: {
    planName: string; creditsRemaining: number; monthlyCredits: number;
    status: string; periodEnd: string; maxActiveReqs: number;
  } | null;
  profile: Profile;
  companyAnalysis: Record<string, unknown> | null;
  companyAnalysisAt: string | null;
  subscriptionRenewedAt: string | null;
  activeTickets: TicketRow[];
  latestTicket: { number: number; status: string; serviceName: string } | null;
  pm: { name: string; email: string } | null;
}

// ─── Greeting ───────────────────────────────────────
function getGreeting(firstName: string, latestTicket: Props["latestTicket"], analysis: unknown) {
  if (!latestTicket && !analysis) {
    return { title: `Hello, ${firstName}!`, subtitle: "Welcome to your N.O.D.E. dashboard.", cta: "analysis" as const };
  }
  if (!latestTicket) {
    return { title: `Hello, ${firstName}!`, subtitle: "Your business profile is ready. Time to create your first request!", cta: null };
  }
  const msgs: Record<string, string> = {
    NEW: `Your request #${latestTicket.number} was received. A PM will review it soon.`,
    REVIEWING: `Your request #${latestTicket.number} is being reviewed by your PM.`,
    ASSIGNED: `Great news! Your request #${latestTicket.number} was assigned to a specialist.`,
    IN_PROGRESS: `Your request #${latestTicket.number} is in production.`,
    DELIVERED: `Your request #${latestTicket.number} has a delivery ready for review!`,
    REVISION: `Your request #${latestTicket.number} is in revision with the adjustments you requested.`,
    COMPLETED: `Your last request #${latestTicket.number} was completed. Ready for the next one?`,
    CANCELED: `Your request #${latestTicket.number} was canceled.`,
  };
  return { title: `Hello, ${firstName}!`, subtitle: msgs[latestTicket.status] || "Welcome back.", cta: null };
}

// ─── SWOT colors ────────────────────────────────────
const swotConfig = [
  { key: "strengths", label: "Strengths", icon: ShieldCheck, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
  { key: "opportunities", label: "Opportunities", icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { key: "weaknesses", label: "Weaknesses", icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
  { key: "threats", label: "Threats", icon: Target, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
];

// ─── Component ──────────────────────────────────────
export function DashboardClient({
  userName, freeCredits, subscription, profile, companyAnalysis, companyAnalysisAt, subscriptionRenewedAt, activeTickets, latestTicket, pm,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const firstName = userName?.split(" ")[0] || "user";
  const totalCredits = freeCredits + (subscription?.creditsRemaining || 0);
  const greeting = getGreeting(firstName, latestTicket, companyAnalysis);

  const analysisData = companyAnalysis as { status?: string; options?: Record<string, unknown>; selected?: Record<string, unknown> } | null;
  const hasAnalysis = analysisData?.status === "complete" && !!analysisData?.selected;
  const selectedProfile = analysisData?.selected as Record<string, unknown> | undefined;
  const analysisOptions = analysisData?.options as { optionA?: Record<string, unknown>; optionB?: Record<string, unknown> } | undefined;
  const hasPendingOptions = analysisData?.status === "pending_selection" && !!analysisOptions;

  const [analysisExpanded, setAnalysisExpanded] = useState(false);

  // Renewal check: analysis > 30 days old AND subscription renewed after it
  const isStaleAnalysis = !!(
    hasAnalysis && companyAnalysisAt && subscriptionRenewedAt &&
    new Date(subscriptionRenewedAt) > new Date(companyAnalysisAt) &&
    Date.now() - new Date(companyAnalysisAt).getTime() > 30 * 24 * 60 * 60 * 1000
  );

  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [showOptions, setShowOptions] = useState(hasPendingOptions);
  const [completing, setCompleting] = useState(false);
  const [feedbackA, setFeedbackA] = useState("");
  const [feedbackB, setFeedbackB] = useState("");
  const [localOptions, setLocalOptions] = useState(analysisOptions);

  // Verify Stripe checkout session as webhook fallback
  useEffect(() => {
    const checkout = searchParams.get("checkout");
    const sessionId = searchParams.get("session_id");
    if (checkout !== "success" || !sessionId) return;

    // Clean URL immediately
    window.history.replaceState({}, "", "/dashboard");

    fetch(`/api/stripe/verify-session?session_id=${sessionId}`)
      .then((res) => res.json())
      .then((data: any) => {
        if (data.success) {
          toast.success("Subscription activated!");
          router.refresh();
        } else if (data.error) {
          toast.error("Verifying your payment... try reloading in a few seconds");
        }
      })
      .catch(() => {
        toast.error("Verifying your payment... try reloading in a few seconds");
      });
  }, [searchParams, router]);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError("");
    try {
      const res = await fetch("/api/company-analysis/options", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setGenError(data.error || "Error generating"); return; }
      setLocalOptions(data.options);
      setShowOptions(true);
    } catch { setGenError("Connection error"); } finally { setGenerating(false); }
  };

  const handleSelect = async (option: "A" | "B") => {
    setCompleting(true);
    setGenError("");
    try {
      const feedback = option === "A" ? feedbackA : feedbackB;
      const res = await fetch("/api/company-analysis/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ option, feedback: feedback || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setGenError(data.error || "Error completing"); return; }
      setShowOptions(false);
      router.refresh();
    } catch { setGenError("Connection error"); } finally { setCompleting(false); }
  };

  return (
    <div className="space-y-8 overflow-x-hidden">
      {/* SECTION 1 — Greeting */}
      <div>
        <h1 className="font-[var(--font-lexend)] text-2xl font-bold text-[var(--ice-white)]">{greeting.title}</h1>
        <p className="mt-1 text-[rgba(245,246,252,0.5)]">{greeting.subtitle}</p>
        {greeting.cta === "analysis" && (
          <button
            onClick={() => document.getElementById("company-analysis")?.scrollIntoView({ behavior: "smooth" })}
            className="mt-3 inline-block bg-[var(--gold-bar)] text-[var(--asphalt-black)] font-[var(--font-lexend)] font-bold text-sm px-5 py-2.5 hover:opacity-90 transition-opacity"
          >
            Generate free analysis →
          </button>
        )}
      </div>

      {/* Metrics bar */}
      {subscription && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
            <CardHeader className="pb-2"><CardDescription className="text-[rgba(245,246,252,0.5)]">Plan</CardDescription></CardHeader>
            <CardContent>
              <p className="font-[var(--font-lexend)] text-xl font-bold text-[var(--ice-white)]">{subscription.planName}</p>
              <Badge className={subscription.status === "ACTIVE" ? "bg-green-500/20 text-green-400 border-green-500/30 mt-1" : "bg-red-500/20 text-red-400 border-red-500/30 mt-1"}>
                {subscription.status === "ACTIVE" ? "Active" : subscription.status}
              </Badge>
            </CardContent>
          </Card>
          <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
            <CardHeader className="pb-2"><CardDescription className="text-[rgba(245,246,252,0.5)]">Credits</CardDescription></CardHeader>
            <CardContent>
              <span className="font-[var(--font-lexend)] text-3xl font-bold text-[var(--gold-bar)]">{totalCredits}</span>
              <span className="text-sm text-[rgba(245,246,252,0.4)] ml-1">available</span>
              {freeCredits > 0 && <p className="text-xs text-[rgba(245,246,252,0.3)] mt-1">{freeCredits} free + {subscription.creditsRemaining} from plan</p>}
            </CardContent>
          </Card>
          <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
            <CardHeader className="pb-2"><CardDescription className="text-[rgba(245,246,252,0.5)]">Active tickets</CardDescription></CardHeader>
            <CardContent>
              <span className="font-[var(--font-lexend)] text-3xl font-bold text-[var(--ice-white)]">{activeTickets.length}</span>
              <span className="text-sm text-[rgba(245,246,252,0.4)] ml-1">/ {subscription.maxActiveReqs === 999 ? "∞" : subscription.maxActiveReqs}</span>
            </CardContent>
          </Card>
        </div>
      )}

      {!subscription && freeCredits > 0 && (
        <Card className="border-[var(--gold-bar)] bg-[rgba(255,201,25,0.05)]">
          <CardContent className="py-4 flex items-center justify-between">
            <p className="text-sm text-[rgba(245,246,252,0.5)]">Welcome credits</p>
            <span className="font-[var(--font-lexend)] text-2xl font-bold text-[var(--gold-bar)]">{freeCredits}</span>
          </CardContent>
        </Card>
      )}

      {!subscription && (
        <Card className="border-[var(--gold-bar)] bg-[rgba(255,201,25,0.05)]">
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <CreditCard className="h-10 w-10 text-[var(--gold-bar)]" />
            <div className="text-center">
              <h2 className="font-[var(--font-lexend)] text-lg font-bold text-[var(--ice-white)]">Choose your plan</h2>
              <p className="mt-1 text-sm text-[rgba(245,246,252,0.5)]">Subscribe to get started with services.</p>
            </div>
            <Link href="/billing"><Button className="bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold px-6">View plans <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </CardContent>
        </Card>
      )}

      {/* SECTION 2 — Company profile summary */}
      {profile.businessName && (
        <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)]">Your business</CardTitle>
              <Link href="/settings">
                <Button variant="ghost" size="sm" className="text-xs text-[rgba(245,246,252,0.4)] hover:text-[var(--gold-bar)] gap-1">
                  <Pencil className="h-3 w-3" /> Edit
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-[var(--font-lexend)] text-lg font-bold text-[var(--ice-white)]">{profile.businessName}</p>
            {profile.businessIndustry && <Badge className="bg-[rgba(255,255,255,0.05)] text-[rgba(245,246,252,0.6)] border-[rgba(245,246,252,0.1)]">{profile.businessIndustry}</Badge>}
            {profile.businessDescription && <p className="text-sm text-[rgba(245,246,252,0.6)]">{profile.businessDescription}</p>}
            {profile.targetAudience && (
              <div className="flex flex-wrap gap-1">
                {profile.targetAudience.split(",").map((t: any) => (
                  <Badge key={t} className="text-xs bg-[rgba(255,255,255,0.05)] text-[rgba(245,246,252,0.5)] border-[rgba(245,246,252,0.08)]">{t.trim()}</Badge>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-3 text-xs text-[rgba(245,246,252,0.4)]">
              {profile.hasBranding !== null && <span>Branding: {profile.hasBranding ? `Yes${profile.brandColors ? ` · ${profile.brandColors}` : ""}` : "No"}</span>}
              {profile.website && <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-[var(--gold-bar)]"><Globe className="h-3 w-3" />{profile.website.replace(/^https?:\/\//, "")}</a>}
              {profile.socialMedia.instagram && <span className="flex items-center gap-1"><Instagram className="h-3 w-3" />{profile.socialMedia.instagram}</span>}
              {profile.socialMedia.facebook && <span className="flex items-center gap-1"><Facebook className="h-3 w-3" />{profile.socialMedia.facebook}</span>}
            </div>
            {Object.keys(profile.priorities).length > 0 && (
              <div className="flex gap-4 pt-1">
                {Object.entries(profile.priorities).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-1 text-xs text-[rgba(245,246,252,0.4)]">
                    <span className="capitalize">{k}</span>
                    <div className="flex">{[1,2,3,4,5].map((s) => <Star key={s} className={`h-3 w-3 ${s <= (v as number) ? "fill-[var(--gold-bar)] text-[var(--gold-bar)]" : "text-[rgba(245,246,252,0.15)]"}`} />)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* SECTION 3 — AI Analysis */}
      {!hasAnalysis && !showOptions && (
        <Card id="company-analysis" className="border-[var(--gold-bar)] bg-[rgba(255,201,25,0.03)]">
          <CardContent className="py-8 text-center space-y-4">
            <Search className="h-10 w-10 text-[var(--gold-bar)] mx-auto" />
            <div>
              <h2 className="font-[var(--font-lexend)] text-lg font-bold text-[var(--ice-white)]">Smart business analysis</h2>
              <p className="text-sm text-[rgba(245,246,252,0.5)] mt-1 max-w-md mx-auto">Our AI will analyze your business in depth: competitors, strengths, and areas of opportunity in design, web, and marketing.</p>
            </div>
            {genError && <p className="text-sm text-red-400">{genError}</p>}
            <Button onClick={handleGenerate} disabled={generating} className="bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold disabled:opacity-50">
              {generating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Analyzing...</> : <>Generate analysis (10 credits) <ArrowRight className="ml-2 h-4 w-4" /></>}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Option selection */}
      {showOptions && localOptions && !hasAnalysis && (
        <div className="space-y-4">
          <h2 className="font-[var(--font-lexend)] text-lg font-bold text-[var(--ice-white)]">Choose your business profile</h2>
          {genError && <p className="text-sm text-red-400">{genError}</p>}
          <div className="grid gap-4 md:grid-cols-2">
            {(["optionA", "optionB"] as const).map((key) => {
              const opt = localOptions[key] as Record<string, unknown> | undefined;
              if (!opt) return null;
              const isA = key === "optionA";
              const fb = isA ? feedbackA : feedbackB;
              const setFb = isA ? setFeedbackA : setFeedbackB;
              return (
                <Card key={key} className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)] hover:border-[var(--gold-bar)] transition-colors">
                  <CardHeader>
                    <CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)] text-base">{opt.label as string}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-[rgba(245,246,252,0.6)]">{opt.description as string}</p>
                    <p className="text-xs text-[rgba(245,246,252,0.4)]">Tone: {opt.tone as string}</p>
                    <Separator className="bg-[rgba(245,246,252,0.06)]" />
                    <p className="text-xs text-[rgba(245,246,252,0.4)]">Value proposition:</p>
                    <p className="text-sm text-[rgba(245,246,252,0.7)]">{opt.valueProposition as string}</p>
                    <textarea
                      value={fb}
                      onChange={(e) => setFb(e.target.value)}
                      placeholder="Want to adjust something? (optional)"
                      rows={2}
                      className="w-full rounded-md border border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)] px-3 py-2 text-xs text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)] resize-none"
                    />
                    <Button onClick={() => handleSelect(isA ? "A" : "B")} disabled={completing} className="w-full bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold disabled:opacity-50">
                      {completing ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating analysis...</> : "Choose this profile"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Stale analysis renewal banner */}
      {isStaleAnalysis && (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-blue-400" />
              <p className="text-sm text-blue-400">Your analysis is over a month old. You can update it for free with your renewal.</p>
            </div>
            <Button onClick={handleGenerate} disabled={generating} size="sm" className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 text-xs">
              {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : "Update"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Selected analysis display — collapsable */}
      {hasAnalysis && selectedProfile && (
        <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
          <CardContent className="py-4">
            {/* Collapsed header — always visible */}
            <button
              onClick={() => setAnalysisExpanded(!analysisExpanded)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-[var(--font-lexend)] font-bold text-[var(--ice-white)]">
                    Business analysis
                  </p>
                  {selectedProfile.tone ? (
                    <Badge className="bg-[rgba(255,255,255,0.05)] text-[rgba(245,246,252,0.5)] border-[rgba(245,246,252,0.1)] text-[10px]">
                      {String(selectedProfile.tone)}
                    </Badge>
                  ) : null}
                </div>
                <p className="text-sm text-[rgba(245,246,252,0.5)] truncate">
                  {selectedProfile.valueProposition as string}
                </p>
              </div>
              {analysisExpanded ? (
                <ChevronUp className="h-5 w-5 text-[rgba(245,246,252,0.4)] shrink-0 ml-3" />
              ) : (
                <ChevronDown className="h-5 w-5 text-[rgba(245,246,252,0.4)] shrink-0 ml-3" />
              )}
            </button>

            {/* Expanded content */}
            {analysisExpanded && (
              <div className="mt-4 space-y-4 border-t border-[rgba(245,246,252,0.06)] pt-4 overflow-hidden">
                <p className="text-sm text-[rgba(245,246,252,0.7)]">{selectedProfile.description as string}</p>
                <div className="bg-[rgba(255,201,25,0.05)] border border-[var(--gold-bar)]/20 p-3">
                  <p className="text-xs text-[var(--gold-bar)] font-medium mb-1">Value proposition</p>
                  <p className="text-sm text-[rgba(245,246,252,0.7)]">{selectedProfile.valueProposition as string}</p>
                </div>

                {/* SWOT */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {swotConfig.map((s: any) => {
                    const swot = selectedProfile.swot as Record<string, string[]> | undefined;
                    const items = swot?.[s.key] || [];
                    return (
                      <div key={s.key} className={`border p-3 ${s.bg} overflow-hidden`}>
                        <div className="flex items-center gap-1.5 mb-2">
                          <s.icon className={`h-4 w-4 shrink-0 ${s.color}`} />
                          <p className={`text-xs font-medium ${s.color}`}>{s.label}</p>
                        </div>
                        <ul className="space-y-1">
                          {items.map((item: any, i: number) => <li key={i} className="text-xs text-[rgba(245,246,252,0.6)] break-words">• {item}</li>)}
                        </ul>
                      </div>
                    );
                  })}
                </div>

                {/* Competitors */}
                {(selectedProfile.competitors as string[] | undefined)?.length ? (
                  <div>
                    <p className="text-xs text-[rgba(245,246,252,0.4)] mb-2">Identified competitors</p>
                    <div className="flex flex-wrap gap-2">
                      {(selectedProfile.competitors as string[]).map((c: any, i: number) => (
                        <Badge key={i} className="bg-[rgba(255,255,255,0.05)] text-[rgba(245,246,252,0.6)] border-[rgba(245,246,252,0.1)] break-words">{c}</Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Actionable recommendations */}
                {(selectedProfile.recommendations as string[] | undefined)?.length ? (
                  <div>
                    <p className="text-xs text-[rgba(245,246,252,0.4)] mb-2">Recommendations</p>
                    <div className="flex flex-wrap gap-2">
                      {(selectedProfile.recommendations as string[]).map((r: any, i: number) => {
                        const lower = r.toLowerCase();
                        let cat = "DESIGN";
                        let Icon = Palette;
                        if (/web|landing|sitio|seo|página/.test(lower)) { cat = "WEB"; Icon = Monitor; }
                        else if (/redes|marketing|contenido|campaña|social|email/.test(lower)) { cat = "MARKETING"; Icon = Megaphone; }
                        return (
                          <Link key={i} href={`/request?category=${cat}`}>
                            <button className="flex items-center gap-2 px-3 py-2 text-xs border border-[var(--gold-bar)]/30 bg-transparent text-[rgba(245,246,252,0.7)] hover:border-[var(--gold-bar)] hover:bg-[rgba(255,201,25,0.05)] hover:text-[var(--gold-bar)] transition-all">
                              <Icon className="h-3 w-3 shrink-0 text-[var(--gold-bar)]" />
                              <span className="text-left break-words">{r}</span>
                            </button>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* SECTION 4 — Active tickets */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-[var(--font-lexend)] text-lg font-semibold text-[var(--ice-white)]">Active requests</h2>
          <Link href="/tickets" className="text-xs text-[var(--gold-bar)] hover:underline flex items-center gap-1">View all <ArrowRight className="h-3 w-3" /></Link>
        </div>
        {activeTickets.length === 0 ? (
          <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
            <CardContent className="py-8 text-center">
              <p className="text-sm text-[rgba(245,246,252,0.4)]">No active requests.</p>
              <Link href="/request"><Button className="mt-3 bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold text-sm">Create request <Plus className="ml-1 h-4 w-4" /></Button></Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {activeTickets.map((t: any) => (
              <Card key={t.id} className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
                <CardContent className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[var(--ice-white)]">#{t.number} — {t.serviceName}</p>
                    <p className="text-xs text-[rgba(245,246,252,0.4)]">{t.variantName} · {new Date(t.createdAt).toLocaleDateString("es-MX")}</p>
                  </div>
                  <Badge className={ticketStatusColors[t.status] || ""}>{ticketStatusLabels[t.status] || t.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 5 — Quick actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/request">
          <Card className="cursor-pointer border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)] transition-all hover:border-[var(--gold-bar)] hover:bg-[rgba(255,201,25,0.03)]">
            <CardContent className="flex items-center gap-4 py-5">
              <div className="flex h-10 w-10 items-center justify-center bg-[rgba(255,201,25,0.1)]"><Plus className="h-5 w-5 text-[var(--gold-bar)]" /></div>
              <div><p className="font-[var(--font-lexend)] font-semibold text-[var(--ice-white)]">New Request</p><p className="text-xs text-[rgba(245,246,252,0.4)]">Create a new ticket</p></div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/tickets">
          <Card className="cursor-pointer border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)] transition-all hover:border-[var(--gold-bar)] hover:bg-[rgba(255,201,25,0.03)]">
            <CardContent className="flex items-center gap-4 py-5">
              <div className="flex h-10 w-10 items-center justify-center bg-[rgba(255,201,25,0.1)]"><Ticket className="h-5 w-5 text-[var(--gold-bar)]" /></div>
              <div><p className="font-[var(--font-lexend)] font-semibold text-[var(--ice-white)]">My Tickets</p><p className="text-xs text-[rgba(245,246,252,0.4)]">View all your tickets</p></div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/billing">
          <Card className="cursor-pointer border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)] transition-all hover:border-[var(--gold-bar)] hover:bg-[rgba(255,201,25,0.03)]">
            <CardContent className="flex items-center gap-4 py-5">
              <div className="flex h-10 w-10 items-center justify-center bg-[rgba(255,201,25,0.1)]"><CreditCard className="h-5 w-5 text-[var(--gold-bar)]" /></div>
              <div><p className="font-[var(--font-lexend)] font-semibold text-[var(--ice-white)]">Billing</p><p className="text-xs text-[rgba(245,246,252,0.4)]">Plan, credits & payments</p></div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* SECTION 6 — PM */}
      <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
        <CardHeader><CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)] text-base">Your Project Manager</CardTitle></CardHeader>
        <CardContent>
          {pm ? (
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center bg-[var(--gold-bar)] text-[var(--asphalt-black)] font-bold text-lg">{pm?.name?.charAt(0) || "PM"}</div>
              <div>
                <p className="font-medium text-[var(--ice-white)]">{pm?.name || "Project Manager"}</p>
                <a href={`mailto:${pm.email}`} className="text-xs text-[rgba(245,246,252,0.4)] hover:text-[var(--gold-bar)] flex items-center gap-1"><Mail className="h-3 w-3" />{pm.email}</a>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-[rgba(245,246,252,0.4)]">
              <User className="h-8 w-8" />
              <p className="text-sm">Your PM will be assigned with your first request.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
