import type { CitySlug } from "@/lib/seo";

/**
 * Copy for /locations/[city].
 *
 * Each city gets its own intro and FAQs. Swapping only the city name across
 * identical pages is what Google treats as doorway pages, so every entry has
 * to say something true and specific to that metro. Do not add claims about
 * local clients, offices, or in-person availability unless they are real.
 */

export interface CityContent {
  slug: CitySlug;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  lead: string[];
  faqs: { q: string; a: string }[];
}

export const CITY_CONTENT: Record<CitySlug, CityContent> = {
  "chicago-il": {
    slug: "chicago-il",
    metaTitle: "Web, App & Software Development in Chicago, IL",
    metaDescription:
      "Chicago web development, app development, custom software, and SEO from N.O.D.E., headquartered in Evanston, IL. Flat monthly plans from $300.",
    h1: "Web, app, and software development in Chicago",
    lead: [
      "N.O.D.E. is headquartered in Evanston, just north of Chicago, which makes Chicagoland our home market. We build websites, mobile apps, and custom software for Chicago businesses, and we handle the SEO that gets them found, all under one monthly subscription.",
      "Our parent company, Nouvos Solutions, builds software for transportation, orders, and warehouses. Chicago is the center of the country's freight rail network and one of its largest logistics markets, so we know the operations side of the businesses we build for here, not only the marketing side.",
    ],
    faqs: [
      {
        q: "Where is N.O.D.E. located?",
        a: "Our headquarters is at 909 Davis Street, Suite 500, Evanston, IL 60201, on Chicago's North Shore. We serve businesses across Chicago and the surrounding suburbs.",
      },
      {
        q: "Do you work with small businesses in Chicago?",
        a: "Yes. The subscription plans are built for small and midsize businesses: $300 per month on Member, $500 on Growth, and $900 on Pro, with a monthly credit allowance for web, design, SEO, and marketing work.",
      },
      {
        q: "Can you help my Chicago business show up in local search?",
        a: "Yes. Local SEO covers your Google Business Profile, consistent business details across the web, and pages for the neighborhoods and suburbs you serve, which is what drives map results for searches like \"near me\".",
      },
      {
        q: "Do we need to meet in person?",
        a: "No. Our team delivers through video calls and the N.O.D.E. platform, where you brief work, review it, and approve it. If an in-person meeting matters for your project, ask and we will tell you what is possible.",
      },
    ],
  },

  "milwaukee-wi": {
    slug: "milwaukee-wi",
    metaTitle: "Web, App & Software Development in Milwaukee, WI",
    metaDescription:
      "Milwaukee web development, app development, custom software, and SEO from N.O.D.E., a Chicago-area studio on Central Time. Flat monthly plans from $300.",
    h1: "Web, app, and software development in Milwaukee",
    lead: [
      "N.O.D.E. builds websites, mobile apps, and custom software for Milwaukee businesses, and runs the SEO that gets them found. We are based in Evanston, Illinois, about 80 miles south, and on the same Central Time as you.",
      "Milwaukee has one of the strongest manufacturing economies in the Midwest. Manufacturers and distributors often need more than a website: quote request tools, dealer portals, and integrations with the systems that run the shop floor. That is the kind of software our team builds.",
    ],
    faqs: [
      {
        q: "Do you work with businesses in Milwaukee?",
        a: "Yes. We serve Milwaukee and southeastern Wisconsin from our headquarters in Evanston, Illinois, which is on Central Time like you.",
      },
      {
        q: "Can you build tools for a manufacturing or distribution business?",
        a: "Yes. Beyond websites we build quote request flows, customer and dealer portals, internal tools, and integrations between existing systems. Those projects are scoped and quoted after a discovery call.",
      },
      {
        q: "How much does a website cost for a Milwaukee business?",
        a: "Subscription plans are $300 per month on Member, $500 on Growth, and $900 on Pro, plus a one-time setup fee. Each plan includes monthly credits for web, design, SEO, and marketing work.",
      },
      {
        q: "Do we need to meet in person?",
        a: "No. Our team delivers through video calls and the N.O.D.E. platform, where you brief work, review it, and approve it.",
      },
    ],
  },

  "dallas-tx": {
    slug: "dallas-tx",
    metaTitle: "Web, App & Software Development in Dallas, TX",
    metaDescription:
      "Dallas web development, app development, custom software, and SEO from N.O.D.E., on Central Time. Flat monthly plans from $300, delivered in 48 to 72 business hours.",
    h1: "Web, app, and software development in Dallas",
    lead: [
      "N.O.D.E. builds websites, mobile apps, and custom software for businesses in Dallas and across the Dallas-Fort Worth metroplex, and runs the SEO that gets them found. We are based on Central Time, the same as you, and work through video calls and our own delivery platform.",
      "DFW is one of the largest freight and distribution markets in the country. Our parent company, Nouvos Solutions, builds transportation, order, and warehouse software, so logistics and distribution businesses in Dallas get a team that understands how their operations actually run.",
    ],
    faqs: [
      {
        q: "Do you work with businesses in Dallas-Fort Worth?",
        a: "Yes. We serve Dallas, Fort Worth, and the surrounding metroplex remotely. Our headquarters is on Central Time, like you.",
      },
      {
        q: "Do you have experience with logistics companies?",
        a: "Yes. Nouvos Solutions, the company behind N.O.D.E., builds and runs its own software for transportation, order, and warehouse management.",
      },
      {
        q: "How much does app or software development cost?",
        a: "App and custom software work is scoped per project. After a discovery call we send a written scope and a quote. Website, SEO, and marketing work runs on monthly plans from $300.",
      },
      {
        q: "Do we need to meet in person?",
        a: "No. Our team delivers through video calls and the N.O.D.E. platform, where you brief work, review it, and approve it.",
      },
    ],
  },

  "indianapolis-in": {
    slug: "indianapolis-in",
    metaTitle: "Web, App & Software Development in Indianapolis, IN",
    metaDescription:
      "Indianapolis web development, app development, custom software, and SEO from N.O.D.E. Flat monthly plans from $300, delivered in 48 to 72 business hours.",
    h1: "Web, app, and software development in Indianapolis",
    lead: [
      "N.O.D.E. builds websites, mobile apps, and custom software for Indianapolis businesses, and runs the SEO that gets them found. We are based in the Chicago area and work remotely with clients across central Indiana.",
      "Indianapolis sits at the crossroads of more interstate highways than almost any other U.S. city, which has made it one of the country's major distribution hubs. Our parent company builds logistics software, so distribution and supply chain businesses here get a team that knows their world.",
    ],
    faqs: [
      {
        q: "Do you work with businesses in Indianapolis?",
        a: "Yes. We serve Indianapolis and central Indiana remotely through video calls and the N.O.D.E. platform.",
      },
      {
        q: "Indianapolis is on Eastern Time. Is that a problem?",
        a: "No. Our headquarters is on Central Time, one hour behind Indianapolis, and we schedule calls in your time zone. Work requests and approvals happen in the platform whenever it suits you.",
      },
      {
        q: "How much does a website cost for an Indianapolis business?",
        a: "Subscription plans are $300 per month on Member, $500 on Growth, and $900 on Pro, plus a one-time setup fee. Each plan includes monthly credits for web, design, SEO, and marketing work.",
      },
      {
        q: "Can you help us get found in local search?",
        a: "Yes. Local SEO covers your Google Business Profile, consistent business details across the web, and location pages for the areas you serve.",
      },
    ],
  },
};
