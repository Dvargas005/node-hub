import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { Faq, MarketingShell, focusRing } from "@/components/marketing/marketing-shell";
import { PricingStrip, ServiceCta } from "@/components/marketing/pricing-strip";
import { getPublicPlans } from "@/lib/public-plans";
import { AREA_SERVED, CITIES, SERVICES, SITE_URL, type ServiceSlug } from "@/lib/seo";
import { PROCESS_STEPS, SERVICE_CONTENT } from "@/lib/service-content";

// Static at build, refreshed hourly so a price rotation reaches these pages
// without a redeploy.
export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

function contentFor(slug: string) {
  return (SERVICE_CONTENT as Record<string, (typeof SERVICE_CONTENT)[ServiceSlug] | undefined>)[slug];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = contentFor(slug);
  if (!c) return {};
  const path = `/services/${c.slug}`;
  return {
    title: c.metaTitle,
    description: c.metaDescription,
    alternates: { canonical: path },
    openGraph: { title: c.metaTitle, description: c.metaDescription, url: path },
    twitter: { title: c.metaTitle, description: c.metaDescription },
  };
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = contentFor(slug);
  if (!c) notFound();

  const plans = c.model === "plan" ? await getPublicPlans() : [];
  const url = `${SITE_URL}/services/${c.slug}`;
  const others = SERVICES.filter((s) => s.slug !== c.slug);

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${url}#service`,
        name: c.h1,
        serviceType: c.serviceType,
        description: c.metaDescription,
        url,
        provider: { "@id": `${SITE_URL}/#organization` },
        areaServed: AREA_SERVED,
        ...(plans.length
          ? {
              offers: plans.map((p) => ({
                "@type": "Offer",
                name: `${p.name} plan`,
                price: p.priceMonthly,
                priceCurrency: "USD",
                priceSpecification: {
                  "@type": "UnitPriceSpecification",
                  price: p.priceMonthly,
                  priceCurrency: "USD",
                  unitCode: "MON",
                },
                url: `${SITE_URL}/register`,
              })),
            }
          : {}),
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: c.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Services", item: `${SITE_URL}/services` },
          { "@type": "ListItem", position: 3, name: c.h1, item: url },
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
          <Link href="/services" className={`hover:text-[#FFC919] ${focusRing}`}>Services</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{c.h1}</span>
        </nav>
        <p className="mt-10 font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.3em] text-[#FFC919]">
          {c.eyebrow}
        </p>
        <h1 className="mt-4 max-w-4xl font-[family-name:var(--font-lexend)] font-black text-[clamp(2.25rem,6vw,4.5rem)] leading-[1.05]">
          {c.h1}
        </h1>
        <div className="mt-8 max-w-3xl space-y-5 font-[family-name:var(--font-atkinson)] text-lg leading-relaxed text-[#F5F6FC]/80">
          {c.lead.map((p) => (
            <p key={p.slice(0, 40)}>{p}</p>
          ))}
        </div>
        <div className="mt-10">
          <ServiceCta model={c.model} />
        </div>
      </section>

      <section aria-labelledby="deliverables" className="max-w-7xl mx-auto px-4 md:px-12 mt-24">
        <h2 id="deliverables" className="font-[family-name:var(--font-lexend)] font-black text-3xl md:text-4xl">
          What you get
        </h2>
        <div className="mt-10 grid gap-px bg-[#F5F6FC]/10 sm:grid-cols-2 lg:grid-cols-3">
          {c.deliverables.map((d, i) => (
            <div key={d.title} className="bg-[#130A06] p-8">
              <p className="font-[family-name:var(--font-lexend)] font-bold text-sm text-[#FFC919]">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-3 font-[family-name:var(--font-lexend)] font-bold text-xl">{d.title}</h3>
              <p className="mt-3 font-[family-name:var(--font-atkinson)] text-base leading-relaxed text-[#F5F6FC]/75">
                {d.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="fit" className="max-w-7xl mx-auto px-4 md:px-12 mt-24 grid gap-12 lg:grid-cols-2">
        <div>
          <h2 id="fit" className="font-[family-name:var(--font-lexend)] font-black text-3xl md:text-4xl">
            A good fit if
          </h2>
          <ul className="mt-8 space-y-4 font-[family-name:var(--font-atkinson)] text-lg leading-relaxed text-[#F5F6FC]/80">
            {c.fit.map((f) => (
              <li key={f} className="flex gap-4">
                <span aria-hidden="true" className="text-[#FFC919]">/</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-[family-name:var(--font-lexend)] font-black text-3xl md:text-4xl">How it works</h2>
          <ol className="mt-8 space-y-6">
            {PROCESS_STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-5">
                <span className="font-[family-name:var(--font-lexend)] font-black text-2xl text-[#FFC919]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-[family-name:var(--font-lexend)] font-bold text-lg">{s.title}</h3>
                  <p className="mt-1 font-[family-name:var(--font-atkinson)] text-base leading-relaxed text-[#F5F6FC]/75">
                    {s.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {c.model === "plan" && plans.length > 0 && (
        <section aria-labelledby="plans" className="max-w-7xl mx-auto px-4 md:px-12 mt-24">
          <h2 id="plans" className="font-[family-name:var(--font-lexend)] font-black text-3xl md:text-4xl">
            Plans
          </h2>
          <p className="mt-4 max-w-3xl font-[family-name:var(--font-atkinson)] text-lg text-[#F5F6FC]/75">
            Every plan includes a monthly credit allowance you spend on items from the service catalog.
            No long contracts.
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
          <Faq items={c.faqs} />
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-12 mt-24 grid gap-12 md:grid-cols-2">
        <div>
          <h2 className="font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.2em] text-[#FFC919]">
            Other services
          </h2>
          <ul className="mt-4 space-y-3 font-[family-name:var(--font-lexend)] font-bold text-xl">
            {others.map((s) => (
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
            Where we work
          </h2>
          <ul className="mt-4 space-y-3 font-[family-name:var(--font-lexend)] font-bold text-xl">
            {CITIES.map((city) => (
              <li key={city.slug}>
                <Link href={`/locations/${city.slug}`} className={`hover:text-[#FFC919] transition-colors duration-200 ${focusRing}`}>
                  {c.serviceType} in {city.city}, {city.stateCode} <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </MarketingShell>
  );
}
