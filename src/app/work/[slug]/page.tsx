import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { MarketingShell, focusRing } from "@/components/marketing/marketing-shell";
import { ServiceCta } from "@/components/marketing/pricing-strip";
import { industryFor } from "@/lib/industry-content";
import { SERVICES, SITE_URL } from "@/lib/seo";
import { WORK, workFor } from "@/lib/work-content";

export const dynamicParams = false;

export function generateStaticParams() {
  return WORK.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const w = workFor(slug);
  if (!w) return {};
  const path = `/work/${w.slug}`;
  return {
    title: w.metaTitle,
    description: w.metaDescription,
    alternates: { canonical: path },
    openGraph: { title: w.metaTitle, description: w.metaDescription, url: path },
    twitter: { title: w.metaTitle, description: w.metaDescription },
  };
}

export default async function WorkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const w = workFor(slug);
  if (!w) notFound();

  const url = `${SITE_URL}/work/${w.slug}`;
  const services = SERVICES.filter((s) => (w.services as readonly string[]).includes(s.slug));
  const industry = w.industry ? industryFor(w.industry) : undefined;
  const others = WORK.filter((o) => o.slug !== w.slug);
  // Projects are scoped per engagement; a website alone runs on plan credits.
  const ctaModel = w.services.every((s) => s === "web-development") ? "plan" : "project";

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        "@id": `${url}#work`,
        name: w.h1,
        headline: w.h1,
        description: w.metaDescription,
        url,
        creator: { "@id": `${SITE_URL}/#organization` },
        ...(w.kind === "client" ? { sourceOrganization: { "@type": "Organization", name: w.name, url: w.liveUrl } } : {}),
        keywords: w.stack.join(", "),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Work", item: `${SITE_URL}/work` },
          { "@type": "ListItem", position: 3, name: w.name, item: url },
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
          <Link href="/work" className={`hover:text-[#FFC919] ${focusRing}`}>Work</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{w.name}</span>
        </nav>
        <p className="mt-10 font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.3em] text-[#FFC919]">
          {w.name} · {w.industryLabel}
        </p>
        <h1 className="mt-4 max-w-4xl font-[family-name:var(--font-lexend)] font-black text-[clamp(2.25rem,6vw,4.5rem)] leading-[1.05]">
          {w.h1}
        </h1>
        <p className="mt-8 max-w-3xl font-[family-name:var(--font-atkinson)] text-lg leading-relaxed text-[#F5F6FC]/80">
          {w.summary}
        </p>
        <dl className="mt-10 grid max-w-3xl gap-6 sm:grid-cols-3 font-[family-name:var(--font-atkinson)] text-base">
          <div>
            <dt className="font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.2em] text-[#F5F6FC]/60">
              {w.kind === "product" ? "Type" : "Client"}
            </dt>
            <dd className="mt-2">{w.kind === "product" ? "Nouvos product" : w.name}</dd>
          </div>
          <div>
            <dt className="font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.2em] text-[#F5F6FC]/60">
              Location
            </dt>
            <dd className="mt-2">{w.location}</dd>
          </div>
          <div>
            <dt className="font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.2em] text-[#F5F6FC]/60">
              Live site
            </dt>
            <dd className="mt-2">
              <a
                href={w.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`underline underline-offset-4 hover:text-[#FFC919] ${focusRing}`}
              >
                {w.liveUrl.replace(/^https:\/\/(www\.)?/, "")}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="challenge" className="max-w-7xl mx-auto px-4 md:px-12 mt-24">
        <h2 id="challenge" className="font-[family-name:var(--font-lexend)] font-black text-3xl md:text-4xl">
          The challenge
        </h2>
        <div className="mt-8 max-w-3xl space-y-5 font-[family-name:var(--font-atkinson)] text-lg leading-relaxed text-[#F5F6FC]/80">
          {w.challenge.map((p) => (
            <p key={p.slice(0, 40)}>{p}</p>
          ))}
        </div>
      </section>

      <section aria-labelledby="built" className="max-w-7xl mx-auto px-4 md:px-12 mt-24">
        <h2 id="built" className="font-[family-name:var(--font-lexend)] font-black text-3xl md:text-4xl">
          What we built
        </h2>
        <div className="mt-10 grid gap-px bg-[#F5F6FC]/10 sm:grid-cols-2 lg:grid-cols-3">
          {w.built.map((d, i) => (
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

      {w.results && w.results.length > 0 && (
        <section aria-labelledby="results" className="max-w-7xl mx-auto px-4 md:px-12 mt-24">
          <h2 id="results" className="font-[family-name:var(--font-lexend)] font-black text-3xl md:text-4xl">
            Results
          </h2>
          <dl className="mt-10 grid gap-px bg-[#F5F6FC]/10 sm:grid-cols-3">
            {w.results.map((r) => (
              <div key={r.label} className="flex flex-col-reverse bg-[#130A06] p-8">
                <dt className="mt-2 font-[family-name:var(--font-atkinson)] text-base text-[#F5F6FC]/75">{r.label}</dt>
                <dd className="font-[family-name:var(--font-lexend)] font-black text-4xl text-[#FFC919]">{r.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section aria-labelledby="stack" className="max-w-7xl mx-auto px-4 md:px-12 mt-24">
        <h2 id="stack" className="font-[family-name:var(--font-lexend)] font-black text-3xl md:text-4xl">
          Built with
        </h2>
        <ul className="mt-8 flex flex-wrap gap-3 font-[family-name:var(--font-atkinson)] text-base">
          {w.stack.map((s) => (
            <li key={s} className="border border-[#F5F6FC]/20 px-4 py-2">
              {s}
            </li>
          ))}
        </ul>
        <div className="mt-12">
          <ServiceCta model={ctaModel} />
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-12 mt-24 grid gap-12 md:grid-cols-2">
        <div>
          <h2 className="font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.2em] text-[#FFC919]">
            Related services
          </h2>
          <ul className="mt-4 space-y-3 font-[family-name:var(--font-lexend)] font-bold text-xl">
            {services.map((s) => (
              <li key={s.slug}>
                <Link href={`/services/${s.slug}`} className={`hover:text-[#FFC919] transition-colors duration-200 ${focusRing}`}>
                  {s.name} <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
            {industry && (
              <li>
                <Link href={`/industries/${industry.slug}`} className={`hover:text-[#FFC919] transition-colors duration-200 ${focusRing}`}>
                  {industry.name} companies <span aria-hidden="true">→</span>
                </Link>
              </li>
            )}
          </ul>
        </div>
        <div>
          <h2 className="font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.2em] text-[#FFC919]">
            More work
          </h2>
          <ul className="mt-4 space-y-3 font-[family-name:var(--font-lexend)] font-bold text-xl">
            {others.map((o) => (
              <li key={o.slug}>
                <Link href={`/work/${o.slug}`} className={`hover:text-[#FFC919] transition-colors duration-200 ${focusRing}`}>
                  {o.name} <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </MarketingShell>
  );
}
