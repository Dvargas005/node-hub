import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { MarketingShell, focusRing } from "@/components/marketing/marketing-shell";
import { SITE_URL } from "@/lib/seo";
import { WORK } from "@/lib/work-content";

const TITLE = "Our Work: Websites, Apps, and Software We Have Built";
const DESCRIPTION =
  "Case studies from NODE by Nouvos: websites for a logistics consulting firm, a battery materials startup, and an apparel brand, plus Zanapronto, our own multi-tenant healthcare platform.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/work" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/work" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function WorkIndex() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/work#page`,
    name: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/work`,
    publisher: { "@id": `${SITE_URL}/#organization` },
    hasPart: WORK.map((w) => ({ "@type": "CreativeWork", name: w.h1, url: `${SITE_URL}/work/${w.slug}` })),
  };

  return (
    <MarketingShell>
      <JsonLd data={schema} />
      <section className="max-w-7xl mx-auto px-4 md:px-12 pt-16 md:pt-24">
        <p className="font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.3em] text-[#FFC919]">
          OUR WORK
        </p>
        <h1 className="mt-4 max-w-4xl font-[family-name:var(--font-lexend)] font-black text-[clamp(2.25rem,6vw,4.5rem)] leading-[1.05]">
          What we have built
        </h1>
        <p className="mt-8 max-w-3xl font-[family-name:var(--font-atkinson)] text-lg leading-relaxed text-[#F5F6FC]/80">
          Client websites and our own software, each live today. Every page says what the problem was,
          what we built, and what it runs on.
        </p>
      </section>
      <section className="max-w-7xl mx-auto px-4 md:px-12 mt-16">
        <div className="grid gap-px bg-[#F5F6FC]/10 sm:grid-cols-2">
          {WORK.map((w) => (
            <Link
              key={w.slug}
              href={`/work/${w.slug}`}
              className={`group block bg-[#130A06] p-8 md:p-10 hover:bg-[#1c110c] transition-colors duration-200 ${focusRing}`}
            >
              <p className="font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.2em] text-[#FFC919]">
                {w.industryLabel}
              </p>
              <h2 className="mt-3 font-[family-name:var(--font-lexend)] font-black text-2xl md:text-3xl group-hover:text-[#FFC919] transition-colors duration-200">
                {w.name} <span aria-hidden="true">→</span>
              </h2>
              <p className="mt-3 font-[family-name:var(--font-atkinson)] text-base leading-relaxed text-[#F5F6FC]/75">
                {w.summary}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}
