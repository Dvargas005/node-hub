/**
 * Guides: answer-first articles for the questions buyers type into Google and
 * ask ChatGPT, Perplexity, Gemini, Claude, and Copilot. Each opens with a
 * short direct answer (what answer engines lift), then the detail.
 *
 * Rules (same as the rest of the site, see CLAUDE.md):
 * - No market statistics or competitor prices: we cannot source them and they
 *   go stale. Our own numbers are fine and must match the plans and CLAUDE.md.
 * - Never "unlimited revisions", "no contract", "delivered in X days",
 *   "24/7" (Dedicated Pro only), or SEO "included" in Member/Growth/Pro.
 * - Bump `updated` whenever the copy changes; the sitemap and Article schema read it.
 */

export interface GuideSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  table?: { caption: string; columns: string[]; rows: string[][] };
}

export interface Guide {
  slug: string;
  /** H1 and the Article headline. Phrased as the question people ask. */
  title: string;
  metaTitle: string;
  /** 160 characters or less. */
  metaDescription: string;
  published: string;
  updated: string;
  /** Two to four sentences that fully answer the title on their own. */
  answer: string;
  sections: GuideSection[];
  faqs: { q: string; a: string }[];
  /** Internal links shown at the end: services, pages, other guides. */
  related: { href: string; label: string }[];
}

export const GUIDES: Guide[] = [
  {
    slug: "small-business-website-cost",
    title: "How much does a small business website cost?",
    metaTitle: "How Much Does a Small Business Website Cost?",
    metaDescription:
      "What a small business website costs, what drives the price, and the ongoing costs people forget: hosting, edits, security, and search. Plus how we price ours.",
    published: "2026-11-06",
    updated: "2026-11-06",
    answer:
      "It depends less on the number of pages than on who maintains the site after launch. There are three ways to pay: build it yourself on a website builder, pay an agency or freelancer for a one-time project, or pay a monthly subscription that covers the build and the ongoing work. At NODE by Nouvos, plans start at $300 a month on a 12-month commitment, plus a one-time setup fee.",
    sections: [
      {
        heading: "What drives the price",
        paragraphs: [
          "Two sites with the same number of pages can differ a lot in price. The work that costs money is usually somewhere other than the page count.",
        ],
        bullets: [
          "Custom design versus a template. A template is faster; a custom design takes more rounds.",
          "Content. Writing, photos, and video are often the slowest part, and someone has to produce them.",
          "Features. Online booking, a store, quote forms, member logins, or integrations with other software each add build and test time.",
          "Migration. Moving an existing site means carrying over content and redirecting every old URL so you do not lose search traffic.",
          "Accessibility and speed. Building to WCAG and keeping pages fast on phones is work that has to be done on purpose.",
        ],
      },
      {
        heading: "The costs people forget",
        paragraphs: [
          "Launch is not the end of the bill. Every website has running costs, whoever builds it:",
        ],
        bullets: [
          "Domain name renewal, every year.",
          "Hosting, every month or year.",
          "Edits: new services, prices, photos, staff, and seasonal pages.",
          "Security and software updates, especially on WordPress and its plugins.",
          "Search work: technical SEO, local pages, and now showing up in AI answers.",
        ],
      },
      {
        heading: "Three ways to pay, compared",
        paragraphs: [
          "Each model fits a different business. The right question is not which is cheapest on day one, but who will keep the site current a year from now.",
        ],
        table: {
          caption: "Ways to pay for a small business website",
          columns: ["", "Website builder (DIY)", "One-time project", "Monthly subscription"],
          rows: [
            ["Who builds it", "You", "An agency or freelancer", "A team on a plan"],
            ["Upfront cost", "Low", "Highest", "Setup fee"],
            ["Ongoing edits", "You do them", "Paid separately, when needed", "Part of the plan"],
            ["Best for", "Simple sites, time to spare", "A fixed scope you will maintain yourself", "Businesses that change their site often"],
          ],
        },
      },
      {
        heading: "How NODE by Nouvos prices websites",
        paragraphs: [
          "Web, design, and marketing work runs on three monthly plans: Member at $300, Growth at $500, and Pro at $900 a month on a 12-month commitment, billed monthly, plus a one-time setup fee. A Flexible rate costs 25% more and has a 3-month minimum, then runs month to month. Each plan includes a monthly credit allowance you spend on items from a published service catalog, and Member includes hosting for your website and small edits to it.",
          "SEO, GEO, and AEO are add-ons from $1,250 a month, not part of the plans. Mobile apps and custom software are quoted per project after a discovery call. The code, design, and content we create belong to you once delivered and paid.",
        ],
      },
      {
        heading: "How to compare quotes",
        paragraphs: ["Put every quote on the same footing before you compare totals:"],
        bullets: [
          "Ask what happens after launch: who makes edits, how fast, and at what cost.",
          "Ask who owns the code, design, content, and domain.",
          "Ask how many revision rounds are included.",
          "Ask whether hosting, security updates, and backups are included or extra.",
          "Ask what the minimum term is and how you leave.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is a monthly website subscription more expensive than a one-time build?",
        a: "Over several years it can cost more or less, depending on how often your site changes. A one-time build is cheaper if the site rarely changes and you can maintain it yourself. A subscription is usually the better deal when you need regular edits, new pages, and someone responsible for keeping the site working.",
      },
      {
        q: "Do I own my website if I pay monthly?",
        a: "With NODE by Nouvos, yes. Work is paid for in advance, and once it is delivered and paid, the code, design, and content belong to you. Ask any provider this before you sign.",
      },
      {
        q: "Does the website price include SEO?",
        a: "Not on NODE plans. Every site we build has clean, crawlable structure, but ongoing SEO, GEO, and AEO are add-ons from $1,250 a month.",
      },
    ],
    related: [
      { href: "/pricing", label: "Pricing" },
      { href: "/services/web-development", label: "Web development" },
      { href: "/guides/website-subscription-vs-agency", label: "Website subscription vs. agency project" },
      { href: "/free-website-check", label: "Free website check" },
    ],
  },
  {
    slug: "website-subscription-vs-agency",
    title: "Website subscription vs. agency project: which is right for a small business?",
    metaTitle: "Website Subscription vs. Agency Project for Small Business",
    metaDescription:
      "How a monthly website subscription compares to a one-time agency project on cost, speed, edits, ownership, and risk, and how to tell which fits your business.",
    published: "2026-11-06",
    updated: "2026-11-06",
    answer:
      "Choose a one-time agency project when the scope is fixed and you will maintain the site yourself. Choose a subscription when your site changes often and you want one team responsible for it month after month. The real difference is not the price of the first version, it is who does the work after launch.",
    sections: [
      {
        heading: "How each model works",
        paragraphs: [
          "An agency project is scoped up front, quoted, built, and handed over. Changes after handover are new work, quoted again.",
          "A website subscription charges a monthly fee for an ongoing allowance of work. You send requests as the business needs them, and the same team handles each one.",
        ],
      },
      {
        heading: "Side by side",
        paragraphs: [],
        table: {
          caption: "Website subscription compared with a one-time agency project",
          columns: ["", "Agency project", "Website subscription"],
          rows: [
            ["Payment", "Large upfront amount, often in milestones", "Monthly, after a setup fee"],
            ["Changes after launch", "Quoted as new work", "Requests within your monthly allowance"],
            ["Who maintains the site", "You, or a separate contract", "The same team"],
            ["Commitment", "Ends at handover", "A minimum term, then ongoing"],
            ["Risk", "Scope creep and change orders", "Paying for months you use lightly"],
          ],
        },
      },
      {
        heading: "When a subscription fits",
        paragraphs: [],
        bullets: [
          "You update services, prices, photos, or landing pages several times a year.",
          "You run campaigns and need new pages on short notice.",
          "You do not have anyone in-house to edit the site safely.",
          "You would rather have a predictable monthly cost than a large one-time invoice.",
        ],
      },
      {
        heading: "When a one-time project fits",
        paragraphs: [],
        bullets: [
          "The scope is fixed and unlikely to change for a long time.",
          "You or your staff are comfortable making edits yourselves.",
          "You are building custom software or a mobile app with a defined first release.",
        ],
      },
      {
        heading: "How NODE by Nouvos does it",
        paragraphs: [
          "We offer both, on purpose. Websites, design, and marketing run on Member, Growth, and Pro plans from $300 a month on a 12-month commitment, or on a Flexible rate with a 3-month minimum. Each plan has a target turnaround of 5, 3, or 2 business days per request, always subject to scope, and each request includes two revision rounds. Mobile apps and custom software are scoped and quoted as projects, because a fixed scope with a written proposal is the better fit for them.",
        ],
      },
    ],
    faqs: [
      {
        q: "Can I cancel a website subscription?",
        a: "It depends on the provider's minimum term. NODE plans have a 12-month minimum on the 12-month rate and 3 months on the Flexible rate; after that, the plan continues monthly and you can cancel at any time.",
      },
      {
        q: "What happens to my website if I stop the subscription?",
        a: "With NODE, the code, design, and content we created belong to you once paid. If you leave the Member plan, which includes hosting, you would host the site with a provider of your choice.",
      },
    ],
    related: [
      { href: "/pricing", label: "Pricing" },
      { href: "/guides/small-business-website-cost", label: "How much a small business website costs" },
      { href: "/services/web-development", label: "Web development" },
      { href: "/services/software-development", label: "Custom software" },
    ],
  },
  {
    slug: "get-recommended-by-chatgpt",
    title: "How to get your business recommended by ChatGPT and other AI assistants",
    metaTitle: "How to Get Your Business Recommended by ChatGPT and AI",
    metaDescription:
      "A practical checklist to get your business named by ChatGPT, Perplexity, Gemini, Claude, and Copilot: crawler access, Bing, structured data, and reviews.",
    published: "2026-11-06",
    updated: "2026-11-06",
    answer:
      "AI assistants recommend businesses they can find, read, and trust. That means your site must let AI crawlers in, be indexed by both Google and Bing, state plainly who you are and what you do in text and structured data, and be backed by consistent listings and reviews on other sites. No one can guarantee a mention, but each of these steps raises the odds.",
    sections: [
      {
        heading: "1. Let the AI crawlers read your site",
        paragraphs: [
          "Each assistant uses its own crawlers, and many sites block them by accident through robots.txt, a firewall, or a bot-protection setting. Check that your robots.txt does not disallow the crawlers that feed AI answers, such as OAI-SearchBot and ChatGPT-User (OpenAI), PerplexityBot, Claude-User and ClaudeBot (Anthropic), and Google-Extended (Google's AI products). Blocking the training crawlers is a business choice; blocking the search and user-request crawlers keeps you out of answers.",
        ],
      },
      {
        heading: "2. Be indexed by Google and Bing",
        paragraphs: [
          "AI answers lean on search indexes. Google's AI features draw on Google's index, and Microsoft Copilot is built on Bing. Verify your site in Google Search Console and Bing Webmaster Tools, submit a sitemap to both, and fix pages they report as not indexed. Bing is easy to forget and matters more than its search share suggests.",
        ],
      },
      {
        heading: "3. Put the answers in plain text",
        paragraphs: [
          "Assistants quote text they can read without running JavaScript. State what you do, where, for whom, and at what price in the page itself, near the top. Answer the questions customers actually ask in short, direct paragraphs, and keep an FAQ on each service page.",
        ],
      },
      {
        heading: "4. Describe your business with structured data",
        paragraphs: [
          "Schema.org markup tells machines the facts behind the page: your legal and brand names, address, phone, services, areas served, and the profiles that describe you elsewhere (sameAs). Use Organization or LocalBusiness on every page, Service on service pages, and FAQPage where you answer questions.",
        ],
      },
      {
        heading: "5. Be consistent everywhere else",
        paragraphs: [
          "Assistants cross-check. Your name, address, phone, and description should match across your site, LinkedIn, directories such as Clutch or industry listings, and review sites. Reviews and independent mentions are the strongest trust signal you do not control directly, so ask happy clients for them.",
        ],
      },
      {
        heading: "6. Add an llms.txt file",
        paragraphs: [
          "llms.txt is a proposed standard: a plain-text summary of your business and links to your key pages, placed at your domain root. It is cheap to add, but no major assistant has said it relies on it, so treat it as a bonus, not a substitute for steps 1 to 5.",
        ],
      },
      {
        heading: "7. Measure it",
        paragraphs: [
          "Write down ten questions a customer would ask, such as \"best web designer near Evanston\", and ask them in ChatGPT, Perplexity, Gemini, Claude, and Copilot every month. Note whether you are named, which page is cited, and who is named instead. That list tells you what to fix next.",
        ],
      },
    ],
    faqs: [
      {
        q: "Can anyone guarantee that ChatGPT will recommend my business?",
        a: "No. Assistants decide what to say on their own, and their answers vary by question and by user. What you can control is whether they can find, read, and verify your business, which is what the steps above cover.",
      },
      {
        q: "Should I block AI crawlers?",
        a: "Blocking training crawlers such as GPTBot is a reasonable choice for some businesses. Blocking the crawlers used for search and live answers, such as OAI-SearchBot, ChatGPT-User, and PerplexityBot, removes you from those answers. Most small businesses that want customers should allow them.",
      },
      {
        q: "Is GEO different from SEO?",
        a: "It builds on it. SEO gets you ranked in search results; generative engine optimization (GEO) gets you named and cited inside AI-written answers. Most of the groundwork, such as crawlable pages, structured data, and trust signals, serves both.",
      },
    ],
    related: [
      { href: "/free-website-check", label: "Free website check: can AI read your site?" },
      { href: "/services/generative-engine-optimization", label: "Generative engine optimization (GEO)" },
      { href: "/guides/seo-vs-geo-vs-aeo", label: "SEO vs. GEO vs. AEO" },
      { href: "/services/seo", label: "SEO services" },
    ],
  },
  {
    slug: "seo-vs-geo-vs-aeo",
    title: "SEO vs. GEO vs. AEO: what is the difference?",
    metaTitle: "SEO vs. GEO vs. AEO: What Is the Difference?",
    metaDescription:
      "SEO ranks your pages in search results, AEO makes your content the direct answer, and GEO gets you cited by AI assistants. How they differ and overlap.",
    published: "2026-11-06",
    updated: "2026-11-06",
    answer:
      "SEO (search engine optimization) gets your pages ranked in Google and Bing results. AEO (answer engine optimization) shapes your content so search engines and voice assistants lift it as the direct answer. GEO (generative engine optimization) gets your business named and cited inside answers written by AI assistants such as ChatGPT, Perplexity, Gemini, Claude, and Copilot. They share most of their groundwork.",
    sections: [
      {
        heading: "The short version",
        paragraphs: [],
        table: {
          caption: "SEO, AEO, and GEO compared",
          columns: ["", "SEO", "AEO", "GEO"],
          rows: [
            ["Goal", "Rank in search results", "Be the quoted answer", "Be named in AI answers"],
            ["Where it shows", "Google and Bing results", "Featured snippets, AI Overviews, voice answers", "ChatGPT, Perplexity, Gemini, Claude, Copilot"],
            ["Main levers", "Technical health, relevant pages, links", "Question-shaped headings, short direct answers, FAQ markup", "Crawler access, entity facts, consistent mentions and reviews"],
            ["How you measure it", "Rankings, clicks in Search Console", "Snippets and answers won", "Mentions and citations for your target questions"],
          ],
        },
      },
      {
        heading: "Where they overlap",
        paragraphs: [
          "All three depend on the same foundation: pages search engines and AI crawlers can reach and read, clear text that states what you do and where, structured data that describes your business, and signals from other sites that you are real and trusted. Work on that foundation pays off three times.",
        ],
      },
      {
        heading: "Where they differ",
        paragraphs: [
          "SEO still rewards depth and authority on a topic, which takes pages and links. AEO rewards precision: one question, one clear answer, near the top. GEO rewards being an easily verified entity: the same name, facts, and services everywhere an assistant might look, plus independent mentions.",
        ],
      },
      {
        heading: "Which one should a small business start with?",
        paragraphs: [
          "Start with SEO basics, because AI answers lean on search indexes. Add AEO as you write service pages and FAQs, since it costs little extra. Add GEO when your customers are already asking assistants for recommendations in your category, which for professional and local services is increasingly common.",
          "At NODE by Nouvos these are add-ons to any plan: Starter SEO at $1,250 a month, Full SEO at $2,500, and Full SEO, GEO, and AEO at $4,000, each with a 3-month minimum.",
        ],
      },
    ],
    faqs: [
      {
        q: "Does AEO replace SEO?",
        a: "No. Answer engines pick answers mostly from pages that already rank or are well indexed, so AEO works on top of SEO, not instead of it.",
      },
      {
        q: "Is GEO the same as AI SEO or LLM optimization?",
        a: "Yes, those are other names for the same work: making a business easy for AI assistants to find, verify, and cite.",
      },
    ],
    related: [
      { href: "/services/seo", label: "SEO services" },
      { href: "/services/answer-engine-optimization", label: "Answer engine optimization (AEO)" },
      { href: "/services/generative-engine-optimization", label: "Generative engine optimization (GEO)" },
      { href: "/guides/get-recommended-by-chatgpt", label: "How to get recommended by ChatGPT" },
    ],
  },
  {
    slug: "logistics-company-website",
    title: "What should a logistics or 3PL company website include?",
    metaTitle: "What Should a Logistics or 3PL Company Website Include?",
    metaDescription:
      "The pages and features a small logistics, 3PL, or freight company website needs to win shippers: services, capabilities, quote requests, and trust signals.",
    published: "2026-11-06",
    updated: "2026-11-06",
    answer:
      "A logistics website has one job: help a shipper decide quickly whether you can move or store their freight, and make it easy to ask for a quote. That takes clear service pages, a capabilities summary with your coverage and equipment, a short quote form, and proof that you are an established, insured operator.",
    sections: [
      {
        heading: "Pages every logistics site needs",
        paragraphs: [],
        bullets: [
          "Services: one page per service you sell, such as warehousing, fulfillment, drayage, LTL, FTL, or freight brokerage, written in the shipper's terms.",
          "Coverage: the regions, lanes, ports, or facilities you serve, stated plainly.",
          "Capabilities: equipment, facility size, certifications, and systems, the facts a procurement team checks.",
          "Industries: the kinds of freight you handle well.",
          "About: who runs the company, how long it has operated, and where it is based.",
          "Contact and quote: a phone number and email on every page, plus a quote form.",
        ],
      },
      {
        heading: "Make the quote form short",
        paragraphs: [
          "Ask only for what you need to respond: origin, destination, freight type, approximate volume or weight, timing, and contact details. Every extra required field loses some requests. Send each submission to a monitored inbox and confirm receipt to the shipper.",
        ],
      },
      {
        heading: "Show the trust signals buyers look for",
        paragraphs: [],
        bullets: [
          "Your legal company name, address, and phone, consistent everywhere.",
          "Operating authority and registration numbers where they apply to your services.",
          "Insurance coverage, if you are comfortable stating it.",
          "Named clients or case studies, only with their permission.",
          "Reviews on independent sites.",
        ],
      },
      {
        heading: "Get found by shippers and AI assistants",
        paragraphs: [
          "Shippers search by service and place, such as \"3PL warehouse near Milwaukee\", and increasingly ask AI assistants for shortlists. A page per service and per region you truly serve, plain-text facts near the top of each page, and structured data describing your business give both search engines and assistants what they need.",
        ],
      },
      {
        heading: "When you need more than a website",
        paragraphs: [
          "Customer portals for shipment status, inventory views for 3PL clients, and integrations with your TMS or WMS are custom software, not website work. Nouvos builds and runs its own transportation, order, and warehouse management software, so NODE scopes these as projects after a discovery call.",
        ],
      },
    ],
    faqs: [
      {
        q: "Should a 3PL publish its rates on its website?",
        a: "Most do not, because rates depend on volume, freight, and service. A clear quote form and a fast response usually work better than a public rate card.",
      },
      {
        q: "Do logistics companies need SEO?",
        a: "If shippers in your region search for your services, yes. Start with one strong page per service and per region you serve, then build from there.",
      },
    ],
    related: [
      { href: "/industries/logistics", label: "Websites and software for logistics companies" },
      { href: "/work/wecl", label: "Case study: WECL logistics website" },
      { href: "/services/software-development", label: "Custom software development" },
      { href: "/contact", label: "Contact us" },
    ],
  },
];

export function guideFor(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
