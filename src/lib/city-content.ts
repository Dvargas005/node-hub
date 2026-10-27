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
  /** Heading and intro for the suburbs list rendered from CITIES[].suburbs. */
  areasHeading: string;
  areasIntro: string;
  faqs: { q: string; a: string }[];
}

export const CITY_CONTENT: Record<CitySlug, CityContent> = {
  "chicago-il": {
    slug: "chicago-il",
    metaTitle: "Web, App & Software Development in Chicago, IL",
    metaDescription:
      "Chicago web development, app development, custom software, and SEO from N.O.D.E., headquartered in Evanston, IL. Flat monthly plans from $300.",
    h1: "Web, app, and software development in Chicago",
    areasHeading: "Chicago suburbs we serve",
    areasIntro:
      "Beyond the city we work with businesses across Cook, DuPage, and Will counties. Evanston and the North Shore, and Lake County, each have their own page.",
    lead: [
      "N.O.D.E. is headquartered in Evanston, just north of Chicago, which makes Chicagoland our home market. We build websites, mobile apps, and custom software for Chicago businesses, and we offer the SEO that gets them found as an add-on to any plan.",
      "Our parent company, Nouvos Solutions, builds software for transportation, orders, and warehouses. Chicago is the center of the country's freight rail network and one of its largest logistics markets, so we know the operations side of the businesses we build for here, not only the marketing side.",
    ],
    faqs: [
      {
        q: "Where is N.O.D.E. located?",
        a: "Our headquarters is at 909 Davis Street, Suite 500, Evanston, IL 60201, on Chicago's North Shore. We serve businesses across Chicago and the surrounding suburbs.",
      },
      {
        q: "Do you work with small businesses in Chicago?",
        a: "Yes. The subscription plans are built for small and midsize businesses: $300 per month on Member, $500 on Growth, and $900 on Pro, with a monthly credit allowance for web, design, and marketing work. SEO, GEO, and AEO are add-ons.",
      },
      {
        q: "Can you help my Chicago business show up in local search?",
        a: "Yes. Local SEO covers your Google Business Profile, consistent business details across the web, and pages for the neighborhoods and suburbs you serve, which is what drives map results for searches like \"near me\".",
      },
      {
        q: "Do we need to meet in person?",
        a: "No, but you can. We work in person across Chicagoland, and most work runs through video calls and the N.O.D.E. platform, where you brief work, review it, and approve it.",
      },
    ],
  },

  "evanston-il": {
    slug: "evanston-il",
    metaTitle: "Web Design & Development in Evanston, IL",
    metaDescription:
      "Evanston web design, web development, apps, and custom software from NODE by Nouvos, registered at 909 Davis Street. Monthly plans from $300; SEO as an add-on.",
    h1: "Web design and development in Evanston",
    areasHeading: "North Shore communities we serve",
    areasIntro:
      "From Evanston we work with businesses up and down the North Shore and in the neighborhoods just across the Chicago line.",
    lead: [
      "NODE by Nouvos is registered in downtown Evanston, at 909 Davis Street. We build websites, mobile apps, and custom software for Evanston and North Shore businesses, and offer SEO, GEO, and AEO as add-ons to any plan.",
      "Most Evanston businesses are independent: restaurants and shops downtown and along Central Street and Main Street, professional practices, and companies that grew up around Northwestern University. They tend to need the same things: a fast site that shows up in local searches, hours and menus that stay current, and pages that turn visits into calls and bookings.",
      "The Member plan includes hosting and small edits, so a local business can hand off the website entirely instead of juggling a host, a developer, and a designer.",
    ],
    faqs: [
      {
        q: "Can we meet in person in Evanston?",
        a: "Yes. We meet in person across Evanston and the North Shore by appointment. Our Davis Street address is a registered business office, not a walk-in studio, so please book a time first.",
      },
      {
        q: "How much does a website cost for an Evanston business?",
        a: "Subscription plans are $300 per month on Member, $500 on Growth, and $900 on Pro, on a 12-month commitment, plus a one-time setup fee. Each plan includes monthly credits for web, design, and marketing work, and Member includes hosting and small edits. SEO, GEO, and AEO are add-ons.",
      },
      {
        q: "Can you help my business show up when people search in Evanston?",
        a: "Yes, through the SEO add-on. Local SEO covers your Google Business Profile, consistent business details across directories, and pages for the neighborhoods you serve. It starts at $1,250 a month and is not part of the base plans.",
      },
      {
        q: "Who owns the website when it is done?",
        a: "You do. Work is paid upfront, and the code, design, and content belong to you.",
      },
    ],
  },

  "lake-county-il": {
    slug: "lake-county-il",
    metaTitle: "Web Design & Development in Lake County, IL",
    metaDescription:
      "Web design, web development, apps, and custom software for Lake County, IL businesses in Waukegan, Gurnee, Libertyville, and Lake Forest. In person by appointment. Plans from $300.",
    h1: "Web design and development in Lake County, Illinois",
    areasHeading: "Lake County communities we serve",
    areasIntro:
      "We work in person across Lake County, from the towns along Lake Michigan to the lakes region near the Wisconsin line.",
    lead: [
      "NODE by Nouvos works with businesses across Lake County, Illinois, from Waukegan and Gurnee to Libertyville, Mundelein, and the lakes region around Lake Villa and Antioch. We build websites, mobile apps, and custom software, and offer SEO as an add-on to any plan.",
      "Lake County mixes corporate campuses along the Tollway with family-owned shops, contractors, and seasonal businesses around the Chain O'Lakes and Six Flags Great America in Gurnee. For most of them, local search decides who gets the call: \"near me\" searches, map results, and reviews.",
    ],
    faqs: [
      {
        q: "Do you meet in person in Lake County?",
        a: "Yes. We meet in person across Lake County by appointment, and most day-to-day work runs through video calls and the NODE platform, where you brief work, review it, and approve it.",
      },
      {
        q: "Do you work with contractors and service businesses?",
        a: "Yes. For trades and service businesses we build sites around what drives calls: service and service-area pages, click-to-call, quote request forms, and reviews. Ongoing local SEO is available as an add-on.",
      },
      {
        q: "How much does a website cost for a Lake County business?",
        a: "Subscription plans are $300 per month on Member, $500 on Growth, and $900 on Pro, on a 12-month commitment, plus a one-time setup fee. Each plan includes monthly credits for web, design, and marketing work, and Member includes hosting and small edits. SEO, GEO, and AEO are add-ons.",
      },
      {
        q: "Is search in Lake County different from Chicago?",
        a: "Yes. People search by town, such as \"plumber Libertyville\" or \"web design Gurnee\", so your pages and listings need to name the towns you actually serve.",
      },
    ],
  },

  "kenosha-wi": {
    slug: "kenosha-wi",
    metaTitle: "Web Design & Development in Kenosha, WI",
    metaDescription:
      "Kenosha and Racine web design, web development, apps, and custom software from NODE by Nouvos. In person across southeastern Wisconsin. Plans from $300; SEO as an add-on.",
    h1: "Web design and development in Kenosha",
    areasHeading: "Kenosha and Racine County communities we serve",
    areasIntro: "We work in person across Kenosha and Racine counties along the I-94 corridor.",
    lead: [
      "NODE by Nouvos builds websites, mobile apps, and custom software for businesses in Kenosha, Racine, and the towns along the state line. We work in person across Kenosha and Racine counties, and our Illinois headquarters in Evanston is about an hour south.",
      "The I-94 corridor between Chicago and Milwaukee has filled with distribution centers and manufacturers, especially around Pleasant Prairie, Kenosha, and Mount Pleasant. Our parent company, Nouvos Solutions, builds transportation, order, and warehouse software, so we understand the operations side of these businesses, not only the website.",
      "Kenosha's downtown, lakefront, and HarborPark businesses compete for many of the same customers as businesses across the Illinois line, so showing up in searches from both states matters.",
    ],
    faqs: [
      {
        q: "Do you meet in person in Kenosha?",
        a: "Yes. We meet in person across Kenosha and Racine counties by appointment. Most day-to-day work runs through video calls and the NODE platform.",
      },
      {
        q: "Can you build tools for a warehouse or distribution business?",
        a: "Yes. Beyond websites we build quote request flows, customer portals, internal tools, and integrations with order and warehouse systems. Those projects are scoped and quoted after a discovery call.",
      },
      {
        q: "How much does a website cost for a Kenosha business?",
        a: "Subscription plans are $300 per month on Member, $500 on Growth, and $900 on Pro, on a 12-month commitment, plus a one-time setup fee. Each plan includes monthly credits for web, design, and marketing work, and Member includes hosting and small edits. SEO, GEO, and AEO are add-ons.",
      },
      {
        q: "Do you work with businesses on both sides of the state line?",
        a: "Yes. We serve Kenosha County and northern Lake County, Illinois, as one market, and can set up pages and listings for customers in both states.",
      },
    ],
  },

  "northwest-indiana": {
    slug: "northwest-indiana",
    metaTitle: "Web Design & Development in Northwest Indiana",
    metaDescription:
      "Web design, web development, apps, and custom software for Northwest Indiana businesses in Hammond, Merrillville, Crown Point, and Valparaiso. Central Time. Plans from $300.",
    h1: "Web design and development in Northwest Indiana",
    areasHeading: "Northwest Indiana communities we serve",
    areasIntro:
      "We serve businesses in Lake, Porter, and LaPorte counties remotely, on the same Central Time as Chicago.",
    lead: [
      "NODE by Nouvos builds websites, mobile apps, and custom software for businesses in Lake, Porter, and LaPorte counties, and offers the SEO that gets them found as an add-on. Northwest Indiana runs on Central Time, like our Chicago-area headquarters, so we keep the same business hours as you.",
      "The region's economy is built on steel, manufacturing, and the logistics that serve them, with the Port of Indiana at Burns Harbor and freight moving on I-80, I-90, and I-65. Our parent company builds logistics software, so industrial and distribution businesses here get a team that understands their operations.",
      "We serve Northwest Indiana remotely, through video calls and the NODE platform, where you brief work, review it, and approve it.",
    ],
    faqs: [
      {
        q: "Do you work with businesses in Northwest Indiana?",
        a: "Yes. We serve Hammond, Gary, Munster, Merrillville, Crown Point, Valparaiso, and the rest of Lake, Porter, and LaPorte counties remotely.",
      },
      {
        q: "Are you an Indiana company?",
        a: "No. NODE is a service of Nouvos Solutions LLC, an Illinois company headquartered in Evanston. We work with Indiana businesses remotely.",
      },
      {
        q: "Is Northwest Indiana on Central Time?",
        a: "Yes. Lake, Porter, and LaPorte counties are on Central Time, unlike Indianapolis, so we work the same hours as you.",
      },
      {
        q: "How much does a website cost for a Northwest Indiana business?",
        a: "Subscription plans are $300 per month on Member, $500 on Growth, and $900 on Pro, on a 12-month commitment, plus a one-time setup fee. Each plan includes monthly credits for web, design, and marketing work, and Member includes hosting and small edits. SEO, GEO, and AEO are add-ons.",
      },
    ],
  },

  "milwaukee-wi": {
    slug: "milwaukee-wi",
    metaTitle: "Milwaukee Software Development Agency & Web Developers",
    metaDescription:
      "Software development agency and web developers for Milwaukee businesses: websites, apps, and custom software from NODE by Nouvos, on Central Time. Monthly plans from $300.",
    h1: "Software development agency and web developers for Milwaukee",
    areasHeading: "Milwaukee suburbs we serve",
    areasIntro:
      "We work with businesses across Milwaukee, Waukesha, and Ozaukee counties. Kenosha and Racine have their own page.",
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
        a: "Subscription plans are $300 per month on Member, $500 on Growth, and $900 on Pro, plus a one-time setup fee. Each plan includes monthly credits for web, design, and marketing work. SEO, GEO, and AEO are add-ons.",
      },
      {
        q: "Do we need to meet in person?",
        a: "No, but you can. We work in person across Milwaukee and southeastern Wisconsin, and most work runs through video calls and the N.O.D.E. platform, where you brief work, review it, and approve it.",
      },
    ],
  },

  "dallas-tx": {
    slug: "dallas-tx",
    metaTitle: "Web, App & Software Development in Dallas, TX",
    metaDescription:
      "Dallas web development, app development, custom software, and SEO from N.O.D.E., on Central Time. Flat monthly plans from $300, with target turnaround of 2 to 5 business days, subject to scope.",
    h1: "Web, app, and software development in Dallas",
    areasHeading: "Dallas-Fort Worth cities we serve",
    areasIntro:
      "We serve businesses across the metroplex remotely.",
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
        a: "App and custom software work is scoped per project. After a discovery call we send a written scope and a quote. Website and marketing work runs on monthly plans from $300, and SEO is an add-on from $1,250 a month.",
      },
      {
        q: "Do we need to meet in person?",
        a: "No. Our team delivers through video calls and the N.O.D.E. platform, where you brief work, review it, and approve it.",
      },
    ],
  },

  "indianapolis-in": {
    slug: "indianapolis-in",
    metaTitle: "Indianapolis Web Development Company & App Developers",
    metaDescription:
      "Web development company serving Indianapolis and central Indiana: websites, mobile apps, and custom software from NODE by Nouvos. Monthly plans from $300; apps quoted per project.",
    h1: "Web development company for Indianapolis businesses",
    areasHeading: "Indianapolis suburbs we serve",
    areasIntro:
      "We serve businesses across the Indianapolis metro remotely, including Hamilton, Boone, Johnson, and Hendricks counties.",
    lead: [
      "N.O.D.E. builds websites, mobile apps, and custom software for Indianapolis businesses, and runs the SEO that gets them found. We are based in the Chicago area and work remotely with clients across central Indiana.",
      "Indianapolis sits at the crossroads of more interstate highways than almost any other U.S. city, which has made it one of the country's major distribution hubs. Our parent company builds logistics software, so distribution and supply chain businesses here get a team that knows their world.",
      "For a central Indiana distributor or third-party logistics provider, that usually means a website that explains your lanes, warehouses, and service area clearly, plus the practical tools behind it: quote and booking requests, shipment status pages for customers, and connections to the order and warehouse systems you already run.",
      "Indianapolis businesses are one hour ahead of us, on Eastern Time. We book calls in your time zone and plan delivery windows in business days, so a request with a 3-business-day target on the Growth plan runs on the same schedule it would anywhere else.",
    ],
    faqs: [
      {
        q: "Do you work with businesses in Indianapolis?",
        a: "Yes. We serve Indianapolis and central Indiana remotely through video calls and the N.O.D.E. platform.",
      },
      {
        q: "Are you an Indiana web development company?",
        a: "No. NODE is a service of Nouvos Solutions LLC, an Illinois company headquartered in Evanston. Our web developers and app developers work with Indianapolis and Indiana businesses remotely.",
      },
      {
        q: "Indianapolis is on Eastern Time. Is that a problem?",
        a: "No. Our headquarters is on Central Time, one hour behind Indianapolis, and we schedule calls in your time zone. Work requests and approvals happen in the platform whenever it suits you.",
      },
      {
        q: "How much does a website cost for an Indianapolis business?",
        a: "Subscription plans are $300 per month on Member, $500 on Growth, and $900 on Pro, plus a one-time setup fee. Each plan includes monthly credits for web, design, and marketing work. SEO, GEO, and AEO are add-ons.",
      },
      {
        q: "Can you help us get found in local search?",
        a: "Yes. Local SEO covers your Google Business Profile, consistent business details across the web, and location pages for the areas you serve.",
      },
      {
        q: "Can you build a quote or shipment tracking tool for a logistics company?",
        a: "Yes. Quote request flows, customer portals with shipment status, and integrations with order and warehouse systems are custom software work, scoped and quoted after a discovery call.",
      },
    ],
  },
};
