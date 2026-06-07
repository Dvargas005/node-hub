"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export interface ServiceSelection {
  category: string;
  serviceSlug?: string;
  variantSlug?: string;
  label: string;
}

interface CardDef {
  labelKey: string;
  category: string;
  serviceSlug?: string;
  variantSlug?: string;
  icon: string;
  credits: number;
  exact?: boolean; // true → show exact price, false → "From X cr"
}

interface GroupDef {
  groupKey: string;
  cards: CardDef[];
}

const GROUPS: GroupDef[] = [
  {
    groupKey: "wizard.group.startingUp",
    cards: [
      { labelKey: "wizard.card.needLogo",    category: "DESIGN",     serviceSlug: "logo-design",          icon: "🎨",  credits: 90  },
      { labelKey: "wizard.card.needWebsite", category: "WEB",        serviceSlug: "landing-page",         icon: "🌐",  credits: 150 },
      { labelKey: "wizard.card.needCards",   category: "DESIGN",     serviceSlug: "print-design",         icon: "🖨️", credits: 105 },
    ],
  },
  {
    groupKey: "wizard.group.growAudience",
    cards: [
      { labelKey: "wizard.card.createPosts",   category: "MARKETING", serviceSlug: "content-pack",             icon: "📱", credits: 120 },
      { labelKey: "wizard.card.manageSocial",  category: "MARKETING", serviceSlug: "social-media-management",  icon: "📊", credits: 270 },
      { labelKey: "wizard.card.showOnGoogle",  category: "MARKETING", serviceSlug: "seo",                      icon: "🔍", credits: 150 },
    ],
  },
  {
    groupKey: "wizard.group.levelUp",
    cards: [
      { labelKey: "wizard.card.refreshBrand",  category: "DESIGN", serviceSlug: "logo-design",            variantSlug: "full-brand-identity", icon: "✨", credits: 375 },
      { labelKey: "wizard.card.presentation",  category: "DESIGN", serviceSlug: "presentation-design",    icon: "📊", credits: 195 },
    ],
  },
  {
    groupKey: "wizard.group.quick",
    cards: [
      { labelKey: "wizard.card.bookMeeting", category: "CONSULTING", serviceSlug: "hourly-meeting", icon: "💬", credits: 75, exact: true },
    ],
  },
];

export function CategorySelector({
  onSelect,
  onFreeText,
  recommendations,
}: {
  onSelect: (selection: ServiceSelection) => void;
  onFreeText: (text: string) => void;
  recommendations?: string[];
}) {
  const { t } = useTranslation();
  const [freeText, setFreeText] = useState("");

  const handleFreeTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (freeText.trim()) onFreeText(freeText.trim());
  };

  const formatPrice = (card: CardDef) =>
    card.exact
      ? `${card.credits} ${t("wizard.credits")}`
      : `${t("wizard.from")} ${card.credits} ${t("wizard.credits")}`;

  return (
    <div className="space-y-6 py-2">
      <div>
        <h2 className="font-[var(--font-lexend)] text-xl font-bold text-[var(--ice-white)]">
          {t("wizard.whatDoYouNeed")}
        </h2>
      </div>

      {/* FODA recommendations banner */}
      {recommendations && recommendations.length > 0 && (
        <div className="bg-[rgba(255,201,25,0.05)] border border-[var(--gold-bar)]/30 rounded-lg p-4">
          <p className="text-sm text-[rgba(245,246,252,0.6)] mb-3">{t("wizard.recommendation")}</p>
          <div className="flex flex-wrap gap-2">
            {recommendations.slice(0, 3).map((rec) => (
              <button
                key={rec}
                onClick={() => onFreeText(rec)}
                className="px-3 py-1.5 bg-[rgba(255,201,25,0.1)] border border-[var(--gold-bar)]/30 rounded text-xs text-[var(--gold-bar)] hover:bg-[rgba(255,201,25,0.2)] transition-colors text-left"
              >
                {rec}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Card groups */}
      <div className="space-y-6">
        {GROUPS.map((group) => (
          <div key={group.groupKey}>
            <h3 className="text-xs font-medium text-[rgba(245,246,252,0.4)] uppercase tracking-wider mb-3">
              {t(group.groupKey)}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.cards.map((card) => (
                <button
                  key={card.labelKey}
                  onClick={() =>
                    onSelect({
                      category: card.category,
                      serviceSlug: card.serviceSlug,
                      variantSlug: card.variantSlug,
                      label: t(card.labelKey),
                    })
                  }
                  className="border border-[rgba(245,246,252,0.12)] bg-[rgba(255,255,255,0.02)] rounded-lg p-4 cursor-pointer hover:border-[var(--gold-bar)] hover:bg-[rgba(255,201,25,0.04)] transition-all text-left group w-full"
                >
                  <span className="text-2xl block mb-2">{card.icon}</span>
                  <h3 className="font-[var(--font-lexend)] font-semibold text-[var(--ice-white)] group-hover:text-[var(--gold-bar)] text-sm leading-snug">
                    {t(card.labelKey)}
                  </h3>
                  <p className="text-xs text-[rgba(245,246,252,0.4)] mt-1">{formatPrice(card)}</p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Free text */}
      <div className="pt-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-[rgba(245,246,252,0.08)]" />
          <span className="text-xs text-[rgba(245,246,252,0.3)]">{t("common.or")}</span>
          <div className="h-px flex-1 bg-[rgba(245,246,252,0.08)]" />
        </div>
        <form onSubmit={handleFreeTextSubmit} className="flex gap-2">
          <input
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder={t("wizard.freeText")}
            className="flex-1 h-10 rounded-none border border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] px-3 text-sm text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)] focus:outline-none focus:border-[var(--gold-bar)]"
          />
          <Button
            type="submit"
            disabled={!freeText.trim()}
            className="bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold px-4 rounded-none disabled:opacity-40"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
