"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  // When set, item renders as a button and onClick fires instead of navigating.
  onClick?: () => void;
}

interface SidebarProps {
  items: NavItem[];
  title?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ items, title = "N.O.D.E.", isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col border-r border-[rgba(245,246,252,0.1)] bg-[var(--asphalt-black)] transform transition-transform duration-200",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "md:relative md:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center border-b border-[rgba(245,246,252,0.1)] px-6">
          <Link href="/" className="text-xl font-bold text-[var(--ice-white)]" onClick={onClose}>
            {title}
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {items.map((item) => {
            const isActive = pathname === item.href;
            const className = cn(
              "flex items-center gap-3 rounded-none px-3 py-2.5 text-sm transition-colors w-full text-left",
              isActive
                ? "bg-[var(--gold-bar)] text-[var(--asphalt-black)] font-semibold"
                : "text-[rgba(245,246,252,0.6)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--ice-white)]"
            );
            const inner = (
              <>
                <item.icon className="h-4 w-4" />
                {item.label}
                {item.badge ? (
                  <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                ) : null}
              </>
            );
            if (item.onClick) {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    item.onClick?.();
                    onClose?.();
                  }}
                  className={className}
                >
                  {inner}
                </button>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={className}
              >
                {inner}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
