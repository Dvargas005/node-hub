import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { Faq, MarketingShell, focusRing } from "@/components/marketing/marketing-shell";
import { PricingStrip, ServiceCta } from "@/components/marketing/pricing-strip";
import { CITY_CONTENT } from "@/lib/city-content";
import { getPublicPlans } from "@/lib/public-plans";
import { CITIES, SERVICES, SITE_URL, type CitySlug } from "@/lib/seo";

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return CITIES.map((c) => ({ city: c.slug }));
}

function lookup(slug: string) {
  const city = CITIES.find((c) => c.slug === slug);
  if (!city) return null;
  return { city, content: CITY_CONTENT[city.slug as CitySlug] };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const found = lookup(city);
  if (!found) return {};
  const { content } = found;
  const path = `/locations/${content.slug}`;
  return {
    title: content.metaTitle,
    description: content.metaDescription,
    alternates: { canonical: path },
    openGraph: { title: content.metaTitle, description: content.metaDescription, url: path },
    twitter: { title: content.metaTitle, description: content.metaDescription },
  };
}

export default async function LocationPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: slug } = await params;
  const found = lookup(slug);
  if (!found) notFound();
  const { city, content } = found;

  const plans = await getPublicPlans();
  const url = `${SITE_URL}/locations/${city.slug}`;
  const place = { "@type": "City", name: `${city.city}, ${city.stateCode}`, sameAs: city.wikidata };

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: content.metaTitle,
        description: content.metaDescription,
        about: { "@id": `${SITE_URL}/#organization` },
      },
      ...SERVICES.map((s) => ({
        "@type": "Service",
        name: `${s.name} in ${city.city}, ${city.stateCode}`,
        description: s.summary,
        url: `${SITE_URL}/services/${s.slug}`,
        provider: { "@id": `${SITE_URL}/#organization` },
        areaServed: place,
      })),
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: content.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Locations", item: `${SITE_URL}/locations` },
          { "@type": "ListItem", position: 3, name: `${city.city}, ${city.stateCode}`, item: url },
        ],
      },
    ],
  };

  return (
    <MarketingShell>
      <JsonLd data={schema} />

      <section className="max-w-7xl mx-auto px-4 md:px-12 pt-16 md:pt-24">
        <nav aria-label="Breadcrumb" className="font-[family-name:var(--font-atkinson)] text-sm text-[#F5F6FC]/60">
          <Link href="/" className={`hover:text-[#FFC919] ${focusRing}`}>Home</Link>
          <span aria-hidden="true"> / </span>
          <Link href="/locations" className={`hover:text-[#FFC919] ${focusRing}`}>Locations</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">
            {city.city}, {city.stateCode}
          </span>
        </nav>
        <p className="mt-10 font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.3em] text-[#FFC919]">
          {city.city.toUpperCase()}, {city.stateCode} / {city.timeZone.toUpperCase()}
        </p>
        <h1 className="mt-4 max-w-4xl font-[family-name:var(--font-lexend)] font-black text-[clamp(2.25rem,6vw,4.5rem)] leading-[1.05]">
          {content.h1}
        </h1>
        <div className="mt-8 max-w-3xl space-y-5 font-[family-name:var(--font-atkinson)] text-lg leading-relaxed text-[#F5F6FC]/80">
          {content.lead.map((p) => (
            <p key={p.slice(0, 40)}>{p}</p>
          ))}
        </div>
        <div className="mt-10">
          <ServiceCta model="plan" />
        </div>
      </section>

      <section aria-labelledby="services" className="max-w-7xl mx-auto px-4 md:px-12 mt-24">
        <h2 id="services" className="font-[family-name:var(--font-lexend)] font-black text-3xl md:text-4xl">
          Services for {city.city} businesses
        </h2>
        <div className="mt-10 grid gap-px bg-[#F5F6FC]/10 sm:grid-cols-2">
          {SERVICES.map((s) => (
            <Link
              key={s.slug}
              href={`/services/${s.slug}`}
              className={`group block bg-[#130A06] p-8 hover:bg-[#1c110c] transition-colors duration-200 ${focusRing}`}
            >
              <h3 className="font-[family-name:var(--font-lexend)] font-bold text-xl group-hover:text-[#FFC919] transition-colors duration-200">
                {s.name} <span aria-hidden="true">→</span>
              </h3>
              <p className="mt-3 font-[family-name:var(--font-atkinson)] text-base leading-relaxed text-[#F5F6FC]/75">
                {s.summary}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {plans.length > 0 && (
        <section aria-labelledby="plans" className="max-w-7xl mx-auto px-4 md:px-12 mt-24">
          <h2 id="plans" className="font-[family-name:var(--font-lexend)] font-black text-3xl md:text-4xl">
            Plans
          </h2>
          <p className="mt-4 max-w-3xl font-[family-name:var(--font-atkinson)] text-lg text-[#F5F6FC]/75">
            Web, design, SEO, and marketing work runs on a monthly credit allowance. App and custom
            software projects are scoped and quoted separately.
          </p>
          <div className="mt-10">
            <PricingStrip plans={plans} />
          </div>
        </section>
      )}

      <section aria-labelledby="faq" className="max-w-7xl mx-auto px-4 md:px-12 mt-24">
        <h2 id="faq" className="font-[family-name:var(--font-lexend)] font-black text-3xl md:text-4xl">
          Frequently asked questions
        </h2>
        <div className="mt-10">
          <Faq items={content.faqs} />
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-12 mt-24">
        <h2 className="font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.2em] text-[#FFC919]">
          Other locations
        </h2>
        <ul className="mt-4 flex flex-wrap gap-x-10 gap-y-3 font-[family-name:var(--font-lexend)] font-bold text-xl">
          {CITIES.filter((c) => c.slug !== city.slug).map((c) => (
            <li key={c.slug}>
              <Link href={`/locations/${c.slug}`} className={`hover:text-[#FFC919] transition-colors duration-200 ${focusRing}`}>
                {c.city}, {c.stateCode} <span aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </MarketingShell>
  );
}
