"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Check, CreditCard, Zap, Crown, ArrowRight, AlertTriangle, Loader2, Package, Tag,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface Plan {
  id: string; name: string; slug: string; priceMonthly: number;
  setupFee: number; monthlyCredits: number; maxActiveReqs: number;
  deliveryDays: number; stripePriceId: string | null;
}

interface Sub {
  id: string; status: string; planSlug: string; planName: string;
  creditsRemaining: number; monthlyCredits: number;
  currentPeriodEnd: string; hasStripeCustomer: boolean;
}

interface CreditPack {
  id: string; name: string; credits: number;
  priceInCents: number; stripePriceId: string | null;
}

const planIcons: Record<string, typeof CreditCard> = {
  member: CreditCard, growth: Zap, pro: Crown,
};

const planFeatures: Record<string, string[]> = {
  member: ["140 credits/mo", "1 active request", "Delivery in 5 days", "Email support"],
  growth: ["350 credits/mo", "2 active requests", "Delivery in 3 days", "Dedicated PM", "Priority support"],
  pro: ["650 credits/mo", "Unlimited requests", "Delivery 24-48h", "Dedicated PM", "24/7 support", "All services"],
};

export function BillingClient({
  plans, subscription, creditPacks, freeCredits, allianceDiscount,
}: {
  plans: Plan[]; subscription: Sub | null; creditPacks: CreditPack[];
  freeCredits: number; allianceDiscount: number;
}) {
  const { t } = useTranslation();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingPack, setLoadingPack] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [customAmount, setCustomAmount] = useState(20);
  const [loadingCustom, setLoadingCustom] = useState(false);

  const totalCredits = freeCredits + (subscription?.creditsRemaining || 0);
  const isActive = subscription?.status === "ACTIVE";
  const isPastDue = subscription?.status === "PAST_DUE";
  const isCanceled = subscription?.status === "CANCELED";

  const handleSubscribe = async (planSlug: string) => {
    setLoadingPlan(planSlug);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug, promoCode: promoApplied ? promoCode : undefined }),
      });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; return; }
      setError(data.error || "Error starting payment");
    } catch { setError("Connection error"); } finally { setLoadingPlan(null); }
  };

  const handlePortal = async () => {
    setError("");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; return; }
      setError(data.error || "Error opening portal");
    } catch { setError("Connection error"); }
  };

  const handleBuyPack = async (packId: string) => {
    setLoadingPack(packId);
    setError("");
    try {
      const res = await fetch("/api/stripe/credit-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; return; }
      setError(data.error || "Error starting payment");
    } catch { setError("Connection error"); } finally { setLoadingPack(null); }
  };

  const handleBuyCustom = async () => {
    setLoadingCustom(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/credit-pack-custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: customAmount }),
      });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; return; }
      setError(data.error || "Error starting payment");
    } catch { setError("Connection error"); } finally { setLoadingCustom(false); }
  };

  const effectiveDiscount = promoApplied && promoDiscount > 0 ? promoDiscount : allianceDiscount;
  const applyDiscount = (cents: number) =>
    effectiveDiscount > 0 ? Math.round(cents * (1 - effectiveDiscount / 100)) : cents;

  const showPricing = !isActive || isCanceled;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[var(--font-lexend)] text-2xl font-bold text-[var(--ice-white)]">Billing</h1>
        <p className="mt-1 text-[rgba(245,246,252,0.5)]">
          {isActive ? "Manage your subscription and credits" : "Choose your plan to get started"}
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-3">{error}</div>
      )}

      {/* Past due warning */}
      {isPastDue && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="py-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0" />
            <div>
              <p className="text-sm text-yellow-400 font-medium">Your payment couldn't be processed</p>
              <p className="text-xs text-[rgba(245,246,252,0.5)] mt-1">Update your payment method to keep your plan active.</p>
              <Button onClick={handlePortal} size="sm" className="mt-2 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs">
                Update payment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active subscription info */}
      {isActive && subscription && (
        <Card className="border-[var(--gold-bar)] bg-[rgba(255,201,25,0.03)]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)]">
                  Plan {subscription.planName}
                </CardTitle>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 mt-1">Active</Badge>
              </div>
              <div className="text-right">
                <p className="font-[var(--font-lexend)] text-3xl font-bold text-[var(--gold-bar)]">{totalCredits}</p>
                <p className="text-xs text-[rgba(245,246,252,0.4)]">available credits</p>
                {freeCredits > 0 && (
                  <p className="text-[10px] text-[rgba(245,246,252,0.3)]">{freeCredits} free + {subscription.creditsRemaining} from plan</p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm text-[rgba(245,246,252,0.5)]">
              <span>Next renewal</span>
              <span>{new Date(subscription.currentPeriodEnd).toLocaleDateString("es-MX")}</span>
            </div>
            {/* Low credits warning */}
            {subscription.creditsRemaining < subscription.monthlyCredits * 0.2 && (
              <div className="flex items-center gap-2 bg-yellow-500/5 border border-yellow-500/20 p-2 text-xs text-yellow-400">
                <AlertTriangle className="h-3 w-3" />
                Low credits — buy an extra pack below
              </div>
            )}
            {subscription.hasStripeCustomer && (
              <Button onClick={handlePortal} variant="outline" className="w-full border-[rgba(245,246,252,0.2)] text-[var(--ice-white)] hover:bg-[rgba(255,255,255,0.05)]">
                Manage subscription in Stripe
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pricing cards */}
      {showPricing && (
        <div>
          <h2 className="font-[var(--font-lexend)] text-lg font-semibold text-[var(--ice-white)] mb-4">
            {isCanceled ? "Reactivate your plan" : "Choose your plan"}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan: any) => {
              const Icon = planIcons[plan.slug] || CreditCard;
              const features = planFeatures[plan.slug] || [];
              const isFeatured = plan.slug === "growth";
              const discountedPrice = applyDiscount(plan.priceMonthly);
              const hasDiscount = discountedPrice < plan.priceMonthly;

              return (
                <Card key={plan.id} className={`relative overflow-visible border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)] transition-transform hover:-translate-y-1 ${isFeatured ? "border-[var(--gold-bar)] shadow-[0_0_30px_rgba(255,201,25,0.08)]" : ""}`}>
                  {isFeatured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-[var(--gold-bar)] text-[var(--asphalt-black)] font-bold whitespace-nowrap">Most popular</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pt-6">
                    <Icon className="mx-auto mb-2 h-8 w-8 text-[var(--gold-bar)]" />
                    <CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)]">{plan.name}</CardTitle>
                    <div className="mt-2">
                      {hasDiscount && (
                        <span className="text-sm text-[rgba(245,246,252,0.4)] line-through mr-2">${plan.priceMonthly / 100}</span>
                      )}
                      <span className="font-[var(--font-lexend)] text-3xl font-bold text-[var(--ice-white)]">
                        ${discountedPrice / 100}
                      </span>
                      <span className="text-[rgba(245,246,252,0.5)]">/mo</span>
                    </div>
                    <p className="text-xs text-[rgba(245,246,252,0.4)]">Setup: ${plan.setupFee / 100} USD {t("billing.oneTime")}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-6">
                      {features.map((f: any) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-[rgba(245,246,252,0.7)]">
                          <Check className="h-4 w-4 text-[var(--gold-bar)] shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={() => handleSubscribe(plan.slug)}
                      disabled={loadingPlan === plan.slug || !plan.stripePriceId}
                      className={`w-full font-bold disabled:opacity-50 disabled:cursor-not-allowed ${
                        isFeatured
                          ? "bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90"
                          : "bg-[rgba(255,255,255,0.1)] text-[var(--ice-white)] hover:bg-[rgba(255,255,255,0.15)]"
                      }`}
                    >
                      {loadingPlan === plan.slug ? <Loader2 className="h-4 w-4 animate-spin" /> :
                       !plan.stripePriceId ? "Coming soon" : "Subscribe"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {effectiveDiscount > 0 && (
            <p className="mt-3 text-center text-xs text-[var(--gold-bar)]">
              {promoApplied ? `Code ${promoCode}: ${promoDiscount}% discount applied` : `Alliance discount: ${allianceDiscount}% applied`}
            </p>
          )}

          {/* Promo code input */}
          {!promoApplied && (
            <div className="mt-4 flex items-center gap-2 max-w-sm mx-auto">
              <Tag className="h-4 w-4 text-[rgba(245,246,252,0.4)] shrink-0" />
              <Input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Promo code"
                className="flex-1 h-9 border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)] text-sm"
              />
              <Button
                size="sm"
                disabled={!promoCode.trim()}
                onClick={async () => {
                  // Validate by checking known codes client-side (Stripe validates at checkout)
                  const knownCodes: Record<string, number> = { SOMOSLEN: 30, NOUVOSVIP: 7 };
                  const discount = knownCodes[promoCode.trim()];
                  if (discount) {
                    setPromoApplied(true);
                    setPromoDiscount(discount);
                  } else {
                    setError("Invalid code. You can enter it directly at checkout.");
                  }
                }}
                className="bg-[rgba(255,255,255,0.1)] text-[var(--ice-white)] hover:bg-[rgba(255,255,255,0.15)] text-xs h-9"
              >
                Apply
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Smart projection */}
      {showPricing && <BillingProjection />}

      {/* Credit packs */}
      {isActive && creditPacks.length > 0 && (
        <div>
          <h2 className="font-[var(--font-lexend)] text-lg font-semibold text-[var(--ice-white)] mb-4">
            Extra credits
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {creditPacks.map((pack: any) => (
              <Card key={pack.id} className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
                <CardContent className="py-4 text-center space-y-2">
                  <Package className="h-6 w-6 text-[var(--gold-bar)] mx-auto" />
                  <p className="font-[var(--font-lexend)] font-bold text-[var(--ice-white)]">{pack.name}</p>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[9px]">1:1</Badge>
                  <p className="text-2xl font-bold text-[var(--gold-bar)]">{pack.credits} <span className="text-sm font-normal">credits</span></p>
                  <p className="text-sm text-[rgba(245,246,252,0.5)]">${pack.priceInCents / 100} USD</p>
                  <Button
                    onClick={() => handleBuyPack(pack.id)}
                    disabled={loadingPack === pack.id || !pack.stripePriceId}
                    variant="outline"
                    className="w-full border-[var(--gold-bar)]/30 text-[var(--gold-bar)] hover:bg-[rgba(255,201,25,0.1)] disabled:opacity-50"
                  >
                    {loadingPack === pack.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Buy <ArrowRight className="ml-1 h-3 w-3" /></>}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Custom credit amount */}
      {isActive && (
        <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
          <CardHeader>
            <CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)] text-base">
              {t("billing.customCredits")}
            </CardTitle>
            <p className="text-xs text-[rgba(245,246,252,0.5)] mt-1">{t("billing.customCredits.subtitle")}</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => setCustomAmount((prev: number) => Math.max(5, prev - 5))}
                    disabled={customAmount <= 5}
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0 border-[rgba(245,246,252,0.2)] text-[var(--ice-white)]"
                  >
                    −
                  </Button>
                  <Input
                    type="number"
                    min={5}
                    max={9999}
                    value={customAmount}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      if (Number.isFinite(v)) setCustomAmount(Math.min(9999, Math.max(5, v)));
                      else setCustomAmount(5);
                    }}
                    className="flex-1 h-9 text-center border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)]"
                  />
                  <Button
                    type="button"
                    onClick={() => setCustomAmount((prev: number) => Math.min(9999, prev + 5))}
                    disabled={customAmount >= 9999}
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0 border-[rgba(245,246,252,0.2)] text-[var(--ice-white)]"
                  >
                    +
                  </Button>
                </div>
                <p className="mt-2 text-xs text-[rgba(245,246,252,0.5)]">
                  ${customAmount} = {customAmount} credits
                </p>
                <p className="text-[10px] text-[rgba(245,246,252,0.4)]">
                  {t("billing.customCredits.min")} · {t("billing.customCredits.max")}
                </p>
              </div>
              <Button
                onClick={handleBuyCustom}
                disabled={loadingCustom || customAmount < 5 || customAmount > 9999}
                className="bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold"
              >
                {loadingCustom ? <Loader2 className="h-4 w-4 animate-spin" /> : t("billing.customCredits.buy")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!isActive && (
        <p className="text-xs text-[rgba(245,246,252,0.5)] text-center">
          {t("billing.customCredits.requiresPlan")}
        </p>
      )}
    </div>
  );
}

// ─── Billing Projection ─────────────────────────────
interface MonthData { month: number; suggestedServices: { name: string; credits: number; category: string }[]; totalCredits: number; remaining: number }
interface Projection { planSlug: string; planName: string; priceMonthly: number; monthlyCredits: number; tagline: string; months: MonthData[]; verdict: string }

const verdictColors: Record<string, string> = {
  insuficiente: "bg-red-500/20 text-red-400 border-red-500/30",
  justo: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  holgado: "bg-green-500/20 text-green-400 border-green-500/30",
};
const verdictLabels: Record<string, string> = { insuficiente: "Insufficient", justo: "Just right", holgado: "Comfortable" };
const catEmoji: Record<string, string> = { DESIGN: "🎨", WEB: "💻", MARKETING: "📱" };

function BillingProjection() {
  const [data, setData] = useState<{ projections: Projection[]; recommended: string | null } | null>(null);
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/billing/projection")
      .then((r) => r.json())
      .then((d: any) => {
        if (d.projections) setData(d);
        else if (d.reason) setReason(d.reason);
      })
      .catch(() => {});
  }, []);

  if (reason === "no_priorities") {
    return (
      <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
        <CardContent className="py-6 text-center">
          <p className="text-sm text-[rgba(245,246,252,0.5)]">
            Complete your business profile to see a personalized plan recommendation.
          </p>
          <Link href="/dashboard" className="text-xs text-[var(--gold-bar)] hover:underline mt-2 inline-block">
            Go to dashboard
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div>
      <h2 className="font-[var(--font-lexend)] text-lg font-semibold text-[var(--ice-white)] mb-2">
        Which plan is right for you?
      </h2>
      <p className="text-xs text-[rgba(245,246,252,0.4)] mb-4">Estimate based on your business needs</p>

      <div className="grid gap-4 md:grid-cols-3">
        {data.projections.map((p: any) => {
          const isRec = p.planSlug === data.recommended;
          return (
            <Card key={p.planSlug} className={`border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)] ${isRec ? "border-[var(--gold-bar)] shadow-[0_0_20px_rgba(255,201,25,0.06)]" : ""}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)] text-sm">{p.planName}</CardTitle>
                  {isRec && <Badge className="bg-[var(--gold-bar)]/20 text-[var(--gold-bar)] border-[var(--gold-bar)]/30 text-[9px]">Recommended for you</Badge>}
                </div>
                <p className="text-xs text-[rgba(245,246,252,0.4)]">${p.priceMonthly / 100}/mo — {p.monthlyCredits} credits</p>
                <p className="text-[11px] text-[rgba(245,246,252,0.5)] italic mt-1">{p.tagline}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {p.months.map((m: any) => (
                  <div key={m.month} className="space-y-1">
                    <p className="text-[10px] font-medium text-[rgba(245,246,252,0.5)]">Month {m.month}</p>
                    {m.suggestedServices.length === 0 ? (
                      <p className="text-[10px] text-[rgba(245,246,252,0.3)]">No suggested services</p>
                    ) : (
                      <div className="space-y-0.5">
                        {m.suggestedServices.map((s: any, i: number) => (
                          <div key={i} className="flex justify-between text-[10px]">
                            <span className="text-[rgba(245,246,252,0.6)]">{catEmoji[s.category] || ""} {s.name}</span>
                            <span className="text-[rgba(245,246,252,0.4)] font-mono">{s.credits}cr</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Progress bar */}
                    {m.totalCredits > 0 && (
                      <div>
                        <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.1)] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${m.remaining >= 0 ? "bg-green-500" : "bg-red-500"}`}
                            style={{ width: `${Math.min((m.totalCredits / p.monthlyCredits) * 100, 100)}%` }}
                          />
                        </div>
                        <p className={`text-[9px] mt-0.5 ${m.remaining >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {m.remaining >= 0 ? `+${m.remaining} remaining` : `${m.remaining} short`}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                <Separator className="bg-[rgba(245,246,252,0.06)]" />
                <div className="flex items-center justify-between">
                  <Badge className={verdictColors[p.verdict] || ""}>{verdictLabels[p.verdict] || p.verdict}</Badge>
                  <span className="text-[10px] text-[rgba(245,246,252,0.4)]">3 months: ${p.priceMonthly * 3 / 100}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
