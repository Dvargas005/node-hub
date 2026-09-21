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
        q: "Who owns my website?",
        a: "You do. Work is paid upfront, so the code, design, and content we build for your business belong to you once delivered. If you ever move on, you keep everything.",
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
        q: "Who owns the app and the code?",
        a: "You do. App projects are paid upfront, so the code, the designs, and the store listings belong to your business. If you ever move on, you keep everything.",
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
        q: "Who owns the code?",
        a: "You do. Projects are paid upfront, so custom software built for your business, including its source code, belongs to your business.",
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
    h1: "SEO services",
    metaTitle: "SEO Services: Technical, Local and On-Page SEO",
    metaDescription:
      "Rank on Google and Bing for the searches that bring customers. Technical SEO, local SEO, structured data, and ongoing content on a flat monthly plan from $300.",
    eyebrow: "SEO",
    lead: [
      "Most small and midsize businesses rank for their own name and nothing else. Search engine optimization closes that gap: it gets the pages that describe what you sell in front of the people searching for it on Google and Bing.",
      "N.O.D.E. starts with the foundation that search engines need to read your site, fixes what keeps pages out of the index, and then builds the pages and content that target the searches your customers actually make. It runs as a monthly service, so it keeps up as results change.",
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
        body: "Consistent name, address, and phone across the web, Google Business Profile where you have a location customers visit, and pages for the areas you serve.",
      },
      {
        title: "Structured data",
        body: "Schema.org markup for your business, services, products, and FAQs, which powers rich results and gives search engines unambiguous facts.",
      },
      {
        title: "Keyword-targeted pages",
        body: "Service and location pages written for the specific phrases your customers search, one clear topic per page so they do not compete with each other.",
      },
      {
        title: "Ongoing SEO",
        body: "Monthly content, new pages, and fixes as results change, with Google Search Console and Bing Webmaster Tools monitored for you and IndexNow so Bing sees updates within minutes.",
      },
    ],
    fit: [
      "Customers cannot find you when they search for what you sell.",
      "You rank for your name but not for the services you offer.",
      "Your site was built without anyone checking how search engines read it.",
    ],
    faqs: [
      {
        q: "What is the difference between SEO, GEO, and AEO?",
        a: "SEO (search engine optimization) improves how your site ranks in search engines like Google and Bing. GEO (generative engine optimization) improves how often AI tools such as ChatGPT, Perplexity, Claude, and Gemini name your business in their answers. AEO (answer engine optimization) structures your content so engines can lift it directly into answers, featured snippets, and voice results. They share a foundation, and N.O.D.E. offers all three; see the GEO and AEO pages for how each works.",
      },
      {
        q: "How long does SEO take to work?",
        a: "Technical fixes and indexing can show results in weeks. Ranking for competitive terms usually takes several months and depends on your market and your competitors. Branded and local searches typically move first.",
      },
      {
        q: "Do you guarantee first-page rankings?",
        a: "No. Nobody controls Google's results, and any agency promising a guaranteed position is guessing. We commit to the work that moves rankings and report what changed.",
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

  "generative-engine-optimization": {
    slug: "generative-engine-optimization",
    serviceType: "Generative engine optimization",
    h1: "Generative engine optimization (GEO) agency",
    metaTitle: "Generative Engine Optimization (GEO) Agency & Services",
    metaDescription:
      "GEO services that get your business named and cited by ChatGPT, Perplexity, Gemini, Claude, and Copilot. AI visibility audits, entity and structured data work, and monthly monitoring from $300.",
    eyebrow: "GENERATIVE ENGINE OPTIMIZATION",
    lead: [
      "Generative engine optimization (GEO) is the practice of making your business the one an AI assistant names when someone asks it for a recommendation. When a buyer asks ChatGPT, Perplexity, Gemini, Claude, or Copilot which company to hire, the assistant writes an answer from sources it can read and trust. GEO makes sure your business is one of those sources.",
      "It is different from ranking a page. An AI answer has room for a few names, not ten blue links, and it is assembled from your own site plus what the rest of the web says about you. N.O.D.E. works on both sides: what AI crawlers can read on your site, and the third-party sources they cite.",
    ],
    model: "plan",
    deliverables: [
      {
        title: "AI visibility audit",
        body: "We ask ChatGPT, Perplexity, Gemini, Claude, and Copilot the questions your buyers ask, and record whether you are named, how you are described, and which sources they cite instead of you.",
      },
      {
        title: "AI crawler access",
        body: "Robots rules that let GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended, and Applebot-Extended in, and pages rendered on the server so crawlers that never run JavaScript still read them.",
      },
      {
        title: "Entity clarity",
        body: "One consistent description of who you are, what you sell, and where, stated the same way on your site, in structured data, and on the profiles AI systems cross-check.",
      },
      {
        title: "llms.txt and structured data",
        body: "A plain-language llms.txt summary for AI systems, plus Organization, Service, and FAQ schema so the facts about your business are machine-readable.",
      },
      {
        title: "Citation-worthy content",
        body: "Pages that answer the specific questions buyers ask assistants, with concrete facts such as pricing, scope, and comparisons that an AI can quote.",
      },
      {
        title: "Third-party mentions and monitoring",
        body: "Directory profiles, reviews, and industry mentions that assistants cite, re-checked monthly against the same questions and against the AI reports in Bing Webmaster Tools and Google Search Console.",
      },
    ],
    fit: [
      "Buyers in your market ask ChatGPT or Perplexity for recommendations, and your competitors get named instead of you.",
      "Your site ranks on Google but AI assistants describe your business wrongly or not at all.",
      "You want to be early in a channel where the answers are still being decided.",
    ],
    faqs: [
      {
        q: "What is generative engine optimization (GEO)?",
        a: "Generative engine optimization is the work of getting a business mentioned, described accurately, and cited in answers generated by AI systems such as ChatGPT, Perplexity, Google Gemini and AI Overviews, Claude, and Microsoft Copilot. It covers what AI crawlers can read on your own site and the third-party sources those systems rely on.",
      },
      {
        q: "How is GEO different from SEO?",
        a: "SEO ranks a page in a list of results. GEO earns a mention inside a single written answer, which usually names only a handful of businesses and draws on several sources at once, including sites you do not control. Good SEO helps GEO, but ranking well is not enough on its own.",
      },
      {
        q: "Can you guarantee ChatGPT will recommend my business?",
        a: "No. AI answers change with the question, the model, and the day, and no agency controls them. We commit to the work that makes your business readable, consistent, and cited, and we measure how often you appear against a fixed set of buyer questions.",
      },
      {
        q: "How do you measure GEO results?",
        a: "We track a fixed set of questions your buyers ask across the major assistants and record whether you are named and cited, month over month. We also use the AI performance reports in Bing Webmaster Tools and Google Search Console where they are available for your site.",
      },
      {
        q: "How long does GEO take?",
        a: "Crawler access, structured data, and llms.txt take effect as soon as the assistants re-read your site, often within weeks. Changing how an assistant describes you depends on third-party sources and usually takes months.",
      },
      {
        q: "How much do GEO services cost?",
        a: "GEO runs on the same subscription plans as the rest of N.O.D.E.: $300 per month on Member, $500 on Growth, and $900 on Pro, plus a one-time setup fee.",
      },
    ],
  },

  "answer-engine-optimization": {
    slug: "answer-engine-optimization",
    serviceType: "Answer engine optimization",
    h1: "Answer engine optimization (AEO)",
    metaTitle: "Answer Engine Optimization (AEO) Services",
    metaDescription:
      "What is AEO? Answer engine optimization structures your content so Google, Bing, AI assistants, and voice assistants can lift your answer directly into their results. AEO services from $300 a month.",
    eyebrow: "ANSWER ENGINE OPTIMIZATION",
    lead: [
      "Answer engine optimization (AEO) means structuring your content so that search engines and assistants can take your answer and show it directly: in a featured snippet, an AI Overview, a ChatGPT or Perplexity answer, or a response read aloud by a voice assistant. The searcher gets the answer without clicking through a list of links, and your business is the one that supplied it.",
      "AEO is about format as much as content. Engines favor a clear question, a direct answer in the first sentence or two, and supporting detail they can parse. N.O.D.E. finds the questions your customers ask and rebuilds the pages that should answer them.",
    ],
    model: "plan",
    deliverables: [
      {
        title: "Question research",
        body: "The questions your customers actually ask, collected from your Search Console queries, the questions search engines surface for your topic, and what buyers ask AI assistants.",
      },
      {
        title: "Answer-first content",
        body: "Each question gets a heading and a direct answer in its opening sentences, followed by the detail, so engines can quote the answer on its own.",
      },
      {
        title: "FAQ and structured data",
        body: "FAQ, service, and organization schema that label your questions and answers explicitly for search engines and AI systems.",
      },
      {
        title: "Extractable formatting",
        body: "Lists, steps, and tables where they fit the question, which engines lift into snippets far more readily than long paragraphs.",
      },
      {
        title: "Page and site structure",
        body: "One clear topic per page and internal links between related answers, so engines understand which page answers which question.",
      },
      {
        title: "Measurement",
        body: "Tracking of which questions you now appear for, in Google Search Console, Bing Webmaster Tools, and across the major AI assistants.",
      },
    ],
    fit: [
      "Your customers ask the same questions over and over, and your site does not answer them clearly.",
      "Competitors show up in featured snippets and AI answers for questions you know better than they do.",
      "You want your expertise to be the answer people hear, not just one of ten links.",
    ],
    faqs: [
      {
        q: "What is AEO?",
        a: "AEO stands for answer engine optimization: structuring content so search engines, AI assistants, and voice assistants can pull a direct answer from your page and show or read it to the person asking. It targets featured snippets, AI Overviews, AI assistant answers, and voice results rather than only a ranked link.",
      },
      {
        q: "What is an answer engine?",
        a: "An answer engine is any system that responds to a question with an answer instead of a list of links: Google's featured snippets and AI Overviews, ChatGPT, Perplexity, Microsoft Copilot, and voice assistants all work this way.",
      },
      {
        q: "What is the difference between AEO, GEO, and SEO?",
        a: "SEO ranks your pages in search results. AEO makes your content easy to lift as a direct answer to a specific question. GEO focuses on how AI systems describe and recommend your business as a whole. AEO sits between the two, and all three share the same technical foundation.",
      },
      {
        q: "Does AEO help with voice search?",
        a: "Yes. Voice assistants read out a single answer, and they take it from content that states the answer clearly and briefly. The same answer-first structure that wins featured snippets is what they use.",
      },
      {
        q: "How much do AEO services cost?",
        a: "AEO runs on the same subscription plans as the rest of N.O.D.E.: $300 per month on Member, $500 on Growth, and $900 on Pro, plus a one-time setup fee.",
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
