"use client";

import { AppShell } from "@/components/layout/app-shell";
import {
  LayoutDashboard,
  Ticket,
  Users,
  UserCog,
  Package,
  Handshake,
  BarChart3,
} from "lucide-react";
import type { NavItem } from "@/components/layout/sidebar";

const adminNav: NavItem[] = [
  { label: "Overview", href: "/admin/overview", icon: LayoutDashboard },
  { label: "Tickets", href: "/admin/tickets", icon: Ticket },
  { label: "Clientes", href: "/admin/clients", icon: Users },
  { label: "Freelancers", href: "/admin/freelancers", icon: UserCog },
  { label: "Servicios", href: "/admin/services", icon: Package },
  { label: "Alianzas", href: "/admin/alliances", icon: Handshake },
  { label: "Métricas", href: "/admin/metrics", icon: BarChart3 },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell navItems={adminNav} title="N.O.D.E. Admin">
      {children}
    </AppShell>
  );
}
