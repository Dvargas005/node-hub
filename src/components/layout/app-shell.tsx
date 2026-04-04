"use client";

import { useState } from "react";
import { Sidebar, NavItem } from "./sidebar";
import { Topbar } from "./topbar";
import { ViewAsBanner } from "./role-switcher";

interface AppShellProps {
  children: React.ReactNode;
  navItems: NavItem[];
  title?: string;
}

export function AppShell({ children, navItems, title }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-[var(--asphalt-black)]">
      <ViewAsBanner />
      <div className="flex flex-1 min-h-0">
        <Sidebar
          items={navItems}
          title={title}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex flex-1 flex-col min-h-0 min-w-0">
          <Topbar onToggleSidebar={() => setSidebarOpen((o) => !o)} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
