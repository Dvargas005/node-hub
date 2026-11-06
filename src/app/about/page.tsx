import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { MarketingShell, focusRing } from "@/components/marketing/marketing-shell";
import { ServiceCta } from "@/components/marketing/pricing-strip";
import {
  ADDRESS,
  CONTACT_EMAIL,
  FOUNDER_ID,
  LEGAL_NAME,
  PHONE,
  SERVICES,
  SITE_URL,
  pageMetadata,
} from "@/lib/seo";

const TITLE = "About Us: Web and Software Studio in Evanston, IL";
const DESCRIPTION =
  "NODE by Nouvos is the web, app, and software studio of Nouvos Solutions LLC, an Illinois company founded in 2024 in Evanston, led by CEO Erich Betancourt.";

export const metadata: Metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: "/about" });

/**
 * The entity page: who runs the business, where it is registered, and how to
 * verify it. Answer engines lean on exactly these facts when they decide
 * whether to name a company. Every line must stay true and checkable; add a
 * claim here only when Erich confirms it (no certifications that are pending,
 * no result numbers a client has not sent).
 */
const FACTS: { term: string; detail: React.ReactNode }[] = [
  { term: "Legal name", detail: LEGAL_NAME },
  { term: "Brand", detail: "NODE by Nouvos (also written N.O.D.E.)" },
  { term: "Founded", detail: "2024, as an Illinois limited liability company" },
  { term: "Leadership", detail: "Erich Betancourt, CEO" },
  {
    term: "Registered office",
    detail: `${ADDRESS.streetAddress}, ${ADDRESS.addressLocality}, ${ADDRESS.addressRegion} ${ADDRESS.postalCode} (mail only)`,
  },
  { term: "Service area", detail: "In person by appointment in Illinois and Wisconsin; remote everywhere else, in the US and abroad" },
  { term: "Languages", detail: "English and Spanish" },
  { term: "Federal registration", detail: "SAM.gov active. UEI D2WRAJAE2AR3, CAGE 262A0" },
  { term: "Primary NAICS", detail: "541511, custom computer programming services" },
  { term: "Phone", detail: PHONE.replace(/^\+1-/, "+1 ") },
  { term: "Email", detail: CONTACT_EMAIL },
];

const PROFILES: { label: string; href: string }[] = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/111339069" },
  { label: "Clutch", href: "https://clutch.co/profile/nouvos-solutions" },
  { label: "GoodFirms", href: "https://www.goodfirms.co/company/nouvos-solutions-llc" },
  { label: "Nouvos Solutions", href: "https://nouvos.one" },
];

export default function AboutPage() {
  const url = `${SITE_URL}/about`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": `${url}#webpage`,
        url,
        name: TITLE,
        description: DESCRIPTION,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#organization` },
        mainEntity: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "Person",
        "@id": FOUNDER_ID,
        name: "Erich Betancourt",
        jobTitle: "CEO",
        worksFor: { "@id": `${SITE_URL}/#organization` },
        url,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "About", item: url },
        ],
      },
    ],
  };

  const h2 = "font-[family-name:var(--font-lexend)] font-black text-3xl md:text-4xl";
  const body = "font-[family-name:var(--font-atkinson)] text-lg leading-relaxed text-[#F5F6FC]/80";
  const link = `underline hover:text-[#FFC919] ${focusRing}`;

  return (
    <MarketingShell>
      <JsonLd data={schema} />

      <section className="max-w-7xl mx-auto px-4 md:px-12 pt-16 md:pt-24">
        <nav aria-label="Breadcrumb" className="font-[family-name:var(--font-atkinson)] text-sm text-[#F5F6FC]/60">
          <Link href="/" className={`hover:text-[#FFC919] ${focusRing}`}>Home</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">About</span>
        </nav>
        <p className="mt-10 font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.3em] text-[#FFC919]">
          About
        </p>
        <h1 className="mt-4 max-w-4xl font-[family-name:var(--font-lexend)] font-black text-[clamp(2.25rem,6vw,4.5rem)] leading-[1.05]">
          About NODE by Nouvos
        </h1>
        <div className={`mt-8 max-w-3xl space-y-5 ${body}`}>
          <p>
            NODE by Nouvos is the web, app, and software development studio of {LEGAL_NAME}, an Illinois
            company founded in 2024 and registered in Evanston, Illinois. We build websites, online stores,
            mobile apps, and custom software for small businesses, and help them get found on Google, Bing, and
            AI assistants.
          </p>
          <p>
            Web, design, and marketing work runs on flat monthly plans, so a small business gets an ongoing
            team instead of a one-time project. Mobile apps and custom software are scoped and quoted per
            project. SEO, GEO, and AEO are add-ons.
          </p>
        </div>
      </section>

      <section aria-labelledby="why" className="max-w-7xl mx-auto px-4 md:px-12 mt-24 grid gap-12 lg:grid-cols-2">
        <div>
          <h2 id="why" className={h2}>
            Why a supply chain software company builds websites
          </h2>
          <div className={`mt-6 space-y-5 ${body}`}>
            <p>
              Nouvos builds and runs its own production software for the supply chain: transportation, order,
              and warehouse management, on multi-tenant systems with real customers and real deadlines. NODE
              applies the same habits to client work: clear process, predictable delivery, and software that is
              built to be operated, not just launched.
            </p>
            <p>
              It also means the team that builds your website has shipped and maintained platforms like{" "}
              <Link href="/work/zanapronto" className={link}>
                Zanapronto
              </Link>
              , our multi-tenant platform for doctors and their patients.
            </p>
          </div>
        </div>
        <div>
          <h2 className={h2}>How we work</h2>
          <ul className={`mt-6 space-y-4 ${body}`}>
            {[
              "An in-house team of designers, developers, and marketers does the work. Requests are not routed to a freelancer marketplace.",
              "Erich Betancourt, the CEO, leads client engagements.",
              "Each plan has a target turnaround in business days, always subject to scope of work.",
              "Each request includes two revision rounds.",
              "Work is paid for in advance, and the code, design, and content we create belong to the client.",
              "We work in English and Spanish.",
            ].map((item) => (
              <li key={item} className="flex gap-4">
                <span aria-hidden="true" className="text-[#FFC919]">/</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="facts" className="max-w-7xl mx-auto px-4 md:px-12 mt-24">
        <h2 id="facts" className={h2}>
          Company facts
        </h2>
        <dl className="mt-10 grid gap-px bg-[#F5F6FC]/10 sm:grid-cols-2">
          {FACTS.map((f) => (
            <div key={f.term} className="bg-[#130A06] p-6">
              <dt className="font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.2em] text-[#FFC919]">
                {f.term}
              </dt>
              <dd className="mt-2 font-[family-name:var(--font-atkinson)] text-lg leading-relaxed text-[#F5F6FC]/85 break-words">
                {f.detail}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 font-[family-name:var(--font-atkinson)] text-base leading-relaxed text-[#F5F6FC]/75">
          Download our{" "}
          <a href="/capability-statement.pdf" target="_blank" rel="noopener noreferrer" className={link}>
            capability statement (PDF)
          </a>
          . Profiles:{" "}
          {PROFILES.map((p, i) => (
            <span key={p.href}>
              {i > 0 && ", "}
              <a href={p.href} target="_blank" rel="noopener noreferrer" className={link}>
                {p.label}
              </a>
            </span>
          ))}
          .
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-12 mt-24 grid gap-12 md:grid-cols-2">
        <div>
          <h2 className="font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.2em] text-[#FFC919]">
            What we do
          </h2>
          <ul className="mt-4 space-y-3 font-[family-name:var(--font-lexend)] font-bold text-xl">
            {SERVICES.map((s) => (
              <li key={s.slug}>
                <Link href={`/services/${s.slug}`} className={`hover:text-[#FFC919] transition-colors duration-200 ${focusRing}`}>
                  {s.name} <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.2em] text-[#FFC919]">
            Next steps
          </h2>
          <ul className="mt-4 space-y-3 font-[family-name:var(--font-lexend)] font-bold text-xl">
            {[
              { href: "/work", label: "See our work" },
              { href: "/pricing", label: "Pricing" },
              { href: "/contact", label: "Contact us" },
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={`hover:text-[#FFC919] transition-colors duration-200 ${focusRing}`}>
                  {l.label} <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <ServiceCta model="plan" />
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
