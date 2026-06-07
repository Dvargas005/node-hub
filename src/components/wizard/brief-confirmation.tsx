"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
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

function BriefSection({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: (v: string) => void;
}) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  if (editing) {
    return (
      <div>
        <label className="text-sm text-gray-400">{label}</label>
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="w-full bg-gray-900 border border-[#FFC919] rounded p-2 text-white mt-1 resize-none focus:outline-none"
          rows={3}
        />
        <div className="flex gap-3 mt-1">
          <button
            onClick={() => { onEdit(editValue); setEditing(false); }}
            className="text-sm text-[#FFC919] hover:underline"
          >
            {t("common.save")}
          </button>
          <button
            onClick={() => { setEditValue(value); setEditing(false); }}
            className="text-sm text-gray-400 hover:underline"
          >
            {t("common.cancel")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group">
      <label className="text-sm text-gray-400">{label}</label>
      <div className="flex justify-between items-start gap-2">
        <p className="text-white mt-1 text-sm leading-relaxed">{value}</p>
        <button
          onClick={() => setEditing(true)}
          className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity text-sm flex-shrink-0 mt-1"
          aria-label="Edit"
        >
          ✏️
        </button>
      </div>
    </div>
  );
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
  onConfirm: () => Promise<void>;
  onAdjust: () => void;
}) {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const [editedBrief, setEditedBrief] = useState(brief);

  const freeCredits = subscription?.freeCredits || 0;
  const totalCredits = freeCredits + (subscription?.creditsRemaining || 0);
  const hasEnoughCredits = variant ? totalCredits >= variant.creditCost : false;
  const hasSubscription = !!subscription;

  const updateBrief = (field: string, value: string) => {
    if (field === "summary") {
      setEditedBrief((prev) => ({ ...prev, summary: value }));
    } else {
      setEditedBrief((prev) => ({
        ...prev,
        details: { ...prev.details, [field]: value },
      }));
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await onConfirm();
    } catch {
      setConfirming(false);
    }
  };

  const details = editedBrief.details;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header card */}
      <div className="bg-gray-800 rounded-t-lg p-6 border border-gray-700">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-white">
              {variant?.serviceName || editedBrief.suggestedServiceSlug}
            </h2>
            <p className="text-gray-400 text-sm mt-0.5">{variant?.name}</p>
          </div>
          {variant && (
            <div className="text-right">
              <span className="text-2xl font-bold text-[#FFC919]">{variant.creditCost} cr</span>
              <p className="text-sm text-gray-400 mt-0.5">
                ~{variant.estimatedDays} {t("wizard.confirm.days")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Brief sections */}
      <div className="bg-gray-800/50 border-x border-gray-700 p-6 space-y-5">
        <BriefSection
          label={t("wizard.confirm.description")}
          value={editedBrief.summary}
          onEdit={(val) => updateBrief("summary", val)}
        />
        {details?.style && details.style !== "Not mentioned" && details.style !== "No mencionado" && details.style !== "N/A" && (
          <BriefSection
            label={t("wizard.confirm.style")}
            value={details.style}
            onEdit={(val) => updateBrief("style", val)}
          />
        )}
        {details?.deliverable && details.deliverable !== "Not mentioned" && details.deliverable !== "No mencionado" && details.deliverable !== "N/A" && (
          <BriefSection
            label={t("wizard.confirm.deliverable")}
            value={details.deliverable}
            onEdit={(val) => updateBrief("deliverable", val)}
          />
        )}
        {details?.extras && details.extras !== "Not mentioned" && details.extras !== "No mencionado" && details.extras !== "N/A" && (
          <BriefSection
            label={t("wizard.confirm.extras")}
            value={details.extras}
            onEdit={(val) => updateBrief("extras", val)}
          />
        )}
      </div>

      {/* Credits summary */}
      <div className="bg-gray-800 rounded-b-lg p-6 border border-gray-700">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>{t("wizard.confirm.available")}</span>
          <span>{totalCredits} cr</span>
        </div>
        <div className="flex justify-between text-sm text-gray-400 mb-4">
          <span>{t("wizard.confirm.cost")}</span>
          <span>-{variant?.creditCost ?? 0} cr</span>
        </div>
        <div className="flex justify-between font-bold text-white border-t border-gray-700 pt-3">
          <span>{t("wizard.confirm.remaining")}</span>
          <span>{totalCredits - (variant?.creditCost || 0)} cr</span>
        </div>
      </div>

      {/* Insufficient credits warning */}
      {!hasEnoughCredits && variant && (
        <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded p-4 mt-4">
          <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-400 font-medium">
              {t("wizard.insufficientCredits")}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {t("wizard.needCredits")
                .replace("{need}", String(variant.creditCost))
                .replace("{have}", String(totalCredits))}
            </p>
            <Link href="/billing" className="text-xs text-[#FFC919] hover:underline mt-1 inline-block">
              {hasSubscription ? t("wizard.buyExtraCredits") : t("wizard.viewPlans")}
            </Link>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={onAdjust}
          className="flex-1 border border-gray-600 text-gray-300 rounded-lg py-3 hover:bg-gray-800 transition-colors text-sm font-medium"
        >
          {t("wizard.confirm.adjust")}
        </button>
        <button
          onClick={handleConfirm}
          disabled={!hasEnoughCredits || confirming}
          className="flex-1 bg-[#FFC919] text-black font-bold rounded-lg py-3 disabled:opacity-50 hover:opacity-90 transition-opacity text-sm"
        >
          {confirming ? t("wizard.confirm.creating") : t("wizard.confirm.create")}
        </button>
      </div>
    </div>
  );
}
