"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { useTranslation } from "@/hooks/useTranslation";

/**
 * Role-aware "Back" link to the user's main page.
 *  - logged out        → "/" (landing)
 *  - CLIENT            → "/dashboard"
 *  - ADMIN / PM        → "/admin/overview"
 *  - FREELANCER        → "/freelancer/portal"
 * Hides itself when already on the destination so the home page doesn't show a
 * pointless back-to-self link.
 */
export function BackLink({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useTranslation();

  const role = (session?.user as Record<string, unknown> | undefined)?.role as
    | string
    | undefined;

  const href = !session
    ? "/"
    : role === "ADMIN" || role === "PM"
      ? "/admin/overview"
      : role === "FREELANCER"
        ? "/freelancer/portal"
        : "/dashboard";

  if (pathname === href) return null;

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 text-sm font-medium text-[rgba(245,246,252,0.6)] transition-colors hover:text-[var(--ice-white)] ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      {t("common.back")}
    </Link>
  );
}
