"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Briefcase, Package, ClipboardList } from "lucide-react";
import type { NavItem } from "@/components/layout/sidebar";

const freelancerNav: NavItem[] = [
  { label: "Portal", href: "/freelancer/portal", icon: Briefcase },
  { label: "Mis Tickets", href: "/freelancer/portal", icon: ClipboardList },
  { label: "Entregas", href: "/freelancer/deliveries", icon: Package },
];

export default function FreelancerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell navItems={freelancerNav} title="N.O.D.E. Freelancer">
      {children}
    </AppShell>
  );
}
