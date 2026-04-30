"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface BriefDetails {
  deliverable: string;
  style: string;
  content: string;
  extras: string;
}

interface BriefData {
  suggestedServiceSlug: string;
  suggestedVariantId: string;
  summary: string;
  details: BriefDetails;
}

interface VariantInfo {
  id: string;
  name: string;
  creditCost: number;
  estimatedDays: number;
  serviceName: string;
  serviceCategory: string;
}

interface SubscriptionInfo {
  creditsRemaining: number;
  planName: string;
  freeCredits?: number;
}

const detailLabelKeys: Record<string, string> = {
  deliverable: "wizard.detail.deliverable",
  style: "wizard.detail.style",
  content: "wizard.detail.content",
  extras: "wizard.detail.extras",
};

export function BriefConfirmation({
  brief,
  variant,
  subscription,
  onConfirm,
  onAdjust,
}: {
  brief: BriefData;
  variant: VariantInfo | null;
  subscription: SubscriptionInfo | null;
  onConfirm: () => Promise<void>;
  onAdjust: () => void;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const hasSubscription = !!subscription;
  const freeCredits = subscription?.freeCredits || 0;
  const totalAvailable = freeCredits + (subscription?.creditsRemaining || 0);
  const hasEnoughCredits =
    variant ? totalAvailable >= variant.creditCost : false;

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await onConfirm();
    } catch {
      setConfirming(false);
    }
  };

  const detailEntries = brief.details
    ? Object.entries(brief.details).filter(([k, v]) => k !== "pmAlert" && v && v !== "No mencionado" && v !== "Not mentioned" && v !== "N/A")
    : [];

  return (
    <div className="max-w-lg mx-auto py-6 space-y-4">
      <div className="text-center mb-6">
        <div className="inline-flex h-12 w-12 items-center justify-center bg-[rgba(255,201,25,0.1)] mb-3">
          <Check className="h-6 w-6 text-[var(--gold-bar)]" />
        </div>
        <h2 className="font-[var(--font-lexend)] text-xl font-bold text-[var(--ice-white)]">
          {t("wizard.confirmRequest")}
        </h2>
      </div>

      <Card className="border-[var(--gold-bar)] bg-[rgba(255,201,25,0.03)]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)] text-base">
                {variant?.serviceName || brief.suggestedServiceSlug}
              </CardTitle>
              <p className="text-sm text-[rgba(245,246,252,0.5)]">
                {variant?.name || t("wizard.suggestedVariant")}
              </p>
            </div>
            {variant && (
              <div className="text-right">
                <p className="font-[var(--font-lexend)] text-2xl font-bold text-[var(--gold-bar)]">
                  {variant.creditCost}
                </p>
                <p className="text-xs text-[rgba(245,246,252,0.4)]">{t("wizard.credits")}</p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {variant && (
            <p className="text-xs text-[rgba(245,246,252,0.4)]">
              {t("wizard.estimatedDelivery").replace("{days}", String(variant.estimatedDays))}
            </p>
          )}

          <Separator className="bg-[rgba(245,246,252,0.1)]" />

          <p className="text-sm text-[rgba(245,246,252,0.7)]">{brief.summary}</p>

          {detailEntries.length > 0 && (
            <>
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-[var(--gold-bar)] hover:underline"
              >
                {expanded ? t("wizard.hideDetails") : t("wizard.viewDetails")}
                {expanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
              {expanded && (
                <div className="space-y-2 bg-[rgba(255,255,255,0.02)] border border-[rgba(245,246,252,0.06)] p-3 text-xs">
                  {detailEntries.map(([key, value]) => (
                    <div key={key}>
                      <span className="text-[rgba(245,246,252,0.4)] capitalize">
                        {t(detailLabelKeys[key] || key)}
                        :{" "}
                      </span>
                      <span className="text-[rgba(245,246,252,0.7)]">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Credits info */}
      {variant && totalAvailable > 0 && (
        <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
          <CardContent className="py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[rgba(245,246,252,0.5)]">{t("wizard.yourCredits")}</span>
              <span className="text-[var(--ice-white)]">
                {t("wizard.creditsAvailable").replace("{count}", String(totalAvailable))}
              </span>
            </div>
            {freeCredits > 0 && (
              <p className="text-xs text-[rgba(245,246,252,0.3)] text-right">
                {t("wizard.freeFromPlan").replace("{free}", String(freeCredits)).replace("{plan}", String(subscription?.creditsRemaining || 0))}
              </p>
            )}
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-[rgba(245,246,252,0.5)]">{t("wizard.cost")}</span>
              <span className="text-[var(--gold-bar)] font-bold">
                -{variant.creditCost} {t("wizard.credits")}
              </span>
            </div>
            <Separator className="bg-[rgba(245,246,252,0.1)] my-2" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-[rgba(245,246,252,0.5)]">{t("wizard.after")}</span>
              <span className="text-[var(--ice-white)] font-bold">
                {totalAvailable - variant.creditCost} {t("wizard.credits")}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {!hasEnoughCredits && variant && (
        <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-none p-4">
          <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-400 font-medium">
              {t("wizard.insufficientCredits")}
            </p>
            <p className="text-xs text-[rgba(245,246,252,0.5)]">
              {t("wizard.needCredits").replace("{need}", String(variant.creditCost)).replace("{have}", String(totalAvailable))}
            </p>
            <Link
              href="/billing"
              className="text-xs text-[var(--gold-bar)] hover:underline"
            >
              {hasSubscription ? t("wizard.buyExtraCredits") : t("wizard.viewPlans")}
            </Link>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          onClick={onAdjust}
          className="flex-1 border-[rgba(245,246,252,0.2)] text-[var(--ice-white)] hover:bg-[rgba(255,255,255,0.05)]"
        >
          {t("wizard.adjustSomething")}
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!hasEnoughCredits || confirming}
          className="flex-1 bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold disabled:opacity-40"
        >
          {confirming ? t("common.creating") : t("wizard.confirmAndCreate")}
        </Button>
      </div>
    </div>
  );
}
