import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { WebsiteCheckForm } from "@/components/marketing/website-check-form";
import { SITE_URL } from "@/lib/seo";

const TITLE = "Free Website Check: SEO, AI Search, and Mobile Speed";
const DESCRIPTION =
  "Check any website for free in under a minute: search basics, whether ChatGPT, Perplexity, and Google's AI can read and cite it, and Google's mobile speed score. No signup.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/free-website-check" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/free-website-check" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

/**
 * What the checker grades, in plain words. Rendered as static HTML so crawlers
 * and answer engines can read the page without running the form. Keep in step
 * with gradePage() in src/lib/website-check.ts.
 */
const WHAT_WE_CHECK = [
  {
    heading: "Search basics",
    items: [
      "HTTPS, so browsers do not mark the site Not Secure",
      "Page title and meta description, the text people see in Google results",
      "One clear main heading (H1)",
      "Nothing blocking the page from search results (noindex)",
      "Canonical URL and social sharing preview",
    ],
  },
  {
    heading: "AI answers (GEO and AEO)",
    items: [
      "Structured data (schema.org) that describes your business",
      "Organization or LocalBusiness markup with your name, address, and phone",
      "Question-and-answer content that AI assistants can quote",
      "robots.txt rules for GPTBot, ClaudeBot, PerplexityBot, and Google-Extended",
      "Content readable without JavaScript, since most AI crawlers do not run it",
      "An llms.txt summary and an XML sitemap",
    ],
  },
  {
    heading: "Mobile, speed, and upkeep",
    items: [
      "Mobile viewport, so the page fits a phone",
      "Server response time and HTML size",
      "Google PageSpeed performance score on mobile",
      "Tap-to-call phone link",
      "Image alt text",
      "A copyright year that shows the site is maintained",
    ],
  },
];

const FAQ = [
  {
    q: "Is the website check really free?",
    a: "Yes. There is no signup, no email required, and no limit beyond a few checks every 15 minutes to keep the tool fast for everyone.",
  },
  {
    q: "What is GEO and AEO?",
    a: "Generative engine optimization (GEO) is getting your business named and cited in answers from ChatGPT, Perplexity, Gemini, Claude, and Copilot. Answer engine optimization (AEO) is structuring your content so search engines and voice assistants can quote it as a direct answer. Both depend on structured data, crawlable text, and not blocking AI crawlers, which is what this check looks at.",
  },
  {
    q: "Why does my site score low on AI answers when it ranks on Google?",
    a: "Google renders JavaScript and has years of signals about your site. Most AI crawlers read only the raw HTML, skip anything loaded by scripts, and rely on structured data to identify a business. A site can rank on Google and still be invisible or misdescribed in AI answers.",
  },
  {
    q: "Do you store the website I check?",
    a: "No. The check runs once and the results are shown only to you. We do not save the address or the report.",
  },
  {
    q: "Which page should I check?",
    a: "Start with your homepage. It is the page AI assistants and search engines use most to decide who you are and what you do. You can check any other public page the same way.",
  },
];

export default function FreeWebsiteCheckPage() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${SITE_URL}/free-website-check#app`,
        name: "Free Website Check by NODE",
        url: `${SITE_URL}/free-website-check`,
        description: DESCRIPTION,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Any",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        provider: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/free-website-check#faq`,
        mainEntity: FAQ.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <MarketingShell>
      <JsonLd data={schema} />
      <section className="max-w-7xl mx-auto px-4 md:px-12 pt-16 md:pt-24">
        <p className="font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.3em] text-[#FFC919]">
          FREE WEBSITE CHECK
        </p>
        <h1 className="mt-4 max-w-4xl font-[family-name:var(--font-lexend)] font-black text-[clamp(2.25rem,6vw,4.5rem)] leading-[1.05]">
          Can Google and ChatGPT find your business?
        </h1>
        <p className="mt-8 max-w-3xl font-[family-name:var(--font-atkinson)] text-lg leading-relaxed text-[#F5F6FC]/80">
          Enter your website and get a score in under a minute. The check covers search basics, whether AI
          assistants like ChatGPT, Perplexity, and Google&apos;s AI Overviews can read and cite your site, and
          Google&apos;s mobile speed score. Every item says what is wrong and why it matters.
        </p>
        <div className="mt-12">
          <WebsiteCheckForm />
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-12 mt-24">
        <h2 className="font-[family-name:var(--font-lexend)] font-black text-3xl md:text-4xl">What the check looks at</h2>
        <div className="mt-10 grid gap-px bg-[#F5F6FC]/10 md:grid-cols-3">
          {WHAT_WE_CHECK.map((group) => (
            <div key={group.heading} className="bg-[#130A06] p-8">
              <h3 className="font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.2em] text-[#FFC919]">
                {group.heading}
              </h3>
              <ul className="mt-5 space-y-3 font-[family-name:var(--font-atkinson)] text-base leading-relaxed text-[#F5F6FC]/80">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-12 mt-24">
        <h2 className="font-[family-name:var(--font-lexend)] font-black text-3xl md:text-4xl">Questions</h2>
        <dl className="mt-10 max-w-3xl divide-y divide-[#F5F6FC]/10 border-y border-[#F5F6FC]/10">
          {FAQ.map((f) => (
            <div key={f.q} className="py-6">
              <dt className="font-[family-name:var(--font-lexend)] font-bold text-lg">{f.q}</dt>
              <dd className="mt-2 font-[family-name:var(--font-atkinson)] text-base leading-relaxed text-[#F5F6FC]/75">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </MarketingShell>
  );
}
