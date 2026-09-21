/**
 * Shared SEO constants for the N.O.D.E. hub.
 *
 * Mirrors the pattern already used by zanapronto and gggambit so every Nouvos
 * property resolves canonicals the same way. Override the origin per
 * environment with NEXT_PUBLIC_SITE_URL (preview deploys should set it so
 * canonical tags never point a preview at production).
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.nodedev.one"
).replace(/\/$/, "");

/**
 * Default Open Graph / Twitter share image.
 *
 * STOPGAP: hero.png is 1264x842 (3:2), not the 1200x630 (1.91:1) that Facebook,
 * LinkedIn, X, and Slack crop to. It renders, but it gets letterboxed. Replace
 * with a purpose-built 1200x630 card and update this constant.
 */
export const OG_IMAGE = "/img/hero.png";
export const OG_IMAGE_WIDTH = 1264;
export const OG_IMAGE_HEIGHT = 842;

export const ORG_NAME = "N.O.D.E. by Nouvos";
export const LEGAL_NAME = "Nouvos Solutions LLC";
export const CONTACT_EMAIL = "support@nouvos.one";

/**
 * Service lines N.O.D.E. sells. Single source of truth: the sitemap, the
 * services index, the Organization JSON-LD `hasOfferCatalog`, and llms.txt all
 * read from here so a new service page can never drift out of one of them.
 */
export const SERVICES = [
  {
    slug: "web-development",
    name: "Web Development",
    title: "Web Development Services",
    summary:
      "Custom websites and web applications built on Next.js and TypeScript, delivered under a flat monthly subscription.",
  },
  {
    slug: "app-development",
    name: "App Development",
    title: "Mobile App Development Services",
    summary:
      "iOS and Android applications, from a single shared codebase through store submission and release.",
  },
  {
    slug: "software-development",
    name: "Software Development",
    title: "Custom Software Development Services",
    summary:
      "Multi-tenant SaaS platforms, internal tools, and system integrations built by the team behind Nouvos supply chain software.",
  },
  {
    slug: "seo",
    name: "SEO, GEO & AEO",
    title: "SEO, GEO and AEO Services",
    summary:
      "Search engine, generative engine, and answer engine optimization so your business is found by Google, Bing, and AI assistants alike.",
  },
] as const;

export type ServiceSlug = (typeof SERVICES)[number]["slug"];

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export const PHONE = "+1-224-640-1785";

/** Registered business address (state filings). Keep identical everywhere it appears. */
export const ADDRESS = {
  streetAddress: "909 Davis Street, Suite 500",
  addressLocality: "Evanston",
  addressRegion: "IL",
  postalCode: "60201",
  addressCountry: "US",
} as const;

export const GEO = { latitude: 42.0478781, longitude: -87.6842666 } as const;

/**
 * Metros with a dedicated location page. One page per city covering every
 * service line, rather than a page per service per city: near-duplicate
 * city-swapped pages are what Google's doorway-page policy penalizes.
 */
export const CITIES = [
  {
    slug: "chicago-il",
    city: "Chicago",
    state: "Illinois",
    stateCode: "IL",
    timeZone: "Central Time",
    wikidata: "https://www.wikidata.org/wiki/Q1297",
  },
  {
    slug: "milwaukee-wi",
    city: "Milwaukee",
    state: "Wisconsin",
    stateCode: "WI",
    timeZone: "Central Time",
    wikidata: "https://www.wikidata.org/wiki/Q37836",
  },
  {
    slug: "dallas-tx",
    city: "Dallas",
    state: "Texas",
    stateCode: "TX",
    timeZone: "Central Time",
    wikidata: "https://www.wikidata.org/wiki/Q16557",
  },
  {
    slug: "indianapolis-in",
    city: "Indianapolis",
    state: "Indiana",
    stateCode: "IN",
    timeZone: "Eastern Time",
    wikidata: "https://www.wikidata.org/wiki/Q6346",
  },
] as const;

export type CitySlug = (typeof CITIES)[number]["slug"];

/** schema.org areaServed entries for every target metro. */
export const AREA_SERVED = CITIES.map((c) => ({
  "@type": "City",
  name: `${c.city}, ${c.stateCode}`,
  sameAs: c.wikidata,
}));
