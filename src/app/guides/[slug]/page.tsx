import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { Faq, MarketingShell, focusRing } from "@/components/marketing/marketing-shell";
import { ServiceCta } from "@/components/marketing/pricing-strip";
import { GUIDES, guideFor } from "@/lib/guide-content";
import { OG_IMAGE, SITE_URL, pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = guideFor(slug);
  if (!g) return {};
  return pageMetadata({ title: g.metaTitle, description: g.metaDescription, path: `/guides/${g.slug}` });
}

const formatDate = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = guideFor(slug);
  if (!g) notFound();

  const url = `${SITE_URL}/guides/${g.slug}`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: g.title,
        description: g.metaDescription,
        datePublished: g.published,
        dateModified: g.updated,
        inLanguage: "en-US",
        image: `${SITE_URL}${OG_IMAGE}`,
        mainEntityOfPage: url,
        author: { "@id": `${SITE_URL}/#organization` },
        publisher: { "@id": `${SITE_URL}/#organization` },
        isPartOf: { "@id": `${SITE_URL}/#website` },
      },
      ...(g.faqs.length
        ? [
            {
              "@type": "FAQPage",
              "@id": `${url}#faq`,
              mainEntity: g.faqs.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            },
          ]
        : []),
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE_URL}/guides` },
          { "@type": "ListItem", position: 3, name: g.title, item: url },
        ],
      },
    ],
  };

  const body = "font-[family-name:var(--font-atkinson)] text-lg leading-relaxed text-[#F5F6FC]/80";
  const th = "py-3 pr-6 text-left align-top font-[family-name:var(--font-lexend)] font-bold text-sm";
  const td = "py-3 pr-6 align-top font-[family-name:var(--font-atkinson)] text-base text-[#F5F6FC]/80";

  return (
    <MarketingShell>
      <JsonLd data={schema} />

      <article className="max-w-3xl mx-auto px-4 md:px-0 pt-16 md:pt-24">
        <nav aria-label="Breadcrumb" className="font-[family-name:var(--font-atkinson)] text-sm text-[#F5F6FC]/60">
          <Link href="/" className={`hover:text-[#FFC919] ${focusRing}`}>Home</Link>
          <span aria-hidden="true"> / </span>
          <Link href="/guides" className={`hover:text-[#FFC919] ${focusRing}`}>Guides</Link>
        </nav>
        <h1 className="mt-10 font-[family-name:var(--font-lexend)] font-black text-[clamp(2rem,5vw,3.5rem)] leading-[1.08]">
          {g.title}
        </h1>
        <p className="mt-6 font-[family-name:var(--font-atkinson)] text-sm text-[#F5F6FC]/60">
          By NODE by Nouvos · Updated <time dateTime={g.updated}>{formatDate(g.updated)}</time>
        </p>

        <div className="mt-10 border-l-4 border-[#FFC919] bg-[#F5F6FC]/[0.04] p-6">
          <p className="font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.2em] text-[#FFC919]">
            Short answer
          </p>
          <p className={`mt-3 ${body} text-[#F5F6FC]/90`}>{g.answer}</p>
        </div>

        {g.sections.map((s) => (
          <section key={s.heading} className="mt-14">
            <h2 className="font-[family-name:var(--font-lexend)] font-black text-2xl md:text-3xl">{s.heading}</h2>
            {s.paragraphs.map((p) => (
              <p key={p.slice(0, 40)} className={`mt-5 ${body}`}>
                {p}
              </p>
            ))}
            {s.bullets && (
              <ul className={`mt-5 space-y-3 ${body}`}>
                {s.bullets.map((b) => (
                  <li key={b} className="flex gap-4">
                    <span aria-hidden="true" className="text-[#FFC919]">/</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
            {s.table && (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[34rem] border-collapse">
                  <caption className="sr-only">{s.table.caption}</caption>
                  <thead>
                    <tr className="border-b border-[#F5F6FC]/20">
                      {s.table.columns.map((c, i) => (
                        <th key={c || i} scope="col" className={`${th} ${i ? "text-[#FFC919]" : ""}`}>
                          {c || <span className="sr-only">Topic</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {s.table.rows.map((r) => (
                      <tr key={r[0]} className="border-b border-[#F5F6FC]/10">
                        <th scope="row" className={th}>
                          {r[0]}
                        </th>
                        {r.slice(1).map((cell, i) => (
                          <td key={i} className={td}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}

        {g.faqs.length > 0 && (
          <section aria-labelledby="faq" className="mt-16">
            <h2 id="faq" className="font-[family-name:var(--font-lexend)] font-black text-2xl md:text-3xl">
              Questions
            </h2>
            <div className="mt-6">
              <Faq items={g.faqs} />
            </div>
          </section>
        )}

        <section className="mt-16">
          <h2 className="font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.2em] text-[#FFC919]">
            Related
          </h2>
          <ul className="mt-4 space-y-3 font-[family-name:var(--font-lexend)] font-bold text-xl">
            {g.related.map((r) => (
              <li key={r.href}>
                <Link href={r.href} className={`hover:text-[#FFC919] transition-colors duration-200 ${focusRing}`}>
                  {r.label} <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-12">
            <ServiceCta model="plan" />
          </div>
        </section>
      </article>
    </MarketingShell>
  );
}
