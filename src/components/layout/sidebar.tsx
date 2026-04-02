"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface SidebarProps {
  items: NavItem[];
  title?: string;
}

export function Sidebar({ items, title = "N.O.D.E." }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-[rgba(245,246,252,0.1)] bg-[var(--asphalt-black)]">
      <div className="flex h-16 items-center border-b border-[rgba(245,246,252,0.1)] px-6">
        <Link href="/" className="text-xl font-bold text-[var(--ice-white)]">
          {title}
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-none px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "bg-[var(--gold-bar)] text-[var(--asphalt-black)] font-semibold"
                  : "text-[rgba(245,246,252,0.6)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--ice-white)]"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
