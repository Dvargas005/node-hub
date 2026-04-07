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
  Gift,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import type { NavItem } from "@/components/layout/sidebar";

const baseNav: NavItem[] = [
  { label: "Overview", href: "/admin/overview", icon: LayoutDashboard },
  { label: "Tickets", href: "/admin/tickets", icon: Ticket },
  { label: "Clients", href: "/admin/clients", icon: Users },
  { label: "Freelancers", href: "/admin/freelancers", icon: UserCog },
  { label: "Team", href: "/admin/team", icon: UserCog },
  { label: "Services", href: "/admin/services", icon: Package },
  { label: "Alliances", href: "/admin/alliances", icon: Handshake },
  { label: "Promos", href: "/admin/promos", icon: Gift },
  { label: "Metrics", href: "/admin/metrics", icon: BarChart3 },
  { label: "Sync", href: "/admin/sync", icon: RefreshCw },
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
