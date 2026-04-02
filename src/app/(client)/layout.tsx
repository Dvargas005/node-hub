"use client";

import { AppShell } from "@/components/layout/app-shell";
import { OnboardingGuard } from "@/components/layout/onboarding-guard";
import {
  LayoutDashboard,
  Plus,
  Ticket,
  CreditCard,
  Settings,
} from "lucide-react";
import type { NavItem } from "@/components/layout/sidebar";

const clientNav: NavItem[] = [
  { label: "Panel", href: "/dashboard", icon: LayoutDashboard },
  { label: "Nueva Solicitud", href: "/request", icon: Plus },
  { label: "Mis Tickets", href: "/tickets", icon: Ticket },
  { label: "Facturación", href: "/billing", icon: CreditCard },
  { label: "Configuración", href: "/settings", icon: Settings },
];

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell navItems={clientNav}>
      <OnboardingGuard>{children}</OnboardingGuard>
    </AppShell>
  );
}
