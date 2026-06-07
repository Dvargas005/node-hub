"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import type { ServiceFormConfig, FormQuestion } from "@/lib/wizard/service-forms";

interface VariantOption {
  id: string;
  name: string;
  creditCost: number;
  estimatedDays: number;
  description?: string | null;
}

interface UserProfile {
  brandColors?: string | null;
  brandStyle?: string | null;
  businessIndustry?: string | null;
  targetAudience?: string | null;
  website?: string | null;
}

interface ServiceFormProps {
  config: ServiceFormConfig;
  userProfile: UserProfile;
  variants?: VariantOption[];
  preselectedVariantId?: string;
  onSubmit: (answers: Record<string, unknown>, variantId?: string) => void;
  onBack: () => void;
}

const STYLE_EMOJIS: Record<string, string> = {
  "Minimalist": "○",
  "Bold": "★",
  "Elegant": "◆",
  "Playful": "✦",
  "Corporate": "▦",
  "Vintage": "⊕",
  "Product photos": "📸",
  "Lifestyle": "🌿",
  "Educational/Tips": "💡",
  "Promotions": "🏷️",
  "Behind the scenes": "🎬",
};

function ColorPresetField({
  question,
  value,
  profileValue,
  onChange,
  t,
}: {
  question: FormQuestion;
  value: string;
  profileValue?: string | null;
  onChange: (v: string) => void;
  t: (k: string) => string;
}) {
  const [useProfile, setUseProfile] = useState(() => !!(profileValue && value === profileValue));

  const handleToggle = (pick: "profile" | "different") => {
    if (pick === "profile" && profileValue) {
      setUseProfile(true);
      onChange(profileValue);
    } else {
      setUseProfile(false);
      onChange("");
    }
  };

  return (
    <div className="space-y-2">
      {profileValue && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleToggle("profile")}
            className={`flex-1 px-3 py-2 text-sm border rounded-none text-left transition-colors ${
              useProfile
                ? "border-[var(--gold-bar)] bg-[var(--gold-bar)]/10 text-[var(--gold-bar)]"
                : "border-[rgba(245,246,252,0.15)] text-[rgba(245,246,252,0.6)] hover:border-[rgba(245,246,252,0.3)]"
            }`}
          >
            <span className="block text-xs text-[rgba(245,246,252,0.4)] mb-0.5">{t("wizard.form.fromProfile")}</span>
            {profileValue}
          </button>
          <button
            type="button"
            onClick={() => handleToggle("different")}
            className={`flex-1 px-3 py-2 text-sm border rounded-none transition-colors ${
              !useProfile
                ? "border-[var(--gold-bar)] bg-[var(--gold-bar)]/10 text-[var(--gold-bar)]"
                : "border-[rgba(245,246,252,0.15)] text-[rgba(245,246,252,0.6)] hover:border-[rgba(245,246,252,0.3)]"
            }`}
          >
            {t("wizard.form.colors.different")}
          </button>
        </div>
      )}
      {!useProfile && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={profileValue ? "" : "e.g. #FF5733, navy blue, gold"}
          className="w-full px-3 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(245,246,252,0.15)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)] text-sm focus:outline-none focus:border-[var(--gold-bar)] rounded-none"
        />
      )}
    </div>
  );
}

function QuestionField({
  question,
  value,
  userProfile,
  onChange,
  t,
  serviceSlug,
  industry,
}: {
  question: FormQuestion;
  value: unknown;
  userProfile: UserProfile;
  onChange: (v: unknown) => void;
  t: (k: string) => string;
  serviceSlug: string;
  industry?: string | null;
}) {
  const profileValue = question.autoFill
    ? userProfile[question.autoFill as keyof UserProfile]
    : undefined;

  switch (question.type) {
    case "textarea":
      return (
        <textarea
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder ? t(question.placeholder) : undefined}
          maxLength={question.maxLength}
          rows={3}
          className="w-full px-3 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(245,246,252,0.15)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)] text-sm focus:outline-none focus:border-[var(--gold-bar)] rounded-none resize-none"
        />
      );

    case "text":
      return (
        <input
          type="text"
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder ? t(question.placeholder) : undefined}
          className="w-full px-3 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(245,246,252,0.15)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)] text-sm focus:outline-none focus:border-[var(--gold-bar)] rounded-none"
        />
      );

    case "url": {
      const query = `${serviceSlug.replace(/-/g, " ")} ${industry || ""}`.trim();
      return (
        <div className="space-y-2">
          <input
            type="url"
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder ? t(question.placeholder) : "https://..."}
            className="w-full px-3 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(245,246,252,0.15)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)] text-sm focus:outline-none focus:border-[var(--gold-bar)] rounded-none"
          />
          <button
            type="button"
            onClick={() => window.open(`https://pinterest.com/search/pins/?q=${encodeURIComponent(query)}`, "_blank")}
            className="text-xs text-[rgba(245,246,252,0.4)] hover:text-[var(--gold-bar)] transition-colors"
          >
            {t("wizard.form.findInspiration")} →
          </button>
        </div>
      );
    }

    case "single-select": {
      const selected = value as string;
      const profileVal = profileValue as string | undefined;
      return (
        <div className="space-y-2">
          {profileVal && (
            <p className="text-xs text-[rgba(245,246,252,0.4)]">
              {t("wizard.form.fromProfile")}: <span className="text-[var(--gold-bar)]">{profileVal}</span>
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {question.options?.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => onChange(selected === opt ? "" : opt)}
                className={`px-3 py-1.5 text-sm border transition-colors rounded-none ${
                  selected === opt
                    ? "border-[var(--gold-bar)] bg-[var(--gold-bar)]/10 text-[var(--gold-bar)]"
                    : "border-[rgba(245,246,252,0.15)] text-[rgba(245,246,252,0.6)] hover:border-[rgba(245,246,252,0.3)]"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      );
    }

    case "multi-select": {
      const selected = (value as string[]) || [];
      return (
        <div className="flex flex-wrap gap-2">
          {question.options?.map((opt) => {
            const active = selected.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onChange(active ? selected.filter((s) => s !== opt) : [...selected, opt])}
                className={`px-3 py-1.5 text-sm border transition-colors rounded-none ${
                  active
                    ? "border-[var(--gold-bar)] bg-[var(--gold-bar)]/10 text-[var(--gold-bar)]"
                    : "border-[rgba(245,246,252,0.15)] text-[rgba(245,246,252,0.6)] hover:border-[rgba(245,246,252,0.3)]"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      );
    }

    case "multi-select-visual": {
      const selected = (value as string[]) || [];
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {question.options?.map((opt) => {
            const active = selected.includes(opt);
            const emoji = STYLE_EMOJIS[opt] || "◉";
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onChange(active ? selected.filter((s) => s !== opt) : [...selected, opt])}
                className={`flex flex-col items-center gap-1 p-3 border transition-colors rounded-none ${
                  active
                    ? "border-[var(--gold-bar)] bg-[var(--gold-bar)]/10 text-[var(--gold-bar)]"
                    : "border-[rgba(245,246,252,0.15)] text-[rgba(245,246,252,0.6)] hover:border-[rgba(245,246,252,0.3)]"
                }`}
              >
                <span className="text-xl">{emoji}</span>
                <span className="text-xs text-center">{opt}</span>
              </button>
            );
          })}
        </div>
      );
    }

    case "color-preset":
      return (
        <ColorPresetField
          question={question}
          value={(value as string) || ""}
          profileValue={profileValue as string | null | undefined}
          onChange={(v) => onChange(v)}
          t={t}
        />
      );

    default:
      return null;
  }
}

export function ServiceForm({
  config,
  userProfile,
  variants,
  preselectedVariantId,
  onSubmit,
  onBack,
}: ServiceFormProps) {
  const { t } = useTranslation();

  const initialAnswers = () => {
    const init: Record<string, unknown> = {};
    for (const q of config.questions) {
      if (q.autoFill && userProfile[q.autoFill as keyof UserProfile]) {
        if (q.type === "color-preset") {
          init[q.id] = userProfile[q.autoFill as keyof UserProfile];
        } else if (q.type === "single-select") {
          init[q.id] = userProfile[q.autoFill as keyof UserProfile];
        }
      }
    }
    return init;
  };

  const [answers, setAnswers] = useState<Record<string, unknown>>(initialAnswers);
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    preselectedVariantId || variants?.[0]?.id || ""
  );
  const [errors, setErrors] = useState<Set<string>>(new Set());

  const handleChange = (questionId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (errors.has(questionId)) {
      setErrors((prev) => { const next = new Set(prev); next.delete(questionId); return next; });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = new Set<string>();
    for (const q of config.questions) {
      if (!q.required) continue;
      const val = answers[q.id];
      if (!val || (Array.isArray(val) && val.length === 0) || val === "") {
        newErrors.add(q.id);
      }
    }
    if (newErrors.size > 0) {
      setErrors(newErrors);
      return;
    }
    onSubmit(answers, selectedVariantId || undefined);
  };

  const showVariants = variants && variants.length > 1 && !preselectedVariantId;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {config.questions.map((q) => (
        <div key={q.id} className="space-y-2">
          <label className="block text-sm font-medium text-[var(--ice-white)]">
            {t(q.label)}
            {q.required && <span className="text-[var(--gold-bar)] ml-1">*</span>}
          </label>
          <QuestionField
            question={q}
            value={answers[q.id]}
            userProfile={userProfile}
            onChange={(v) => handleChange(q.id, v)}
            t={t}
            serviceSlug={config.serviceSlug}
            industry={userProfile.businessIndustry}
          />
          {errors.has(q.id) && (
            <p className="text-xs text-red-400">Required</p>
          )}
        </div>
      ))}

      {showVariants && (
        <div className="mt-6 border-t border-[rgba(245,246,252,0.08)] pt-6 space-y-3">
          <h3 className="text-sm font-medium text-[var(--ice-white)]">{t("wizard.form.chooseVariant")}</h3>
          <div className="space-y-2">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVariantId(v.id)}
                className={`w-full border rounded-none p-4 cursor-pointer text-left transition-colors ${
                  selectedVariantId === v.id
                    ? "border-[var(--gold-bar)] bg-[var(--gold-bar)]/5"
                    : "border-[rgba(245,246,252,0.1)] hover:border-[rgba(245,246,252,0.25)]"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-[var(--ice-white)] text-sm">{v.name}</span>
                  <span className="text-[var(--gold-bar)] text-sm font-medium">{v.creditCost} cr</span>
                </div>
                {v.description && (
                  <p className="text-xs text-[rgba(245,246,252,0.5)] mt-1">{v.description}</p>
                )}
                <p className="text-xs text-[rgba(245,246,252,0.35)] mt-1">~{v.estimatedDays} days</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          onClick={onBack}
          variant="outline"
          className="border-[rgba(245,246,252,0.2)] text-[rgba(245,246,252,0.6)] hover:text-[var(--ice-white)] rounded-none"
        >
          ←
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold rounded-none"
        >
          {t("wizard.form.continue")} →
        </Button>
      </div>
    </form>
  );
}
