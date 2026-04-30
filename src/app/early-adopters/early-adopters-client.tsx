"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

interface PlanInfo {
  name: string;
  slug: string;
  priceMonthly: number;
  monthlyCredits: number;
  maxActiveReqs: number;
  deliveryDays: number;
}

export function EarlyAdoptersClient({
  isLoggedIn,
  activePlanName,
  plan,
}: {
  isLoggedIn: boolean;
  activePlanName: string | null;
  plan: PlanInfo | null;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubscribe = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug: "early-adopters" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error || t("common.errorStartingPayment"));
    } catch {
      setError(t("common.connectionError"));
    } finally {
      setLoading(false);
    }
  };

  const priceLabel = plan ? `$${(plan.priceMonthly / 100).toFixed(0)}` : "$91";

  return (
    <div className="relative min-h-screen bg-[var(--asphalt-black)] overflow-hidden">
      {/* Subtle radial accent */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(255,201,25,0.4), transparent 60%)",
        }}
      />

      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
        {/* Logo */}
        <Link
          href="/"
          className="mb-10 font-[var(--font-lexend)] text-2xl font-black tracking-widest text-[var(--ice-white)] hover:text-[var(--gold-bar)] transition-colors"
        >
          N.O.D.E.
        </Link>

        {/* Card */}
        <div className="w-full max-w-md border border-[var(--gold-bar)] bg-[rgba(255,255,255,0.02)] backdrop-blur-sm p-8 md:p-10">
          <div className="text-center mb-8">
            <p className="font-[var(--font-atkinson)] text-xs uppercase tracking-[0.3em] text-[var(--gold-bar)] mb-3">
              {t("earlyAdopters.title").toUpperCase()}
            </p>
            <p className="font-[var(--font-atkinson)] text-sm text-[rgba(245,246,252,0.7)] mb-6">
              {t("earlyAdopters.subtitle")}
            </p>
            <div className="font-[var(--font-lexend)] text-5xl font-black text-[var(--ice-white)]">
              {priceLabel}
              <span className="text-base font-normal text-[rgba(245,246,252,0.5)] ml-1">
                /mo
              </span>
            </div>
          </div>

          <div className="border-t border-[rgba(255,201,25,0.2)] my-6" />

          <ul className="space-y-3 mb-8 font-[var(--font-atkinson)] text-sm text-[var(--ice-white)]">
            <FeatureItem>{t("earlyAdopters.features.credits")}</FeatureItem>
            <FeatureItem>{t("earlyAdopters.features.requests")}</FeatureItem>
            <FeatureItem>{t("earlyAdopters.features.delivery")}</FeatureItem>
            <FeatureItem>{t("earlyAdopters.features.catalog")}</FeatureItem>
            <FeatureItem>{t("earlyAdopters.features.pm")}</FeatureItem>
            <FeatureItem>{t("earlyAdopters.features.noSetup")}</FeatureItem>
          </ul>

          {error && (
            <div className="mb-4 text-sm text-red-400 text-center">{error}</div>
          )}

          {!isLoggedIn ? (
            <div className="space-y-3">
              <Link href="/register?redirect=/early-adopters" className="block">
                <Button className="w-full bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold">
                  {t("earlyAdopters.cta")} →
                </Button>
              </Link>
              <Link
                href="/login?callbackUrl=/early-adopters"
                className="block text-center text-sm text-[rgba(245,246,252,0.6)] hover:text-[var(--gold-bar)] transition-colors"
              >
                {t("earlyAdopters.login")} →
              </Link>
            </div>
          ) : activePlanName ? (
            <div className="space-y-3 text-center">
              <p className="font-[var(--font-atkinson)] text-sm text-[rgba(245,246,252,0.7)]">
                {t("earlyAdopters.alreadyActive")} ({activePlanName}).
              </p>
              <Link href="/dashboard" className="block">
                <Button className="w-full bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold">
                  {t("earlyAdopters.goToDashboard")} →
                </Button>
              </Link>
              <Link
                href="/messages"
                className="block text-sm text-[rgba(245,246,252,0.6)] hover:text-[var(--gold-bar)] transition-colors"
              >
                {t("earlyAdopters.contactSupport")} →
              </Link>
            </div>
          ) : (
            <Button
              onClick={handleSubscribe}
              disabled={loading || !plan}
              className="w-full bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? t("earlyAdopters.subscribing")
                : `${t("earlyAdopters.subscribe")} →`}
            </Button>
          )}
        </div>

        <p className="mt-8 text-xs text-[rgba(245,246,252,0.3)] font-[var(--font-atkinson)]">
          Powered by Nouvos
        </p>
      </div>
    </div>
  );
}

function FeatureItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="text-[var(--gold-bar)] flex-shrink-0 mt-0.5">✓</span>
      <span>{children}</span>
    </li>
  );
}
