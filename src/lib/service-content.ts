import type { ServiceSlug } from "@/lib/seo";

/**
 * Long-form copy for the /services/[slug] pages.
 *
 * Every claim here has to be true of N.O.D.E. today: the landing page copy and
 * the service catalog (prisma/seed-services.ts) are the reference. Web and SEO
 * work is sold as credit items on the subscription plans; app and custom
 * software work is NOT in the credit catalog and is scoped as a custom project
 * or Dedicated engagement, so those pages must say so rather than imply a
 * Member plan covers an app build.
 */

export interface ServiceContent {
  slug: ServiceSlug;
  /** schema.org Service.serviceType */
  serviceType: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  lead: string[];
  /** How the work is bought: through plan credits, or scoped separately. */
  model: "plan" | "project";
  deliverables: { title: string; body: string }[];
  fit: string[];
  faqs: { q: string; a: string }[];
}

export const SERVICE_CONTENT: Record<ServiceSlug, ServiceContent> = {
  "web-development": {
    slug: "web-development",
    serviceType: "Web development",
    h1: "Web development on a monthly subscription",
    metaTitle: "Web Development Services by Subscription",
    metaDescription:
      "Landing pages, business websites, online stores, and custom web tools built by an in-house team. Flat monthly plans from $300, delivered in 48 to 72 business hours.",
    eyebrow: "WEB DEVELOPMENT",
    lead: [
      "Most small and midsize businesses buy a website once, pay a large invoice, and then watch it go stale because every change is a new quote. N.O.D.E. works the other way: one monthly plan, a team that already knows your site, and changes delivered in days instead of billed by the hour.",
      "Every site is built by our in-house developers on a modern stack (Next.js and TypeScript), deployed fast, and kept current as your business changes. You request work through a guided brief, your project manager assigns it, and you review finished work instead of managing freelancers.",
    ],
    model: "plan",
    deliverables: [
      {
        title: "Landing pages",
        body: "Single-purpose pages for a launch, a campaign, or a service line, from a basic landing to an advanced landing with on-page SEO built in.",
      },
      {
        title: "Business websites",
        body: "Single-page and multi-page sites that explain what you do, where you do it, and how to reach you, written and structured so search engines understand them.",
      },
      {
        title: "Online stores",
        body: "From a basic store to a full e-commerce build, with product pages, checkout, and the structured product data that shopping results rely on.",
      },
      {
        title: "Forms and web tools",
        body: "Contact forms, quote requests, booking flows, and custom web tools that connect to the systems you already use.",
      },
      {
        title: "Google Business setup",
        body: "Your Google Business Profile configured and connected to your site, so the map listing and the website tell the same story.",
      },
      {
        title: "Ongoing changes",
        body: "New pages, copy updates, and fixes handled as regular requests against your plan, with unlimited revisions until you approve.",
      },
    ],
    fit: [
      "You need a professional site live quickly and do not want a five-figure one-time invoice.",
      "Your current site is outdated and every small change turns into a new quote.",
      "You want one team responsible for the site, the SEO, and the marketing that points at it.",
    ],
    faqs: [
      {
        q: "How much does a website cost with N.O.D.E.?",
        a: "Plans start at $300 per month (Member), with Growth at $500 and Pro at $900, plus a one-time setup fee. Each plan includes a monthly credit allowance that you spend on items from the service catalog, such as a landing page or a multi-page website. You can also buy credits one to one as you go.",
      },
      {
        q: "How fast is a website delivered?",
        a: "Most deliverables arrive in 48 to 72 business hours. Plan tiers set the delivery window: 5 business days on Member, 3 on Growth, and 2 on Pro. Larger multi-page builds are split into requests so you see progress throughout.",
      },
      {
        q: "What technology do you build with?",
        a: "Our default stack is Next.js with TypeScript, which produces fast, search-friendly pages. We pick the stack that fits the project, and existing sites can be maintained where they are.",
      },
      {
        q: "Can you work on my existing website?",
        a: "Yes. Updates, fixes, new pages, and SEO work on an existing site are all normal requests on a plan.",
      },
      {
        q: "Are there long contracts?",
        a: "No. Plans are monthly with no long contracts. Dedicated engagements for larger teams can carry a minimum term, which is stated up front.",
      },
    ],
  },

  "app-development": {
    slug: "app-development",
    serviceType: "Mobile application development",
    h1: "Mobile app development for iOS and Android",
    metaTitle: "Mobile App Development Services (iOS and Android)",
    metaDescription:
      "iOS and Android apps designed, built, and taken through App Store and Google Play review by the team that ships Nouvos products. Scoped per project after a discovery call.",
    eyebrow: "APP DEVELOPMENT",
    lead: [
      "An app is a product, not a page. It has to pass App Store and Google Play review, survive operating system updates, and keep working after launch. N.O.D.E. builds apps with the same team that designs, ships, and operates Nouvos's own products.",
      "App work is scoped as a custom project or a Dedicated engagement rather than a credit item, because a real app needs a real estimate. We start with a discovery call, turn it into a written scope, and quote it before any work begins.",
    ],
    model: "project",
    deliverables: [
      {
        title: "Product scoping",
        body: "A written scope covering the screens, the data, the integrations, and what the first release must do, so the estimate is based on something concrete.",
      },
      {
        title: "UX and interface design",
        body: "Flows and screens designed for phones first, following Apple and Google interface conventions so the app feels native on both.",
      },
      {
        title: "Cross-platform builds",
        body: "iOS and Android from a shared codebase where it fits, which keeps cost and maintenance down without giving up store distribution.",
      },
      {
        title: "Backend and APIs",
        body: "Accounts, payments, notifications, and the server side the app talks to, built on the same infrastructure we run in production.",
      },
      {
        title: "Store submission",
        body: "App Store and Google Play listings, review submission, and handling reviewer feedback, including the payment rules each store enforces.",
      },
      {
        title: "Post-launch support",
        body: "Operating system updates, crash fixes, and new features after launch, continued as an ongoing engagement.",
      },
    ],
    fit: [
      "You have a product idea or an internal workflow that needs to live on a phone.",
      "You need an MVP in front of real users before committing to a full build.",
      "You already have an app that needs a team to maintain and extend it.",
    ],
    faqs: [
      {
        q: "How much does it cost to build an app?",
        a: "It depends on scope, which is why app work is quoted per project rather than sold as a plan credit. After a discovery call we send a written scope and a fixed quote for the first release. Ongoing work can continue as a Dedicated engagement.",
      },
      {
        q: "Do you build for both iOS and Android?",
        a: "Yes. Where it fits the product we build both from a shared codebase, which lowers cost and keeps the two versions in step.",
      },
      {
        q: "Will you handle App Store and Google Play submission?",
        a: "Yes. We prepare the listings, submit for review, and handle reviewer feedback. We also design around store payment rules, which decide how an app is allowed to charge users.",
      },
      {
        q: "Can you build an MVP first?",
        a: "Yes. An MVP with the smallest set of features that proves the idea is often the right first release, and it is how we scope most new apps.",
      },
    ],
  },

  "software-development": {
    slug: "software-development",
    serviceType: "Custom software development",
    h1: "Custom software development",
    metaTitle: "Custom Software Development Services",
    metaDescription:
      "Multi-tenant SaaS platforms, internal tools, and system integrations built by the team behind Nouvos's production supply chain software. Scoped per project after a discovery call.",
    eyebrow: "SOFTWARE DEVELOPMENT",
    lead: [
      "N.O.D.E. comes out of Nouvos Solutions, a technology company that builds and runs its own software in production, including supply chain systems for transportation, orders, and warehouses. That is the experience we bring to custom software: multi-tenant architecture, real deadlines, and systems that keep running after the demo.",
      "Custom software is scoped as a project or a Dedicated engagement. We start by understanding the workflow you need to support, write it down as a scope, and quote it before building.",
    ],
    model: "project",
    deliverables: [
      {
        title: "SaaS platforms",
        body: "Multi-tenant products with accounts, roles and permissions, billing, and audit trails designed in from the first version rather than retrofitted.",
      },
      {
        title: "Internal tools",
        body: "Dashboards, admin panels, and back-office tools that replace spreadsheets and manual steps.",
      },
      {
        title: "Integrations and automation",
        body: "Connecting the systems you already use through APIs, webhooks, and scheduled jobs, so data moves without someone copying it.",
      },
      {
        title: "AI features",
        body: "Assistants, document processing, and guided workflows built on current AI models where they genuinely save time.",
      },
      {
        title: "Cloud infrastructure",
        body: "Hosting, databases, monitoring, and deployment set up so the software is observable and recoverable.",
      },
      {
        title: "Modernization",
        body: "Taking over an existing system, stabilizing it, and moving it forward without a risky full rewrite.",
      },
    ],
    fit: [
      "Your business runs on spreadsheets and manual steps that software could handle.",
      "You are launching a software product and need a team that has shipped one.",
      "You have an existing system that needs a team to take ownership of it.",
    ],
    faqs: [
      {
        q: "How much does custom software cost?",
        a: "It depends on what the software has to do, so it is quoted per project after a discovery call. You get a written scope and a quote before work begins. Longer engagements can run as a Dedicated retainer.",
      },
      {
        q: "What kind of software do you build?",
        a: "Multi-tenant SaaS products, internal tools, integrations between existing systems, and AI-assisted workflows. Our own production software includes transportation, order, and warehouse management systems.",
      },
      {
        q: "Can you take over an existing codebase?",
        a: "Yes. We review it, stabilize what is fragile, and then extend it. A rewrite is a last resort, not a default.",
      },
      {
        q: "Do you build AI features?",
        a: "Yes, where they save real time: guided intake, document processing, and assistants inside a workflow. N.O.D.E.'s own request system uses an AI-guided briefing assistant.",
      },
    ],
  },

  seo: {
    slug: "seo",
    serviceType: "Search engine optimization",
    h1: "SEO, GEO, and AEO services",
    metaTitle: "SEO, GEO and AEO Services",
    metaDescription:
      "Get found on Google, Bing, and in AI answers from ChatGPT, Perplexity, Claude, and Gemini. Technical SEO, local SEO, structured data, and answer engine optimization on a monthly plan.",
    eyebrow: "SEO / GEO / AEO",
    lead: [
      "Search has split in two. People still search Google and Bing, but more and more of them ask ChatGPT, Perplexity, Claude, or Gemini and get an answer instead of a list of links. SEO gets you ranked in the first. GEO (generative engine optimization) and AEO (answer engine optimization) get you named in the second.",
      "They share a foundation: a site that crawlers can read, clear facts about your business stated the same way everywhere, and structured data that tells machines exactly what you do and where. N.O.D.E. builds that foundation and keeps it current as a monthly service.",
    ],
    model: "plan",
    deliverables: [
      {
        title: "SEO audit",
        body: "A review of how search engines see your site today: indexing, speed, titles, duplicate pages, and what is keeping you out of results.",
      },
      {
        title: "Technical SEO foundation",
        body: "Sitemaps, robots rules, canonical URLs, page titles, and descriptions fixed so every page you want found can be found.",
      },
      {
        title: "Local SEO",
        body: "Google Business Profile, consistent name, address, and phone across the web, and location pages for the areas you serve.",
      },
      {
        title: "Structured data",
        body: "Schema.org markup for your business, services, products, and FAQs, which powers rich results and gives AI systems facts they can quote.",
      },
      {
        title: "GEO and AEO",
        body: "Making your site readable to AI crawlers, publishing an llms.txt, answering the questions your customers actually ask, and building the third-party mentions that AI assistants cite.",
      },
      {
        title: "Ongoing SEO",
        body: "Monthly content, new pages, and fixes as search results and AI answers change, with Search Console and Bing Webmaster Tools monitored for you.",
      },
    ],
    fit: [
      "Customers cannot find you when they search for what you sell.",
      "You rank for your name but not for the services you offer.",
      "You want to show up when someone asks an AI assistant for a recommendation in your field.",
    ],
    faqs: [
      {
        q: "What is the difference between SEO, GEO, and AEO?",
        a: "SEO (search engine optimization) improves how your site ranks in search engines like Google and Bing. GEO (generative engine optimization) improves how often AI tools such as ChatGPT, Perplexity, Claude, and Gemini mention your business in generated answers. AEO (answer engine optimization) structures your content so it can be pulled directly into answers, featured snippets, and voice results. They rely on the same foundation, so we do them together.",
      },
      {
        q: "How long does SEO take to work?",
        a: "Technical fixes and indexing can show results in weeks. Ranking for competitive terms usually takes several months and depends on your market and your competitors. Local and branded searches typically move first.",
      },
      {
        q: "Do you guarantee first-page rankings?",
        a: "No. Nobody controls Google's or an AI system's results, and any agency promising a guaranteed position is guessing. We commit to the work that moves rankings and report what changed.",
      },
      {
        q: "How do I get my business mentioned by ChatGPT or Perplexity?",
        a: "AI assistants favor sources they can read and verify. That means a site their crawlers can access, clear and consistent facts about your business, structured data, direct answers to common questions, and mentions on reputable third-party sites. We work on all of those.",
      },
      {
        q: "Does this help with Bing, Safari, and Firefox too?",
        a: "Yes. Safari and Firefox use Google by default, and Bing also powers DuckDuckGo, Yahoo, and ChatGPT search. We set up both Google Search Console and Bing Webmaster Tools, and use IndexNow so new pages reach Bing quickly.",
      },
      {
        q: "How much do SEO services cost?",
        a: "SEO work is part of the subscription plans: $300 per month on Member, $500 on Growth, and $900 on Pro, plus a one-time setup fee. Audits, foundations, local SEO, and ongoing SEO are items in the service catalog.",
      },
    ],
  },
};

/** Shared four-step process, taken from the landing page's own description. */
export const PROCESS_STEPS = [
  {
    title: "Pick a plan or book a call",
    body: "Subscribe to a plan and your team activates within 24 hours, or book a discovery call for custom app and software projects.",
  },
  {
    title: "Brief it with the AI assistant",
    body: "A guided assistant turns what you need into a professional brief, with files attached, so the team can start without back and forth.",
  },
  {
    title: "Your team builds it",
    body: "A project manager assigns the work to in-house designers and developers. Most deliverables arrive in 48 to 72 business hours.",
  },
  {
    title: "Approve or revise",
    body: "Request revisions until it is right. Approve on the first round and earn bonus credits.",
  },
];
