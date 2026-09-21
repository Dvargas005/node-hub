import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { MarketingShell, focusRing } from "@/components/marketing/marketing-shell";
import { SERVICES, SITE_URL } from "@/lib/seo";

const TITLE = "Web, App & Software Development and SEO Services";
const DESCRIPTION =
  "N.O.D.E. services: web development, mobile app development, custom software development, and SEO, GEO and AEO, delivered by an in-house team on a monthly subscription.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/services" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/services" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function ServicesIndex() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "N.O.D.E. services",
    itemListElement: SERVICES.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: s.name,
      url: `${SITE_URL}/services/${s.slug}`,
    })),
  };

  return (
    <MarketingShell>
      <JsonLd data={schema} />
      <section className="max-w-7xl mx-auto px-4 md:px-12 pt-16 md:pt-24">
        <p className="font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.3em] text-[#FFC919]">
          SERVICES
        </p>
        <h1 className="mt-4 max-w-4xl font-[family-name:var(--font-lexend)] font-black text-[clamp(2.25rem,6vw,4.5rem)] leading-[1.05]">
          Everything your business needs to grow online, built in-house
        </h1>
        <p className="mt-8 max-w-3xl font-[family-name:var(--font-atkinson)] text-lg leading-relaxed text-[#F5F6FC]/80">
          Four service lines, one team. Web and SEO work runs on a monthly subscription; app and
          custom software projects are scoped and quoted after a discovery call.
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-12 mt-16">
        <div className="grid gap-px bg-[#F5F6FC]/10 sm:grid-cols-2">
          {SERVICES.map((s) => (
            <Link
              key={s.slug}
              href={`/services/${s.slug}`}
              className={`group block bg-[#130A06] p-8 md:p-10 hover:bg-[#1c110c] transition-colors duration-200 ${focusRing}`}
            >
              <h2 className="font-[family-name:var(--font-lexend)] font-black text-2xl md:text-3xl group-hover:text-[#FFC919] transition-colors duration-200">
                {s.name} <span aria-hidden="true">→</span>
              </h2>
              <p className="mt-4 font-[family-name:var(--font-atkinson)] text-base leading-relaxed text-[#F5F6FC]/75">
                {s.summary}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}
