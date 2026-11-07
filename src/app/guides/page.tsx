import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { MarketingShell, focusRing } from "@/components/marketing/marketing-shell";
import { GUIDES } from "@/lib/guide-content";
import { SITE_URL, pageMetadata } from "@/lib/seo";

const TITLE = "Guides: Websites, SEO, and AI Search for Small Businesses";
const DESCRIPTION =
  "Plain-English guides from NODE by Nouvos on website costs, subscriptions vs. agencies, SEO, GEO, and AEO, and getting recommended by ChatGPT and AI assistants.";

export const metadata: Metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: "/guides" });

export default function GuidesIndex() {
  const url = `${SITE_URL}/guides`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${url}#webpage`,
        url,
        name: TITLE,
        description: DESCRIPTION,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: GUIDES.map((g, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE_URL}/guides/${g.slug}`,
            name: g.title,
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Guides", item: url },
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
          <span aria-current="page">Guides</span>
        </nav>
        <p className="mt-10 font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.3em] text-[#FFC919]">
          Guides
        </p>
        <h1 className="mt-4 max-w-4xl font-[family-name:var(--font-lexend)] font-black text-[clamp(2.25rem,6vw,4.5rem)] leading-[1.05]">
          Straight answers for small business websites
        </h1>
        <p className="mt-8 max-w-3xl font-[family-name:var(--font-atkinson)] text-lg leading-relaxed text-[#F5F6FC]/80">
          What things cost, how to choose, and how to get found on Google, Bing, and AI assistants. Each guide
          opens with the short answer.
        </p>
      </section>

      <section aria-label="All guides" className="max-w-7xl mx-auto px-4 md:px-12 mt-16">
        <ul className="grid gap-px bg-[#F5F6FC]/10 md:grid-cols-2">
          {GUIDES.map((g) => (
            <li key={g.slug} className="bg-[#130A06]">
              <Link href={`/guides/${g.slug}`} className={`group block h-full p-8 ${focusRing}`}>
                <h2 className="font-[family-name:var(--font-lexend)] font-bold text-xl md:text-2xl group-hover:text-[#FFC919] transition-colors duration-200">
                  {g.title}
                </h2>
                <p className="mt-4 font-[family-name:var(--font-atkinson)] text-base leading-relaxed text-[#F5F6FC]/75">
                  {g.metaDescription}
                </p>
                <p className="mt-6 font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.2em] text-[#FFC919]">
                  Read the guide <span aria-hidden="true">→</span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </MarketingShell>
  );
}
