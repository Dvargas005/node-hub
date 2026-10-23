"use client";

// Vercel Web Analytics (2026-09-28). Cookieless; Web Analytics must also be enabled for this
// project in the Vercel dashboard or the script loads and nothing is recorded.
// Query strings and fragments are dropped (they can carry tokens or search terms). Signed-in client, freelancer and admin areas are not reported.

import { Analytics } from "@vercel/analytics/react";

const PRIVATE_PREFIXES: string[] = ["/admin", "/freelancer", "/dashboard", "/billing", "/messages", "/onboarding", "/request", "/settings", "/tickets", "/sign-agreement"];

export function VercelAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        const url = new URL(event.url);
        if (PRIVATE_PREFIXES.some((p) => url.pathname === p || url.pathname.startsWith(p + "/"))) return null;
        return { ...event, url: url.origin + url.pathname };
      }}
    />
  );
}
