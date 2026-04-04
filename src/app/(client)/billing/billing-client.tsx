"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Check, CreditCard, Zap, Crown, ArrowRight, AlertTriangle, Loader2, Package,
} from "lucide-react";

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
  member: ["140 créditos/mes", "1 solicitud activa", "Entrega en 5 días", "Soporte por email"],
  growth: ["350 créditos/mes", "2 solicitudes activas", "Entrega en 3 días", "PM dedicado", "Soporte prioritario"],
  pro: ["650 créditos/mes", "Solicitudes ilimitadas", "Entrega 24-48h", "PM dedicado", "Soporte 24/7", "Todos los servicios"],
};

export function BillingClient({
  plans, subscription, creditPacks, freeCredits, allianceDiscount,
}: {
  plans: Plan[]; subscription: Sub | null; creditPacks: CreditPack[];
  freeCredits: number; allianceDiscount: number;
}) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingPack, setLoadingPack] = useState<string | null>(null);
  const [error, setError] = useState("");

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
        body: JSON.stringify({ planSlug }),
      });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; return; }
      setError(data.error || "Error al iniciar el pago");
    } catch { setError("Error de conexión"); } finally { setLoadingPlan(null); }
  };

  const handlePortal = async () => {
    setError("");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; return; }
      setError(data.error || "Error al abrir portal");
    } catch { setError("Error de conexión"); }
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
      setError(data.error || "Error al iniciar el pago");
    } catch { setError("Error de conexión"); } finally { setLoadingPack(null); }
  };

  const applyDiscount = (cents: number) =>
    allianceDiscount > 0 ? Math.round(cents * (1 - allianceDiscount / 100)) : cents;

  const showPricing = !isActive || isCanceled;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[var(--font-lexend)] text-2xl font-bold text-[var(--ice-white)]">Facturación</h1>
        <p className="mt-1 text-[rgba(245,246,252,0.5)]">
          {isActive ? "Gestiona tu suscripción y créditos" : "Elige tu plan para empezar"}
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
              <p className="text-sm text-yellow-400 font-medium">Tu pago no se pudo procesar</p>
              <p className="text-xs text-[rgba(245,246,252,0.5)] mt-1">Actualiza tu método de pago para mantener tu plan activo.</p>
              <Button onClick={handlePortal} size="sm" className="mt-2 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs">
                Actualizar pago
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
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 mt-1">Activo</Badge>
              </div>
              <div className="text-right">
                <p className="font-[var(--font-lexend)] text-3xl font-bold text-[var(--gold-bar)]">{totalCredits}</p>
                <p className="text-xs text-[rgba(245,246,252,0.4)]">créditos disponibles</p>
                {freeCredits > 0 && (
                  <p className="text-[10px] text-[rgba(245,246,252,0.3)]">{freeCredits} gratis + {subscription.creditsRemaining} del plan</p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm text-[rgba(245,246,252,0.5)]">
              <span>Próxima renovación</span>
              <span>{new Date(subscription.currentPeriodEnd).toLocaleDateString("es-MX")}</span>
            </div>
            {/* Low credits warning */}
            {subscription.creditsRemaining < subscription.monthlyCredits * 0.2 && (
              <div className="flex items-center gap-2 bg-yellow-500/5 border border-yellow-500/20 p-2 text-xs text-yellow-400">
                <AlertTriangle className="h-3 w-3" />
                Créditos bajos — compra un pack extra abajo
              </div>
            )}
            {subscription.hasStripeCustomer && (
              <Button onClick={handlePortal} variant="outline" className="w-full border-[rgba(245,246,252,0.2)] text-[var(--ice-white)] hover:bg-[rgba(255,255,255,0.05)]">
                Gestionar suscripción en Stripe
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pricing cards */}
      {showPricing && (
        <div>
          <h2 className="font-[var(--font-lexend)] text-lg font-semibold text-[var(--ice-white)] mb-4">
            {isCanceled ? "Reactiva tu plan" : "Elige tu plan"}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan: any) => {
              const Icon = planIcons[plan.slug] || CreditCard;
              const features = planFeatures[plan.slug] || [];
              const isFeatured = plan.slug === "growth";
              const discountedPrice = applyDiscount(plan.priceMonthly);
              const hasDiscount = discountedPrice < plan.priceMonthly;

              return (
                <Card key={plan.id} className={`relative border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)] transition-transform hover:-translate-y-1 ${isFeatured ? "border-[var(--gold-bar)] shadow-[0_0_30px_rgba(255,201,25,0.08)]" : ""}`}>
                  {isFeatured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-[var(--gold-bar)] text-[var(--asphalt-black)] font-bold">Más popular</Badge>
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
                      <span className="text-[rgba(245,246,252,0.5)]">/mes</span>
                    </div>
                    <p className="text-xs text-[rgba(245,246,252,0.4)]">Setup: ${plan.setupFee / 100} USD (una vez)</p>
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
                       !plan.stripePriceId ? "Próximamente" : "Suscribirme"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {allianceDiscount > 0 && (
            <p className="mt-3 text-center text-xs text-[var(--gold-bar)]">
              Descuento de alianza: {allianceDiscount}% aplicado
            </p>
          )}
        </div>
      )}

      {/* Credit packs */}
      {isActive && creditPacks.length > 0 && (
        <div>
          <h2 className="font-[var(--font-lexend)] text-lg font-semibold text-[var(--ice-white)] mb-4">
            Créditos extra
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {creditPacks.map((pack: any) => (
              <Card key={pack.id} className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
                <CardContent className="py-4 text-center space-y-2">
                  <Package className="h-6 w-6 text-[var(--gold-bar)] mx-auto" />
                  <p className="font-[var(--font-lexend)] font-bold text-[var(--ice-white)]">{pack.name}</p>
                  <p className="text-2xl font-bold text-[var(--gold-bar)]">{pack.credits} <span className="text-sm font-normal">créditos</span></p>
                  <p className="text-sm text-[rgba(245,246,252,0.5)]">${pack.priceInCents / 100} USD</p>
                  <Button
                    onClick={() => handleBuyPack(pack.id)}
                    disabled={loadingPack === pack.id || !pack.stripePriceId}
                    variant="outline"
                    className="w-full border-[var(--gold-bar)]/30 text-[var(--gold-bar)] hover:bg-[rgba(255,201,25,0.1)] disabled:opacity-50"
                  >
                    {loadingPack === pack.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Comprar <ArrowRight className="ml-1 h-3 w-3" /></>}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
