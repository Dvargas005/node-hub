"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import { CategorySelector, type ServiceSelection } from "@/components/wizard/category-selector";
import { ChatInterface } from "@/components/wizard/chat-interface";
import { BriefConfirmation } from "@/components/wizard/brief-confirmation";
import { TicketSuccess } from "@/components/wizard/ticket-success";

interface BriefData {
  suggestedServiceSlug: string;
  suggestedVariantId: string;
  summary: string;
  details: {
    deliverable: string;
    style: string;
    content: string;
    extras: string;
  };
  pmAlert?: string | null;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface VariantInfo {
  id: string;
  name: string;
  creditCost: number;
  estimatedDays: number;
  serviceName: string;
  serviceCategory: string;
}

interface TicketInfo {
  id: string;
  number: number;
  serviceName: string;
  variantName: string;
  creditsCharged: number;
  serviceSlug?: string;
}

type Step = "category" | "chat" | "confirm" | "success";

const STEP_INDEX: Record<Step, number> = { category: 0, chat: 1, confirm: 2, success: 2 };

export function RequestClient({
  subscription,
  recommendations,
}: {
  subscription: { creditsRemaining: number; planName: string; freeCredits?: number } | null;
  recommendations?: string[];
}) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category");
  const [step, setStep] = useState<Step>(initialCategory ? "chat" : "category");
  const [category, setCategory] = useState<string | undefined>(initialCategory || undefined);
  const [serviceSlug, setServiceSlug] = useState<string | undefined>();
  const [initialMessage, setInitialMessage] = useState<string | undefined>();
  const [brief, setBrief] = useState<BriefData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [variant, setVariant] = useState<VariantInfo | null>(null);
  const [ticket, setTicket] = useState<TicketInfo | null>(null);
  const [error, setError] = useState("");

  const steps = [
    { key: "select", label: t("wizard.step.select") },
    { key: "details", label: t("wizard.step.details") },
    { key: "confirm", label: t("wizard.step.confirm") },
  ];
  const currentStep = STEP_INDEX[step];

  const handleCategorySelect = (selection: ServiceSelection) => {
    setCategory(selection.category);
    setServiceSlug(selection.serviceSlug);
    setStep("chat");
  };

  const handleFreeText = (text: string) => {
    setInitialMessage(text);
    setServiceSlug(undefined);
    setStep("chat");
  };

  const handleBriefGenerated = async (briefData: BriefData, chatMessages: ChatMessage[]) => {
    setBrief(briefData);
    setMessages(chatMessages);

    try {
      const res = await fetch("/api/wizard/catalog");
      const data = await res.json();
      if (data.services) {
        for (const service of data.services) {
          const found = service.variants.find((v: { id: string }) => v.id === briefData.suggestedVariantId);
          if (found) {
            setVariant({ id: found.id, name: found.name, creditCost: found.creditCost, estimatedDays: found.estimatedDays, serviceName: service.name, serviceCategory: service.category });
            break;
          }
        }
      }
    } catch {
      setError(t("wizard.errorLoadingCatalog"));
      setStep("category");
      return;
    }
    setStep("confirm");
  };

  const handleConfirm = async () => {
    if (!brief || !variant) return;
    setError("");
    try {
      const res = await fetch("/api/wizard/create-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ briefStructured: brief, conversationMessages: messages, variantId: variant.id }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error creating ticket"); return; }
      setTicket(data.ticket);
      setStep("success");
    } catch {
      setError("Connection error");
    }
  };

  const handleAdjust = () => setStep("chat");

  return (
    <div className="space-y-6">
      <h1 className="font-[var(--font-lexend)] text-2xl font-bold text-[var(--ice-white)]">
        {t("nav.request")}
      </h1>

      {/* Visual stepper */}
      {step !== "success" && (
        <div className="flex items-center gap-2 mb-2">
          {steps.map((s, i) => (
            <React.Fragment key={s.key}>
              <div className={`flex items-center gap-2 ${currentStep >= i ? "text-[var(--gold-bar)]" : "text-[rgba(245,246,252,0.3)]"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  currentStep > i
                    ? "bg-[var(--gold-bar)] text-[var(--asphalt-black)]"
                    : currentStep === i
                      ? "border-2 border-[var(--gold-bar)] text-[var(--gold-bar)]"
                      : "border border-[rgba(245,246,252,0.2)] text-[rgba(245,246,252,0.3)]"
                }`}>
                  {currentStep > i ? "✓" : i + 1}
                </div>
                <span className="text-sm hidden sm:inline">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-px ${currentStep > i ? "bg-[var(--gold-bar)]" : "bg-[rgba(245,246,252,0.1)]"}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {error && (
        <div className="text-sm text-red-400 text-center bg-red-500/10 border border-red-500/20 rounded-none p-3">
          {error}
        </div>
      )}

      {step === "category" && (
        <CategorySelector
          onSelect={handleCategorySelect}
          onFreeText={handleFreeText}
          recommendations={recommendations}
        />
      )}

      {step === "chat" && (
        <ChatInterface
          category={category}
          serviceSlug={serviceSlug}
          initialMessage={initialMessage}
          onBriefGenerated={handleBriefGenerated}
        />
      )}

      {step === "confirm" && brief && (
        <BriefConfirmation
          brief={brief}
          variant={variant}
          subscription={subscription}
          onConfirm={handleConfirm}
          onAdjust={handleAdjust}
        />
      )}

      {step === "success" && ticket && (
        <TicketSuccess ticket={ticket} serviceSlug={ticket.serviceSlug} />
      )}
    </div>
  );
}
