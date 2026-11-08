import type { MetadataRoute } from "next";
import { pageUpdated } from "@/lib/page-dates";
import { SITE_URL } from "@/lib/seo";
import { sitemapPaths } from "@/lib/sitemap-paths";

/**
 * Public marketing surface only. Authenticated routes, /dedicated,
 * /early-adopters, and /sign-agreement are intentionally absent: they are noindex and blocked in
 * robots.ts, and listing a blocked URL in a sitemap is a Search Console error.
 *
 * lastModified is the page's real last content change (src/lib/page-dates.ts),
 * not the build time: a date that moves on every deploy teaches Google to ignore it.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapPaths().map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: pageUpdated(path),
    changeFrequency,
    priority,
  }));
}
