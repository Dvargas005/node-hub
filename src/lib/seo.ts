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

/** Profiles that describe the same business. Keep in sync with the directory listings. */
export const SAME_AS = [
  "https://nouvos.one",
  "https://www.linkedin.com/company/111339069",
  "https://clutch.co/profile/nouvos-solutions",
  "https://www.goodfirms.co/company/nouvos-solutions-llc",
];

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
    name: "SEO",
    title: "SEO Services",
    summary:
      "Technical, local, and on-page search engine optimization so your business ranks on Google and Bing for the searches that bring customers.",
  },
  {
    slug: "generative-engine-optimization",
    name: "Generative Engine Optimization (GEO)",
    title: "Generative Engine Optimization (GEO) Services",
    summary:
      "Get your business named and cited when people ask ChatGPT, Perplexity, Gemini, Claude, or Copilot for a recommendation.",
  },
  {
    slug: "answer-engine-optimization",
    name: "Answer Engine Optimization (AEO)",
    title: "Answer Engine Optimization (AEO) Services",
    summary:
      "Structure your content so search engines, AI assistants, and voice assistants can lift your answer directly into their results.",
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
 *
 * Suburbs get no page of their own for the same reason. They are listed on
 * their metro's page and in the areaServed schema instead. Only add a new
 * location when there is something true and specific to say about it.
 */
export const CITIES = [
  {
    slug: "chicago-il",
    city: "Chicago",
    label: "Chicago, IL",
    placeType: "City",
    state: "Illinois",
    stateCode: "IL",
    timeZone: "Central Time",
    wikidata: "https://www.wikidata.org/wiki/Q1297",
    suburbs: [
      "Skokie", "Oak Park", "Park Ridge", "Des Plaines", "Arlington Heights", "Schaumburg",
      "Elmhurst", "Oak Brook", "Downers Grove", "Naperville", "Aurora", "Joliet", "Orland Park",
    ],
  },
  {
    slug: "evanston-il",
    city: "Evanston",
    label: "Evanston, IL",
    placeType: "City",
    state: "Illinois",
    stateCode: "IL",
    timeZone: "Central Time",
    wikidata: "https://www.wikidata.org/wiki/Q462799",
    suburbs: [
      "Skokie", "Wilmette", "Kenilworth", "Winnetka", "Glenview", "Northbrook",
      "Lincolnwood", "Morton Grove", "Rogers Park",
    ],
  },
  {
    slug: "lake-county-il",
    city: "Lake County",
    label: "Lake County, IL",
    placeType: "AdministrativeArea",
    state: "Illinois",
    stateCode: "IL",
    timeZone: "Central Time",
    wikidata: "https://www.wikidata.org/wiki/Q484263",
    suburbs: [
      "Waukegan", "Gurnee", "Libertyville", "Mundelein", "Vernon Hills", "Lake Forest",
      "Highland Park", "Lake Zurich", "Grayslake", "Lake Villa", "Antioch", "Round Lake",
    ],
  },
  {
    slug: "kenosha-wi",
    city: "Kenosha",
    label: "Kenosha, WI",
    placeType: "City",
    state: "Wisconsin",
    stateCode: "WI",
    timeZone: "Central Time",
    wikidata: "https://www.wikidata.org/wiki/Q462161",
    suburbs: [
      "Pleasant Prairie", "Somers", "Bristol", "Salem Lakes", "Twin Lakes", "Paddock Lake",
      "Racine", "Mount Pleasant", "Sturtevant",
    ],
  },
  {
    slug: "milwaukee-wi",
    city: "Milwaukee",
    label: "Milwaukee, WI",
    placeType: "City",
    state: "Wisconsin",
    stateCode: "WI",
    timeZone: "Central Time",
    wikidata: "https://www.wikidata.org/wiki/Q37836",
    suburbs: [
      "Wauwatosa", "West Allis", "Waukesha", "Brookfield", "Greenfield", "Oak Creek",
      "Franklin", "Glendale", "Mequon", "Menomonee Falls", "New Berlin",
    ],
  },
  {
    slug: "northwest-indiana",
    city: "Northwest Indiana",
    label: "Northwest Indiana",
    placeType: "Place",
    state: "Indiana",
    stateCode: "IN",
    timeZone: "Central Time",
    wikidata: "https://www.wikidata.org/wiki/Q7060084",
    suburbs: [
      "Hammond", "Gary", "Munster", "Highland", "Schererville", "Merrillville",
      "Crown Point", "Hobart", "Portage", "Valparaiso", "Chesterton", "Michigan City",
    ],
  },
  {
    slug: "indianapolis-in",
    city: "Indianapolis",
    label: "Indianapolis, IN",
    placeType: "City",
    state: "Indiana",
    stateCode: "IN",
    timeZone: "Eastern Time",
    wikidata: "https://www.wikidata.org/wiki/Q6346",
    suburbs: [
      "Carmel", "Fishers", "Noblesville", "Westfield", "Zionsville", "Lawrence",
      "Greenwood", "Plainfield", "Avon", "Brownsburg",
    ],
  },
  {
    slug: "dallas-tx",
    city: "Dallas",
    label: "Dallas, TX",
    placeType: "City",
    state: "Texas",
    stateCode: "TX",
    timeZone: "Central Time",
    wikidata: "https://www.wikidata.org/wiki/Q16557",
    suburbs: [
      "Fort Worth", "Plano", "Irving", "Arlington", "Frisco", "Richardson", "Garland", "McKinney",
    ],
  },
] as const;

export type CitySlug = (typeof CITIES)[number]["slug"];
export type City = (typeof CITIES)[number];

/** schema.org Place for a location, plus its listed suburbs as cities in the same state. */
export function areaServedFor(c: City) {
  return [
    { "@type": c.placeType, name: c.label, sameAs: c.wikidata },
    ...c.suburbs.map((s) => ({ "@type": "City", name: `${s}, ${c.stateCode}` })),
  ];
}

/** schema.org areaServed entries for every target location (suburbs deduplicated). */
export const AREA_SERVED = Array.from(
  new Map(CITIES.flatMap(areaServedFor).map((p) => [p.name, p])).values(),
);
