"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, CreditCard, Zap, Crown } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  slug: string;
  priceMonthly: number;
  setupFee: number;
  monthlyCredits: number;
  maxActiveReqs: number;
  deliveryDays: number;
  stripePriceId: string | null;
}

interface Subscription {
  id: string;
  status: string;
  creditsRemaining: number;
  currentPeriodEnd: Date;
  stripeCustomerId: string | null;
  plan: Plan;
}

const planIcons: Record<string, typeof CreditCard> = {
  member: CreditCard,
  growth: Zap,
  pro: Crown,
};

const planFeatures: Record<string, string[]> = {
  member: [
    "140 créditos/mes",
    "1 solicitud activa",
    "Entrega en 5 días",
    "Soporte por email",
  ],
  growth: [
    "350 créditos/mes",
    "2 solicitudes activas",
    "Entrega en 3 días",
    "Soporte prioritario",
    "PM dedicado",
  ],
  pro: [
    "650 créditos/mes",
    "Solicitudes ilimitadas",
    "Entrega en 2 días",
    "Soporte 24/7",
    "PM dedicado",
    "Acceso a todos los servicios",
  ],
};

export function BillingClient({
  plans,
  subscription,
}: {
  plans: Plan[];
  subscription: Subscription | null;
}) {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [billingError, setBillingError] = useState("");

  const hasStripe = plans.some((p) => p.stripePriceId);

  const handleSubscribe = async (planSlug: string) => {
    setLoadingPlan(planSlug);
    setBillingError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setBillingError(data.error || "No se pudo iniciar el pago");
      }
    } catch {
      setBillingError("Error de conexión con Stripe");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handlePortal = async () => {
    setBillingError("");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setBillingError(data.error || "No se pudo abrir el portal");
      }
    } catch {
      setBillingError("Error de conexión con Stripe");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[var(--font-lexend)] text-2xl font-bold text-[var(--ice-white)]">
          Facturación
        </h1>
        <p className="mt-1 font-[var(--font-atkinson)] text-[rgba(245,246,252,0.5)]">
          Gestiona tu suscripción y créditos
        </p>
      </div>

      {billingError && (
        <div className="text-sm text-red-400 text-center bg-red-500/10 border border-red-500/20 rounded-md p-3">
          {billingError}
        </div>
      )}

      {/* Current subscription */}
      {subscription && (
        <>
          <Card className="border-[var(--gold-bar)] bg-[rgba(255,201,25,0.05)]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)]">
                    Plan {subscription.plan.name}
                  </CardTitle>
                  <CardDescription className="text-[rgba(245,246,252,0.5)]">
                    {subscription.status === "ACTIVE" ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        Activo
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                        {subscription.status}
                      </Badge>
                    )}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="font-[var(--font-lexend)] text-3xl font-bold text-[var(--gold-bar)]">
                    {subscription.creditsRemaining}
                  </p>
                  <p className="text-xs text-[rgba(245,246,252,0.5)]">
                    créditos restantes
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-sm text-[rgba(245,246,252,0.5)]">
                  Próxima renovación:{" "}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString(
                    "es-MX"
                  )}
                </p>
                {subscription.stripeCustomerId && (
                  <Button
                    variant="outline"
                    onClick={handlePortal}
                    className="border-[rgba(245,246,252,0.2)] text-[var(--ice-white)]"
                  >
                    Gestionar en Stripe
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          <Separator className="bg-[rgba(245,246,252,0.1)]" />
        </>
      )}

      {/* Plans grid */}
      <div>
        <h2 className="font-[var(--font-lexend)] text-lg font-semibold text-[var(--ice-white)] mb-4">
          {subscription ? "Cambiar de plan" : "Elige tu plan"}
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const Icon = planIcons[plan.slug] || CreditCard;
            const features = planFeatures[plan.slug] || [];
            const isCurrentPlan = subscription?.plan.slug === plan.slug;
            const isFeatured = plan.slug === "growth";

            return (
              <Card
                key={plan.id}
                className={`relative border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)] transition-transform hover:-translate-y-1 ${
                  isFeatured
                    ? "border-[var(--gold-bar)] shadow-[0_0_30px_rgba(255,201,25,0.08)]"
                    : ""
                }`}
              >
                {isFeatured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[var(--gold-bar)] text-[var(--asphalt-black)] font-bold">
                      Más popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <Icon className="mx-auto mb-2 h-8 w-8 text-[var(--gold-bar)]" />
                  <CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)]">
                    {plan.name}
                  </CardTitle>
                  <div className="mt-2">
                    <span className="font-[var(--font-lexend)] text-3xl font-bold text-[var(--ice-white)]">
                      ${plan.priceMonthly / 100}
                    </span>
                    <span className="text-[rgba(245,246,252,0.5)]">/mes</span>
                  </div>
                  <p className="text-xs text-[rgba(245,246,252,0.4)]">
                    Setup: ${plan.setupFee / 100} USD (una vez)
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm text-[rgba(245,246,252,0.7)]"
                      >
                        <Check className="h-4 w-4 text-[var(--gold-bar)] shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {isCurrentPlan ? (
                    <Button
                      disabled
                      className="w-full bg-[rgba(255,255,255,0.1)] text-[rgba(245,246,252,0.5)]"
                    >
                      Plan actual
                    </Button>
                  ) : !hasStripe ? (
                    <Button
                      disabled
                      className="w-full bg-[rgba(255,255,255,0.05)] text-[rgba(245,246,252,0.4)]"
                    >
                      Próximamente
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleSubscribe(plan.slug)}
                      disabled={loadingPlan === plan.slug}
                      className={`w-full font-bold ${
                        isFeatured
                          ? "bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90"
                          : "bg-[rgba(255,255,255,0.1)] text-[var(--ice-white)] hover:bg-[rgba(255,255,255,0.15)]"
                      }`}
                    >
                      {loadingPlan === plan.slug
                        ? "Redirigiendo..."
                        : "Suscribirme"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {!hasStripe && (
          <p className="mt-4 text-center text-sm text-[rgba(245,246,252,0.4)]">
            Pagos con Stripe próximamente. Contacta a tu PM para suscribirte
            manualmente.
          </p>
        )}
      </div>
    </div>
  );
}
