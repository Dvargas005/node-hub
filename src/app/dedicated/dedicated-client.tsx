"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PlanInfo {
  name: string;
  slug: string;
  priceMonthly: number;
  monthlyCredits: number;
  maxActiveReqs: number;
  deliveryDays: number;
  minTermMonths: number;
  configured: boolean;
}

const TAGLINE: Record<string, string> = {
  "dedicated-light": "For teams getting started with managed creative.",
  "dedicated-jump": "Scale up across Web, Design & Graphics.",
  "dedicated-pro": "Maximum throughput — your dedicated creative engine.",
};

export function DedicatedClient({
  isLoggedIn,
  activePlanName,
  plans,
}: {
  isLoggedIn: boolean;
  activePlanName: string | null;
  plans: PlanInfo[];
}) {
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleSubscribe = async (slug: string) => {
    setLoadingSlug(slug);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug: slug }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error || "Could not start payment. Please try again.");
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoadingSlug(null);
    }
  };

  return (
    <div className="relative min-h-screen bg-[var(--asphalt-black)] overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(255,201,25,0.4), transparent 60%)",
        }}
      />

      <div className="relative flex min-h-screen flex-col items-center px-4 py-12">
        <Link
          href="/"
          className="mb-8 font-[var(--font-lexend)] text-2xl font-black tracking-widest text-[var(--ice-white)] hover:text-[var(--gold-bar)] transition-colors"
        >
          N.O.D.E.
        </Link>

        <div className="text-center mb-10 max-w-2xl">
          <p className="font-[var(--font-atkinson)] text-xs uppercase tracking-[0.3em] text-[var(--gold-bar)] mb-3">
            Dedicated Growth
          </p>
          <h1 className="font-[var(--font-lexend)] text-3xl md:text-4xl font-black text-[var(--ice-white)] mb-3">
            All managed services in Web, Design & Graphics
          </h1>
          <p className="font-[var(--font-atkinson)] text-sm text-[rgba(245,246,252,0.7)]">
            Billed monthly · 3-month minimum commitment. Each plan includes its full
            value in monthly credits to spend across the catalog.
          </p>
        </div>

        {error && (
          <div className="mb-6 text-sm text-red-400 text-center">{error}</div>
        )}

        <div className="grid w-full max-w-5xl gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const highlight = plan.slug === "dedicated-jump";
            return (
              <div
                key={plan.slug}
                className={`flex flex-col border bg-[rgba(255,255,255,0.02)] backdrop-blur-sm p-8 ${
                  highlight
                    ? "border-[var(--gold-bar)]"
                    : "border-[rgba(255,201,25,0.25)]"
                }`}
              >
                <p className="font-[var(--font-lexend)] text-lg font-bold text-[var(--ice-white)]">
                  {plan.name}
                </p>
                <p className="mt-1 mb-5 min-h-[40px] font-[var(--font-atkinson)] text-xs text-[rgba(245,246,252,0.6)]">
                  {TAGLINE[plan.slug] ?? ""}
                </p>

                <div className="font-[var(--font-lexend)] text-4xl font-black text-[var(--ice-white)]">
                  ${(plan.priceMonthly / 100).toLocaleString("en-US")}
                  <span className="text-base font-normal text-[rgba(245,246,252,0.5)] ml-1">
                    /mo
                  </span>
                </div>

                <div className="border-t border-[rgba(255,201,25,0.2)] my-6" />

                <ul className="space-y-3 mb-8 flex-1 font-[var(--font-atkinson)] text-sm text-[var(--ice-white)]">
                  <FeatureItem>
                    {plan.monthlyCredits.toLocaleString("en-US")} credits / month
                    (1:1 USD)
                  </FeatureItem>
                  <FeatureItem>
                    {plan.maxActiveReqs >= 999
                      ? "Unlimited active requests"
                      : `${plan.maxActiveReqs} active requests`}
                  </FeatureItem>
                  <FeatureItem>{plan.deliveryDays}-day turnaround</FeatureItem>
                  <FeatureItem>Web, Design & Graphics — fully managed</FeatureItem>
                  <FeatureItem>{plan.minTermMonths}-month minimum commitment</FeatureItem>
                </ul>

                {!isLoggedIn ? (
                  <Link href={`/register?redirect=/dedicated`} className="block">
                    <Button
                      className={`w-full font-bold ${
                        highlight
                          ? "bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90"
                          : "border border-[var(--gold-bar)] bg-transparent text-[var(--gold-bar)] hover:bg-[var(--gold-bar)] hover:text-[var(--asphalt-black)]"
                      }`}
                    >
                      Get started →
                    </Button>
                  </Link>
                ) : activePlanName ? (
                  <div className="text-center font-[var(--font-atkinson)] text-xs text-[rgba(245,246,252,0.6)]">
                    Active plan: {activePlanName}.{" "}
                    <Link
                      href="/messages"
                      className="text-[var(--gold-bar)] hover:underline"
                    >
                      Contact us to change →
                    </Link>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleSubscribe(plan.slug)}
                    disabled={loadingSlug !== null || !plan.configured}
                    title={!plan.configured ? "Not available yet" : undefined}
                    className={`w-full font-bold disabled:opacity-50 disabled:cursor-not-allowed ${
                      highlight
                        ? "bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90"
                        : "border border-[var(--gold-bar)] bg-transparent text-[var(--gold-bar)] hover:bg-[var(--gold-bar)] hover:text-[var(--asphalt-black)]"
                    }`}
                  >
                    {loadingSlug === plan.slug
                      ? "Starting…"
                      : !plan.configured
                        ? "Coming soon"
                        : "Subscribe →"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-xs text-[rgba(245,246,252,0.3)] font-[var(--font-atkinson)]">
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
