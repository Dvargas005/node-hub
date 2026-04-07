"use client";

import { useEffect } from "react";
import Script from "next/script";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (opts: { url: string }) => void;
    };
  }
}

export function openCalendly(url: string) {
  if (typeof window === "undefined") return;
  if (window.Calendly?.initPopupWidget) {
    window.Calendly.initPopupWidget({ url });
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

interface Props {
  url: string;
  variant?: "primary" | "ghost";
  className?: string;
  children?: React.ReactNode;
}

export function CalendlyButton({ url, variant = "primary", className = "", children }: Props) {
  const { t } = useTranslation();

  useEffect(() => {
    // Inject CSS for popup styling once (idempotent — Script tag does the same for JS)
    if (typeof document === "undefined") return;
    const id = "calendly-popup-css";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://assets.calendly.com/assets/external/widget.css";
    document.head.appendChild(link);
  }, []);

  const baseCls =
    variant === "primary"
      ? "bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold"
      : "bg-transparent text-[var(--gold-bar)] hover:bg-[var(--gold-bar)]/10";

  return (
    <>
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="lazyOnload"
      />
      <Button
        onClick={() => openCalendly(url)}
        className={`${baseCls} ${className}`}
      >
        <Calendar className="mr-2 h-4 w-4" />
        {children || t("calendly.book")}
      </Button>
    </>
  );
}
