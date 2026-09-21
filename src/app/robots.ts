import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * Marketing pages are indexable; every authenticated surface is blocked.
 *
 * The named AI crawler groups are deliberate. robots.txt matching is
 * "most specific group wins, others ignored" - a crawler that finds its own
 * user-agent group ignores the `*` group entirely. So each named group has to
 * repeat the same disallow list, otherwise naming GPTBot here would hand it
 * the admin and API routes that `*` blocks. DISALLOW is shared for that reason.
 *
 * These bots are allowed on purpose: N.O.D.E. sells discoverability, so being
 * quotable by ChatGPT, Claude, Perplexity, and Gemini is the product working on
 * its own marketing. Google-Extended and Applebot-Extended are opt-OUT tokens,
 * so listing them with Allow is a statement of intent rather than a switch.
 */

const DISALLOW = [
  "/api/",
  "/admin",
  "/admin/",
  "/dashboard",
  "/billing",
  "/messages",
  "/onboarding",
  "/request",
  "/settings",
  "/tickets",
  "/freelancer",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/early-adopters",
  "/sign-agreement",
];

const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot",
  "Applebot-Extended",
  "Amazonbot",
  "CCBot",
  "cohere-ai",
  "Meta-ExternalAgent",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: DISALLOW,
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
