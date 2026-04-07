"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { AppShell } from "@/components/layout/app-shell";
import { OnboardingGuard } from "@/components/layout/onboarding-guard";
import {
  LayoutDashboard,
  Plus,
  Ticket,
  MessageCircle,
  Calendar,
  CreditCard,
  Settings,
} from "lucide-react";
import type { NavItem } from "@/components/layout/sidebar";
import { openCalendly } from "@/components/calendly/calendly-button";
import { useTranslation } from "@/hooks/useTranslation";

const baseNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "New Request", href: "/request", icon: Plus },
  { label: "My Tickets", href: "/tickets", icon: Ticket },
  { label: "Messages", href: "/messages", icon: MessageCircle },
  { label: "Billing", href: "/billing", icon: CreditCard },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const [unread, setUnread] = useState(0);
  const [pmCalendly, setPmCalendly] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/messages/unread-count")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: any) => {
        if (data?.count) setUnread(data.count);
      })
      .catch(() => {});

    fetch("/api/pm/info")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: any) => {
        if (data?.pm?.calendlyUrl) {
          setPmCalendly(data.pm.calendlyUrl);
          // Inject Calendly stylesheet once for popup styling
          const cssId = "calendly-popup-css";
          if (typeof document !== "undefined" && !document.getElementById(cssId)) {
            const link = document.createElement("link");
            link.id = cssId;
            link.rel = "stylesheet";
            link.href = "https://assets.calendly.com/assets/external/widget.css";
            document.head.appendChild(link);
          }
        }
      })
      .catch(() => {});
  }, []);

  const clientNav: NavItem[] = baseNav.map((item: NavItem) => {
    if (item.href === "/messages" && unread > 0) {
      return { ...item, badge: unread };
    }
    return item;
  });

  // Inject "Book a meeting" right after Messages when the PM has Calendly set
  if (pmCalendly) {
    const messagesIdx = clientNav.findIndex((i: NavItem) => i.href === "/messages");
    const insertAt = messagesIdx >= 0 ? messagesIdx + 1 : clientNav.length;
    clientNav.splice(insertAt, 0, {
      label: t("calendly.book"),
      href: "#book-a-meeting",
      icon: Calendar,
      onClick: () => openCalendly(pmCalendly),
    });
  }

  return (
    <>
      {pmCalendly && (
        <Script
          src="https://assets.calendly.com/assets/external/widget.js"
          strategy="lazyOnload"
        />
      )}
      <AppShell navItems={clientNav}>
        <OnboardingGuard>{children}</OnboardingGuard>
      </AppShell>
    </>
  );
}
