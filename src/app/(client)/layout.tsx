"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { OnboardingGuard } from "@/components/layout/onboarding-guard";
import {
  LayoutDashboard,
  Plus,
  Ticket,
  MessageCircle,
  CreditCard,
  Settings,
} from "lucide-react";
import type { NavItem } from "@/components/layout/sidebar";

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
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch("/api/messages/unread-count")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: any) => {
        if (data?.count) setUnread(data.count);
      })
      .catch(() => {});
  }, []);

  const clientNav: NavItem[] = baseNav.map((item: NavItem) => {
    if (item.href === "/messages" && unread > 0) {
      return { ...item, badge: unread };
    }
    return item;
  });

  return (
    <AppShell navItems={clientNav}>
      <OnboardingGuard>{children}</OnboardingGuard>
    </AppShell>
  );
}
