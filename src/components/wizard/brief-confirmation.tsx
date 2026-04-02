"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

interface BriefDetails {
  objective: string;
  audience: string;
  style: string;
  references: string;
  deadline: string;
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
}

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
  onConfirm: () => void;
  onAdjust: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const hasSubscription = !!subscription;
  const hasEnoughCredits =
    hasSubscription &&
    variant &&
    subscription.creditsRemaining >= variant.creditCost;

  const handleConfirm = () => {
    setConfirming(true);
    onConfirm();
  };

  const detailEntries = brief.details
    ? Object.entries(brief.details).filter(([, v]) => v && v !== "No mencionado" && v !== "N/A")
    : [];

  return (
    <div className="max-w-lg mx-auto py-6 space-y-4">
      <div className="text-center mb-6">
        <div className="inline-flex h-12 w-12 items-center justify-center bg-[rgba(255,201,25,0.1)] mb-3">
          <Check className="h-6 w-6 text-[var(--gold-bar)]" />
        </div>
        <h2 className="font-[var(--font-lexend)] text-xl font-bold text-[var(--ice-white)]">
          Confirma tu solicitud
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
                {variant?.name || "Variante sugerida"}
              </p>
            </div>
            {variant && (
              <div className="text-right">
                <p className="font-[var(--font-lexend)] text-2xl font-bold text-[var(--gold-bar)]">
                  {variant.creditCost}
                </p>
                <p className="text-xs text-[rgba(245,246,252,0.4)]">créditos</p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {variant && (
            <p className="text-xs text-[rgba(245,246,252,0.4)]">
              Entrega estimada: ~{variant.estimatedDays} días
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
                {expanded ? "Ocultar detalles" : "Ver detalles del brief"}
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
                        {key === "objective"
                          ? "Objetivo"
                          : key === "audience"
                            ? "Audiencia"
                            : key === "deliverable"
                              ? "Entregable"
                              : key === "content"
                                ? "Contenido"
                                : key === "style"
                                  ? "Estilo"
                                  : key === "references"
                                    ? "Referencias"
                                    : key === "deadline"
                                      ? "Plazo"
                                      : "Extra"}
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
      {hasSubscription && variant && (
        <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
          <CardContent className="py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[rgba(245,246,252,0.5)]">Tus créditos</span>
              <span className="text-[var(--ice-white)]">
                {subscription.creditsRemaining} disponibles
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-[rgba(245,246,252,0.5)]">Costo</span>
              <span className="text-[var(--gold-bar)] font-bold">
                -{variant.creditCost} créditos
              </span>
            </div>
            <Separator className="bg-[rgba(245,246,252,0.1)] my-2" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-[rgba(245,246,252,0.5)]">Después</span>
              <span className="text-[var(--ice-white)] font-bold">
                {subscription.creditsRemaining - variant.creditCost} créditos
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {!hasSubscription && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-none p-4">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-400 font-medium">
              Necesitas un plan activo para hacer solicitudes
            </p>
            <Link
              href="/billing"
              className="text-xs text-[var(--gold-bar)] hover:underline"
            >
              Ver planes disponibles
            </Link>
          </div>
        </div>
      )}

      {hasSubscription && !hasEnoughCredits && variant && (
        <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-none p-4">
          <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-400 font-medium">
              No tienes suficientes créditos
            </p>
            <p className="text-xs text-[rgba(245,246,252,0.5)]">
              Necesitas {variant.creditCost}, tienes{" "}
              {subscription.creditsRemaining}.
            </p>
            <Link
              href="/billing"
              className="text-xs text-[var(--gold-bar)] hover:underline"
            >
              Actualizar plan o comprar créditos
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
          Quiero ajustar algo
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!hasEnoughCredits || confirming}
          className="flex-1 bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold disabled:opacity-40"
        >
          {confirming ? "Creando..." : "Confirmar y crear ticket"}
        </Button>
      </div>
    </div>
  );
}
