import type { MetadataRoute } from "next";
import { INDUSTRY_CONTENT } from "@/lib/industry-content";
import { CITIES, SERVICES } from "@/lib/seo";
import { WORK } from "@/lib/work-content";

type Freq = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

/** Site-relative paths in the sitemap, with their crawl hints. */
/** Lives outside src/app because Next restricts what a metadata route may export. */
export function sitemapPaths(): { path: string; changeFrequency: Freq; priority: number }[] {
  return [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/pricing", changeFrequency: "monthly", priority: 0.9 },
    { path: "/services", changeFrequency: "monthly", priority: 0.9 },
    ...SERVICES.map((s) => ({ path: `/services/${s.slug}`, changeFrequency: "monthly" as const, priority: 0.8 })),
    { path: "/about", changeFrequency: "monthly", priority: 0.7 },
    { path: "/contact", changeFrequency: "yearly", priority: 0.7 },
    { path: "/locations", changeFrequency: "monthly", priority: 0.7 },
    ...CITIES.map((c) => ({ path: `/locations/${c.slug}`, changeFrequency: "monthly" as const, priority: 0.8 })),
    { path: "/free-website-check", changeFrequency: "monthly", priority: 0.8 },
    { path: "/work", changeFrequency: "monthly", priority: 0.7 },
    ...WORK.map((w) => ({ path: `/work/${w.slug}`, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...Object.keys(INDUSTRY_CONTENT).map((slug) => ({
      path: `/industries/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  ];
}
