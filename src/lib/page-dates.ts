/**
 * When each public page last changed in a way a search engine should recrawl
 * for: its main copy, its structured data, or the links on it. The sitemap's
 * <lastmod> and IndexNow (scripts/indexnow.mjs pings only URLs whose lastmod
 * is recent) both read this.
 *
 * Bump the date of every page you change, in the same commit. Do not bump it
 * for a pure styling or refactor change: Google stops trusting lastmod on a
 * site where it moves without the content moving, which is what happened when
 * the sitemap stamped every URL with the build time.
 *
 * page-dates.test.ts fails if a sitemap URL has no entry here.
 */
export const PAGE_UPDATED: Record<string, string> = {
  // 2026-11-06: sitewide Organization schema (name, logo, contactPoint), footer
  // links to /about, /contact, /pricing, and new meta descriptions.
  "/": "2026-11-06",
  "/about": "2026-11-06",
  "/contact": "2026-11-06",
  "/pricing": "2026-11-06",
  "/services": "2026-11-06",
  "/services/web-development": "2026-11-06",
  "/services/app-development": "2026-11-06",
  "/services/software-development": "2026-11-06",
  "/services/seo": "2026-11-06",
  "/services/generative-engine-optimization": "2026-11-06",
  "/services/answer-engine-optimization": "2026-11-06",
  "/locations": "2026-11-06",
  "/locations/chicago-il": "2026-11-06",
  "/locations/evanston-il": "2026-11-06",
  "/locations/lake-county-il": "2026-11-06",
  "/locations/kenosha-wi": "2026-11-06",
  "/locations/milwaukee-wi": "2026-11-06",
  "/locations/northwest-indiana": "2026-11-06",
  "/locations/indianapolis-in": "2026-11-06",
  "/locations/dallas-tx": "2026-11-06",
  "/free-website-check": "2026-11-06",
  "/terms": "2026-11-06",
  "/work": "2026-11-06",
  "/work/wecl": "2026-11-06",
  "/work/conovate": "2026-11-06",
  "/work/we-all-related": "2026-11-06",
  "/work/zanapronto": "2026-11-06",
  "/industries/logistics": "2026-11-06",
};

/** Last-updated date for a site-relative path, or undefined if it has none. */
export function pageUpdated(path: string): Date | undefined {
  const d = PAGE_UPDATED[path];
  return d ? new Date(`${d}T00:00:00Z`) : undefined;
}
