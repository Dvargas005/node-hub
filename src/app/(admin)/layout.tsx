"use client";

import { useEffect, useState } from "react";
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

const baseNav: NavItem[] = [
  { label: "Panel General", href: "/admin/overview", icon: LayoutDashboard },
  { label: "Tickets", href: "/admin/tickets", icon: Ticket },
  { label: "Clientes", href: "/admin/clients", icon: Users },
  { label: "Freelancers", href: "/admin/freelancers", icon: UserCog },
  { label: "Equipo", href: "/admin/team", icon: UserCog },
  { label: "Servicios", href: "/admin/services", icon: Package },
  { label: "Alianzas", href: "/admin/alliances", icon: Handshake },
  { label: "Métricas", href: "/admin/metrics", icon: BarChart3 },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [counts, setCounts] = useState<{
    newTickets?: number;
    pendingDeliveries?: number;
  }>({});

  useEffect(() => {
    fetch("/api/admin/counts")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: any) => {
        if (data) setCounts(data);
      })
      .catch(() => {});
  }, []);

  const adminNav: NavItem[] = baseNav.map((item: any) => {
    if (item.href === "/admin/tickets" && counts.newTickets) {
      return { ...item, badge: counts.newTickets };
    }
    if (item.href === "/admin/overview" && counts.pendingDeliveries) {
      return { ...item, badge: counts.pendingDeliveries };
    }
    return item;
  });

  return (
    <AppShell navItems={adminNav} title="N.O.D.E. Admin">
      {children}
    </AppShell>
  );
}
