import type { IndustrySlug } from "@/lib/work-content";

/**
 * Long-form copy for the /industries/[slug] pages.
 *
 * Same rules as service-content.ts: every claim must be true of N.O.D.E. today.
 * Websites and small web tools run on plan credits; portals, integrations, and
 * apps are quoted per project. SEO is an add-on, never inside a plan. A new
 * industry only gets a page when there is real work to point at (see WORK).
 */

export interface IndustryContent {
  slug: IndustrySlug;
  name: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  lead: string[];
  needs: { title: string; body: string }[];
  fit: string[];
  faqs: { q: string; a: string }[];
}

export const INDUSTRY_CONTENT: Record<IndustrySlug, IndustryContent> = {
  logistics: {
    slug: "logistics",
    name: "Logistics",
    h1: "Websites and software for small logistics companies",
    metaTitle: "Web Development for 3PLs, Freight, and Logistics Companies",
    metaDescription:
      "Websites, quote forms, and custom software for small logistics, 3PL, freight, and supply chain firms, from a team that runs its own supply chain software. Plans from $300 per month.",
    eyebrow: "LOGISTICS, 3PL, AND FREIGHT",
    lead: [
      "Small logistics, 3PL, freight, and supply chain firms win work on trust and speed, but their websites rarely show either. Shippers want to see the lanes, services, and industries you cover, and a quick way to ask for a quote.",
      "N.O.D.E. is operated by Nouvos Solutions LLC, which builds and runs its own production supply chain software for transportation, order, and warehouse management. We already speak the language of loads, lanes, and warehouses, so you spend less time explaining your business and more time reviewing finished work.",
    ],
    needs: [
      {
        title: "A site that explains your network",
        body: "Service, industry, and coverage pages that show shippers what you move, where, and for whom.",
      },
      {
        title: "Quote and contact forms",
        body: "Quote requests that capture what your team needs to price a load or a contract, routed to the right inbox.",
      },
      {
        title: "Content that builds trust",
        body: "An insights or news section so your people and your point of view are visible to buyers.",
      },
      {
        title: "Portals and integrations",
        body: "Customer portals, tracking views, and connections to the systems you already use. These are scoped and quoted per project.",
      },
      {
        title: "Search, as an add-on",
        body: "SEO, GEO, and AEO for searches like \"3PL near me\" are add-ons from $1,250 per month, not part of the base plans.",
      },
    ],
    fit: [
      "You run a small 3PL, freight brokerage, carrier, warehouse, or supply chain consultancy.",
      "Your website is out of date, or you do not have one that explains what you actually do.",
      "You want one team for the site now and for portals or integrations later.",
      "You would rather pay a flat monthly plan than a new quote for every change.",
    ],
    faqs: [
      {
        q: "Do you only work with logistics companies?",
        a: "No. N.O.D.E. serves small businesses in many industries. Logistics is a focus because Nouvos builds and runs its own supply chain software, so we understand how these businesses work.",
      },
      {
        q: "Can you build a customer portal or connect to our TMS or WMS?",
        a: "Yes, as a custom project. Portals and integrations are not plan credit items; we scope them with you and quote them per project.",
      },
      {
        q: "Is SEO included in the monthly plans?",
        a: "No. SEO, GEO, and AEO are add-ons to any plan: Starter SEO $1,250 per month, Full SEO $2,500 per month, and Full SEO with GEO and AEO $4,000 per month.",
      },
      {
        q: "Do you work with logistics firms outside the Midwest?",
        a: "Yes. We serve clients nationwide and abroad remotely. In-person meetings are available by appointment in Illinois and Wisconsin.",
      },
      {
        q: "Who owns the website you build?",
        a: "You do. Work is paid upfront, and the code, design, and content belong to you.",
      },
    ],
  },
};

export function industryFor(slug: string): IndustryContent | undefined {
  return (INDUSTRY_CONTENT as Record<string, IndustryContent | undefined>)[slug];
}
