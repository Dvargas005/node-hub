import type { ServiceSlug } from "@/lib/seo";

/**
 * Case studies for /work and /work/[slug].
 *
 * Every line here must be true and checkable against the shipped project (the
 * client's repo or the live site). Rules from Erich (2026-10-28):
 * - Only clients who agreed to be named appear here: WECL, COnovate, W.A.R.
 *   The e-commerce client who refused to be named is never listed.
 * - No result numbers until the client sends them. `results` stays undefined and
 *   the section does not render. Never estimate or round up a metric.
 * - No quotes or testimonials (that is the review lane, not this one).
 * - Nouvos-owned products are `kind: "product"` and are labeled as such, never
 *   presented as a client engagement. WAIPAX waits until www.waipax.com is live.
 */

export type WorkSlug = "wecl" | "conovate" | "we-all-related" | "zanapronto";
export type IndustrySlug = "logistics";

export interface WorkItem {
  slug: WorkSlug;
  kind: "client" | "product";
  name: string;
  /** Short line under the name on cards. */
  industryLabel: string;
  industry?: IndustrySlug;
  location: string;
  liveUrl: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  summary: string;
  challenge: string[];
  built: { title: string; body: string }[];
  stack: string[];
  services: ServiceSlug[];
  /** Client-confirmed figures only. Undefined = section hidden. */
  results?: { label: string; value: string }[];
}

export const WORK: WorkItem[] = [
  {
    slug: "wecl",
    kind: "client",
    name: "WECL",
    industryLabel: "Supply chain and logistics consulting",
    industry: "logistics",
    location: "Parkland, FL (served remotely)",
    liveUrl: "https://weclogistic.net",
    metaTitle: "WECL Logistics Website: Case Study",
    metaDescription:
      "How NODE by Nouvos built an editorial website for WECL, a supply chain and logistics consulting firm: services, industries, insights, and a clear path to contact.",
    h1: "An editorial website for a logistics consulting firm",
    summary:
      "World Enterprise Complete Logistics (WECL) advises companies on supply chain and logistics. We designed and built a multi-page site that explains what they do, who they do it for, and how to start a conversation.",
    challenge: [
      "Consulting is sold on trust in the people doing the work. WECL needed a site that reads like a firm with a point of view, not a template, and that gives a buyer a clear path from a service they need to a conversation with the team.",
    ],
    built: [
      {
        title: "Service and industry pages",
        body: "A page for each service and a view of the industries WECL serves, so a buyer can find their own situation quickly.",
      },
      {
        title: "Insights section",
        body: "An articles section with an index and a page per article, giving the firm a place to publish its thinking.",
      },
      {
        title: "About and approach",
        body: "About and approach pages built around the real people at the firm, with their own photos and words.",
      },
      {
        title: "Motion with a reduced-motion path",
        body: "Scroll reveals and an animated US logistics map, all turned off for visitors who ask their device for reduced motion.",
      },
      {
        title: "Search foundations",
        body: "A generated sitemap and robots file, and a static build that crawlers can read without running JavaScript.",
      },
    ],
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "Framer Motion", "Static export", "Vercel"],
    services: ["web-development"],
  },
  {
    slug: "conovate",
    kind: "client",
    name: "COnovate",
    industryLabel: "Battery materials startup",
    location: "Wauwatosa, WI",
    liveUrl: "https://conovateinc.com",
    metaTitle: "COnovate Website Rebuild: WordPress to Astro Case Study",
    metaDescription:
      "How NODE by Nouvos replaced a WordPress and Elementor site for COnovate, a Wauwatosa, WI battery materials company, with a fast static site, a news section, and redirects for every old URL.",
    h1: "Rebuilding a battery materials startup's site off WordPress",
    summary:
      "COnovate, Inc. develops advanced anode materials for lithium-ion batteries. We replaced their WordPress and Elementor theme site with a clean, fast static site they can grow.",
    challenge: [
      "The old site ran on WordPress with a page builder and a purchased theme. It was hard to change and did not give visitors a dependable way to reach the company.",
      "The move had to keep the company email running untouched and could not break links already shared or indexed.",
    ],
    built: [
      {
        title: "A static site on Astro",
        body: "Home, solutions, about, news, and contact pages that ship almost no JavaScript and render fully for crawlers.",
      },
      {
        title: "A news section",
        body: "Press releases live as simple content files, so publishing an update does not mean editing page layouts.",
      },
      {
        title: "Redirects for the old URLs",
        body: "Old WordPress addresses forward permanently to their new pages, so existing links and search listings keep working.",
      },
      {
        title: "Brand kept, contrast fixed",
        body: "The existing brand colors were kept, with a darker green added for text so it meets accessibility contrast.",
      },
      {
        title: "Email left alone",
        body: "The cutover changed only the website records; the company's Microsoft 365 mail was never touched.",
      },
    ],
    stack: ["Astro", "Tailwind CSS", "GSAP", "Vercel"],
    services: ["web-development"],
  },
  {
    slug: "we-all-related",
    kind: "client",
    name: "W.A.R. (We All Related)",
    industryLabel: "Apparel brand",
    location: "Detroit, MI (served remotely)",
    liveUrl: "https://weallrelated.com",
    metaTitle: "W.A.R. We All Related Website: Case Study",
    metaDescription:
      "How NODE by Nouvos built a fast static website for W.A.R. (We All Related), a Detroit apparel movement, with every call to action routed straight to the founder.",
    h1: "A brand site for a Detroit apparel movement",
    summary:
      "W.A.R. (We All Related) is a Detroit apparel movement. We built a site that carries the brand's message and its collection, and sends every inquiry straight to the founder.",
    challenge: [
      "The brand wanted a real home on the web without running an online store: no prices and no checkout, just the story, the collection, and a direct line to the founder.",
    ],
    built: [
      {
        title: "Home, story, and collection",
        body: "A home page with the manifesto, the collection, and contact, plus an about page telling the founder's story.",
      },
      {
        title: "Direct contact, no checkout",
        body: "Every call to action opens an email or a phone call to the founder, as the brand asked. The terms page says plainly that the site takes no payments.",
      },
      {
        title: "Plain HTML, no build step",
        body: "Hand-written HTML, CSS, and a few lines of JavaScript: what is in the repository is exactly what ships, and it loads fast.",
      },
      {
        title: "Share-ready",
        body: "A social share card for link previews, security headers, and image caching configured at the host.",
      },
    ],
    stack: ["HTML", "CSS", "JavaScript", "Vercel"],
    services: ["web-development"],
  },
  {
    slug: "zanapronto",
    kind: "product",
    name: "Zanapronto",
    industryLabel: "Healthcare SaaS (a Nouvos product)",
    location: "Venezuela, built for Latin America",
    liveUrl: "https://www.zanapronto.com",
    metaTitle: "Zanapronto: Multi-Tenant Healthcare SaaS Built by Nouvos",
    metaDescription:
      "Zanapronto is a Nouvos product: a multi-tenant platform for doctors with a public page per doctor, self-service booking, a patient portal, and messaging over WhatsApp, email, and in-app, with mobile apps.",
    h1: "A multi-tenant platform for doctors and their patients",
    summary:
      "Zanapronto is our own product, not a client project. It is the kind of system NODE builds when a project goes past a website: multi-tenant software with a web app, mobile apps, and messaging.",
    challenge: [
      "Independent doctors in Venezuela needed a way to be found online, take bookings, and keep in touch with patients without hiring anyone to build or run software. Each doctor or clinic had to be able to sign up and start, with no setup project.",
    ],
    built: [
      {
        title: "A public page per doctor",
        body: "Each doctor gets a search-friendly public page, so patients can find them and book.",
      },
      {
        title: "Self-service booking",
        body: "Patients book appointments themselves, without a phone call.",
      },
      {
        title: "Secure patient portal",
        body: "Patients see their reports and prescriptions and upload lab results in one place.",
      },
      {
        title: "Messaging across channels",
        body: "Doctor and patient messages flow over WhatsApp, email, and the portal.",
      },
      {
        title: "Multi-tenant by design",
        body: "Every doctor or clinic is its own tenant, so onboarding is a sign-up, not a deployment.",
      },
      {
        title: "Mobile apps",
        body: "iOS and Android apps built from the same codebase as the web platform.",
      },
    ],
    stack: ["Next.js", "TypeScript", "PostgreSQL", "Prisma", "Capacitor", "Vercel"],
    services: ["software-development", "app-development"],
  },
];

export function workFor(slug: string): WorkItem | undefined {
  return WORK.find((w) => w.slug === slug);
}

export function workInIndustry(industry: IndustrySlug): WorkItem[] {
  return WORK.filter((w) => w.industry === industry);
}
