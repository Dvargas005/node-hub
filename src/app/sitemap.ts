import type { MetadataRoute } from "next";
import { CITIES, SERVICES, SITE_URL } from "@/lib/seo";

/**
 * Public marketing surface only. Authenticated routes, /dedicated,
 * /early-adopters, and /sign-agreement are intentionally absent: they are noindex and blocked in
 * robots.ts, and listing a blocked URL in a sitemap is a Search Console error.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: `${SITE_URL}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/services`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    ...SERVICES.map((service) => ({
      url: `${SITE_URL}/services/${service.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: `${SITE_URL}/locations`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...CITIES.map((city) => ({
      url: `${SITE_URL}/locations/${city.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
