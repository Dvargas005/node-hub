import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { Faq, MarketingShell, focusRing } from "@/components/marketing/marketing-shell";
import { ServiceCta } from "@/components/marketing/pricing-strip";
import { INDUSTRY_CONTENT, industryFor } from "@/lib/industry-content";
import { AREA_SERVED, SITE_URL } from "@/lib/seo";
import { PROCESS_STEPS } from "@/lib/service-content";
import { workInIndustry, type IndustrySlug } from "@/lib/work-content";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(INDUSTRY_CONTENT).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = industryFor(slug);
  if (!c) return {};
  const path = `/industries/${c.slug}`;
  return {
    title: c.metaTitle,
    description: c.metaDescription,
    alternates: { canonical: path },
    openGraph: { title: c.metaTitle, description: c.metaDescription, url: path },
    twitter: { title: c.metaTitle, description: c.metaDescription },
  };
}

export default async function IndustryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = industryFor(slug);
  if (!c) notFound();

  const url = `${SITE_URL}/industries/${c.slug}`;
  const work = workInIndustry(c.slug as IndustrySlug);

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${url}#service`,
        name: c.h1,
        serviceType: "Web and software development",
        description: c.metaDescription,
        url,
        provider: { "@id": `${SITE_URL}/#organization` },
        areaServed: AREA_SERVED,
        audience: { "@type": "BusinessAudience", name: "Logistics, 3PL, freight, and supply chain companies" },
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
          { "@type": "ListItem", position: 2, name: c.name, item: url },
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
          <span aria-current="page">{c.name}</span>
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
          <ServiceCta model="plan" />
        </div>
      </section>

      <section aria-labelledby="needs" className="max-w-7xl mx-auto px-4 md:px-12 mt-24">
        <h2 id="needs" className="font-[family-name:var(--font-lexend)] font-black text-3xl md:text-4xl">
          What we build for logistics firms
        </h2>
        <div className="mt-10 grid gap-px bg-[#F5F6FC]/10 sm:grid-cols-2 lg:grid-cols-3">
          {c.needs.map((d, i) => (
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

      {work.length > 0 && (
        <section aria-labelledby="work" className="max-w-7xl mx-auto px-4 md:px-12 mt-24">
          <h2 id="work" className="font-[family-name:var(--font-lexend)] font-black text-3xl md:text-4xl">
            Logistics work
          </h2>
          <div className="mt-10 grid gap-px bg-[#F5F6FC]/10 sm:grid-cols-2">
            {work.map((w) => (
              <Link
                key={w.slug}
                href={`/work/${w.slug}`}
                className={`group block bg-[#130A06] p-8 md:p-10 hover:bg-[#1c110c] transition-colors duration-200 ${focusRing}`}
              >
                <p className="font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.2em] text-[#FFC919]">
                  {w.industryLabel}
                </p>
                <h3 className="mt-3 font-[family-name:var(--font-lexend)] font-black text-2xl group-hover:text-[#FFC919] transition-colors duration-200">
                  {w.name} <span aria-hidden="true">→</span>
                </h3>
                <p className="mt-3 font-[family-name:var(--font-atkinson)] text-base leading-relaxed text-[#F5F6FC]/75">
                  {w.summary}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

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

      <section aria-labelledby="faq" className="max-w-7xl mx-auto px-4 md:px-12 mt-24">
        <h2 id="faq" className="font-[family-name:var(--font-lexend)] font-black text-3xl md:text-4xl">
          Frequently asked questions
        </h2>
        <div className="mt-10">
          <Faq items={c.faqs} />
        </div>
      </section>
    </MarketingShell>
  );
}
