"use client";

import { useTranslation } from "@/hooks/useTranslation";

interface TicketInfo {
  id: string;
  number: number;
  serviceName: string;
  variantName: string;
  creditsCharged: number;
  estimatedDays?: number;
}

function TimelineStep({
  done,
  active,
  label,
  detail,
  last,
}: {
  done?: boolean;
  active?: boolean;
  label: string;
  detail: string;
  last?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
            done
              ? "bg-[#FFC919] text-black"
              : active
              ? "border-2 border-[#FFC919] text-[#FFC919]"
              : "border border-gray-600 text-gray-600"
          }`}
        >
          {done ? "✓" : ""}
        </div>
        {!last && <div className="w-px flex-1 bg-gray-700 mt-1" />}
      </div>
      <div className="pb-5">
        <p className={`text-sm font-medium ${done || active ? "text-white" : "text-gray-500"}`}>
          {label}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{detail}</p>
      </div>
    </div>
  );
}

export function TicketSuccess({
  ticket,
  serviceSlug: _serviceSlug,
}: {
  ticket: TicketInfo;
  serviceSlug?: string;
}) {
  const { t } = useTranslation();
  const days = ticket.estimatedDays || 5;

  return (
    <div className="max-w-md mx-auto text-center py-12">
      <div className="text-4xl mb-4">🎉</div>
      <h1 className="text-2xl font-bold text-white mb-2">{t("wizard.success.title")}</h1>
      <p className="text-gray-400 mb-8">
        {t("wizard.success.subtitle").replace("{number}", String(ticket.number))}
      </p>

      {/* Timeline */}
      <div className="text-left space-y-0 mb-8">
        <TimelineStep
          done
          label={t("wizard.success.step1")}
          detail={`#${ticket.number} — ${ticket.serviceName}`}
        />
        <TimelineStep
          active
          label={t("wizard.success.step2")}
          detail={t("wizard.success.step2Detail")}
        />
        <TimelineStep
          label={t("wizard.success.step3")}
          detail={t("wizard.success.step3Detail")}
        />
        <TimelineStep
          last
          label={t("wizard.success.step4")}
          detail={t("wizard.success.step4Detail").replace("{days}", String(days))}
        />
      </div>

      {/* CTAs */}
      <div className="flex gap-3">
        <a
          href={`/tickets/${ticket.id}`}
          className="flex-1 bg-[#FFC919] text-black font-bold rounded-lg py-3 text-center text-sm hover:opacity-90 transition-opacity"
        >
          {t("wizard.success.track")}
        </a>
        <a
          href="/dashboard"
          className="flex-1 border border-gray-600 text-gray-300 rounded-lg py-3 text-center text-sm hover:bg-gray-800 transition-colors"
        >
          {t("wizard.success.dashboard")}
        </a>
      </div>
    </div>
  );
}
