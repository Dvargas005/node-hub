import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { Faq, MarketingShell, focusRing } from "@/components/marketing/marketing-shell";
import { DISCOVERY_CALL_URL, PricingStrip, ServiceCta } from "@/components/marketing/pricing-strip";
import { ON_DEMAND_CENTS_PER_CREDIT, PLAN_CENTS_PER_CREDIT } from "@/lib/credit-pricing";
import {
  formatUsd,
  getOnDemandPrice,
  getPublicAddOns,
  getPublicPlans,
  type PublicAddOn,
  type PublicPlan,
} from "@/lib/public-plans";
import { CONTACT_EMAIL, SITE_URL, pageMetadata } from "@/lib/seo";

const TITLE = "Pricing: Web Development Plans from $300 a Month";
const DESCRIPTION =
  "NODE by Nouvos pricing: Member, Growth, and Pro plans from $300 a month, SEO, GEO, and AEO add-ons from $1,250, and apps and custom software quoted per project.";

export const metadata: Metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: "/pricing" });

// Same cadence as the service pages: prices come from the plans table that
// checkout reads, so a reprice reaches this page within the hour.
export const revalidate = 3600;

/**
 * Active request limits are not in PublicPlan (Pro is unlimited, which the
 * table does not express). Verified in prod 2026-10-03; see CLAUDE.md.
 */
const ACTIVE_REQUESTS: Record<string, string> = { member: "2", growth: "5", pro: "Unlimited" };

const usdCents = (cents: number) => `$${(cents / 100).toFixed(2)}`;

/** One answer-first sentence with the real numbers, for people and answer engines alike. */
function summary(plans: PublicPlan[], addOns: PublicAddOn[]): string {
  const parts: string[] = [];
  if (plans.length) {
    const twelve = plans.map((p) => `${p.name} ${formatUsd(p.priceMonthly)}`).join(", ");
    const flex = plans.every((p) => p.flex)
      ? ` or ${plans.map((p) => formatUsd(p.flex!.priceMonthly)).join(", ")} on the Flexible rate (3-month minimum, then month to month)`
      : "";
    parts.push(
      `Web, design, and marketing work runs on three monthly plans: ${twelve} a month on a 12-month commitment, billed monthly,${flex}.`,
    );
  } else {
    parts.push("Web, design, and marketing work runs on three monthly plans: Member, Growth, and Pro.");
  }
  if (addOns.length) {
    parts.push(`SEO, GEO, and AEO are add-ons from ${formatUsd(addOns[0].priceMonthly)} a month, not part of the plans.`);
  } else {
    parts.push("SEO, GEO, and AEO are add-ons, not part of the plans.");
  }
  parts.push("Mobile apps and custom software are quoted per project after a discovery call.");
  return parts.join(" ");
}

function faqs(plans: PublicPlan[], addOns: PublicAddOn[], onDemand: number | null) {
  const items: { q: string; a: string }[] = [];
  if (plans.length) {
    items.push({
      q: "How much does NODE by Nouvos cost?",
      a: `${plans
        .map(
          (p) =>
            `${p.name} is ${formatUsd(p.priceMonthly)} a month with a ${formatUsd(p.setupFee)} one-time setup fee and ${p.monthlyCredits} credits a month`,
        )
        .join("; ")}. Those are the 12-month rates. Apps and custom software are quoted per project.`,
    });
  }
  items.push(
    {
      q: "Is there a contract or minimum term?",
      a: "Yes. Member, Growth, and Pro on the 12-month rate have a 12-month minimum term, billed monthly. The Flexible rate costs 25% more and has a 3-month minimum, then runs month to month. After the minimum term, any plan continues monthly and you can cancel at any time. To ask for an early exit during a minimum term, contact support; each request is reviewed individually.",
    },
    {
      q: "What is a credit?",
      a: `Each plan includes a monthly credit allowance. Every request costs the number of credits shown in the service catalog when you submit it. Subscribers can buy extra credits at ${usdCents(PLAN_CENTS_PER_CREDIT)} each. Unused credits do not carry over to the next billing period.`,
    },
    {
      q: "How fast is delivery?",
      a: plans.length
        ? `Each plan has a target turnaround: ${plans.map((p) => `${p.deliveryDays} business days on ${p.name}`).join(", ")}. Turnaround is a target, not a guarantee, and is always subject to scope of work; larger builds are split into several requests and scheduled by scope.`
        : "Each plan has a target turnaround in business days. Turnaround is a target, not a guarantee, and is always subject to scope of work.",
    },
    {
      q: "Are revisions included?",
      a: "Each request includes two revision rounds. From the third round on, each additional round costs 10% of the credits charged for that request.",
    },
    {
      q: "Is SEO included in the plans?",
      a: addOns.length
        ? `No. SEO, GEO, and AEO are add-ons to an active plan, billed monthly on the same invoice with a ${addOns[0].minTermMonths}-month minimum: ${addOns.map((a) => `${a.name} ${formatUsd(a.priceMonthly)} a month`).join(", ")}. Dedicated Jump includes Starter SEO, and Dedicated Pro includes full SEO, GEO, and AEO.`
        : "No. SEO, GEO, and AEO are add-ons to an active plan, billed monthly on the same invoice. Dedicated Jump includes Starter SEO, and Dedicated Pro includes full SEO, GEO, and AEO.",
    },
    {
      q: "Is hosting included?",
      a: "The Member plan includes hosting for your website and small edits to it. If you buy a website as a one-time project without a plan, you pay for hosting directly to your hosting provider.",
    },
    {
      q: "Who owns the work?",
      a: "You do. Work is paid for in advance, and once it is delivered and paid, the code, design, and content we create for you belong to you. Third-party components keep their own licenses.",
    },
  );
  if (onDemand !== null) {
    items.push({
      q: "Can I buy without a subscription?",
      a: `Yes. On demand is a one-time ${formatUsd(onDemand)} payment for one month of platform access. It does not renew, and you buy credits as you need them at ${usdCents(ON_DEMAND_CENTS_PER_CREDIT)} each.`,
    });
  }
  items.push({
    q: "How are apps and custom software priced?",
    a: "Mobile apps and custom software are not part of the subscription plans. After a discovery call we scope the project and send a written proposal with the quote, and that proposal governs the project.",
  });
  return items;
}

export default async function PricingPage() {
  const [plans, addOns, onDemand] = await Promise.all([getPublicPlans(), getPublicAddOns(), getOnDemandPrice()]);
  const url = `${SITE_URL}/pricing`;
  const faqItems = faqs(plans, addOns, onDemand);

  const monthly = (name: string, price: number, desc: string) => ({
    "@type": "Offer",
    name,
    description: desc,
    price,
    priceCurrency: "USD",
    priceSpecification: { "@type": "UnitPriceSpecification", price, priceCurrency: "USD", unitCode: "MON" },
    url: `${SITE_URL}/register`,
  });

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: TITLE,
        description: DESCRIPTION,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#organization` },
        ...(plans.length || addOns.length
          ? {
              mainEntity: {
                "@type": "OfferCatalog",
                name: "NODE by Nouvos plans and add-ons",
                itemListElement: [
                  ...plans.map((p) =>
                    monthly(`${p.name} plan`, p.priceMonthly, `12-month commitment, billed monthly. ${p.monthlyCredits} credits a month.`),
                  ),
                  ...plans
                    .filter((p) => p.flex)
                    .map((p) =>
                      monthly(`${p.name} plan, Flexible rate`, p.flex!.priceMonthly, `${p.flex!.minTermMonths}-month minimum, then month to month.`),
                    ),
                  ...addOns.map((a) =>
                    monthly(a.name, a.priceMonthly, `Add-on to an active plan. ${a.minTermMonths}-month minimum.`),
                  ),
                ],
              },
            }
          : {}),
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: faqItems.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Pricing", item: url },
        ],
      },
    ],
  };

  const h2 = "font-[family-name:var(--font-lexend)] font-black text-3xl md:text-4xl";
  const body = "font-[family-name:var(--font-atkinson)] text-lg leading-relaxed text-[#F5F6FC]/80";
  const th = "py-4 pr-6 text-left align-top font-[family-name:var(--font-lexend)] font-bold text-sm";
  const td = "py-4 pr-6 align-top font-[family-name:var(--font-atkinson)] text-base text-[#F5F6FC]/80";

  const rows: { label: string; value: (p: PublicPlan) => string }[] = [
    { label: "12-month rate", value: (p) => `${formatUsd(p.priceMonthly)}/mo` },
    { label: "Flexible rate", value: (p) => (p.flex ? `${formatUsd(p.flex.priceMonthly)}/mo` : "Not offered") },
    { label: "One-time setup", value: (p) => formatUsd(p.setupFee) },
    { label: "Credits per month", value: (p) => String(p.monthlyCredits) },
    { label: "Active requests", value: (p) => ACTIVE_REQUESTS[p.slug] ?? "See plan" },
    { label: "Target turnaround", value: (p) => `${p.deliveryDays} business days, subject to scope` },
    { label: "Revisions", value: () => "2 rounds per request" },
  ];

  return (
    <MarketingShell>
      <JsonLd data={schema} />

      <section className="max-w-7xl mx-auto px-4 md:px-12 pt-16 md:pt-24">
        <nav aria-label="Breadcrumb" className="font-[family-name:var(--font-atkinson)] text-sm text-[#F5F6FC]/60">
          <Link href="/" className={`hover:text-[#FFC919] ${focusRing}`}>Home</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">Pricing</span>
        </nav>
        <p className="mt-10 font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.3em] text-[#FFC919]">
          Pricing
        </p>
        <h1 className="mt-4 max-w-4xl font-[family-name:var(--font-lexend)] font-black text-[clamp(2.25rem,6vw,4.5rem)] leading-[1.05]">
          NODE by Nouvos pricing
        </h1>
        <p className={`mt-8 max-w-3xl ${body}`}>{summary(plans, addOns)}</p>
        <div className="mt-10">
          <ServiceCta model="plan" />
        </div>
      </section>

      {plans.length > 0 && (
        <>
          <section aria-labelledby="plans" className="max-w-7xl mx-auto px-4 md:px-12 mt-24">
            <h2 id="plans" className={h2}>
              Plans
            </h2>
            <p className={`mt-4 max-w-3xl ${body}`}>
              Every plan includes a monthly credit allowance you spend on items from the service catalog,
              and a one-time setup fee charged with the first payment.
            </p>
            <div className="mt-10">
              <PricingStrip plans={plans} />
            </div>
          </section>

          <section aria-labelledby="compare" className="max-w-7xl mx-auto px-4 md:px-12 mt-24">
            <h2 id="compare" className={h2}>
              Compare plans
            </h2>
            <div className="mt-10 overflow-x-auto">
              <table className="w-full min-w-[36rem] border-collapse">
                <caption className="sr-only">Member, Growth, and Pro plans side by side</caption>
                <thead>
                  <tr className="border-b border-[#F5F6FC]/20">
                    <th scope="col" className={`${th} text-[#F5F6FC]/60`}>
                      <span className="sr-only">Detail</span>
                    </th>
                    {plans.map((p) => (
                      <th key={p.slug} scope="col" className={`${th} text-[#FFC919] uppercase tracking-[0.2em]`}>
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.label} className="border-b border-[#F5F6FC]/10">
                      <th scope="row" className={th}>
                        {r.label}
                      </th>
                      {plans.map((p) => (
                        <td key={p.slug} className={td}>
                          {r.value(p)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-6 max-w-3xl font-[family-name:var(--font-atkinson)] text-sm leading-relaxed text-[#F5F6FC]/60">
              The 12-month rate has a 12-month minimum term. The Flexible rate has a 3-month minimum, then
              runs month to month. Both are billed monthly. Full details are in the{" "}
              <Link href="/terms" className={`underline hover:text-[#FFC919] ${focusRing}`}>
                Terms of Service
              </Link>
              .
            </p>
          </section>
        </>
      )}

      <section aria-labelledby="addons" className="max-w-7xl mx-auto px-4 md:px-12 mt-24">
        <h2 id="addons" className={h2}>
          SEO, GEO, and AEO add-ons
        </h2>
        <p className={`mt-4 max-w-3xl ${body}`}>
          Search work is not part of Member, Growth, or Pro. Add it to an active plan, billed monthly on the
          same invoice{addOns.length ? `, with a ${addOns[0].minTermMonths}-month minimum` : ""}.
        </p>
        {addOns.length > 0 && (
          <ul className="mt-10 grid gap-px bg-[#F5F6FC]/10 md:grid-cols-3">
            {addOns.map((a) => (
              <li key={a.slug} className="bg-[#130A06] p-8">
                <h3 className="font-[family-name:var(--font-lexend)] font-bold text-xl">{a.name}</h3>
                <p className="mt-4 font-[family-name:var(--font-lexend)] font-black text-4xl text-[#FFC919]">
                  {formatUsd(a.priceMonthly)}
                  <span className="ml-1 font-[family-name:var(--font-atkinson)] font-normal text-base text-[#F5F6FC]/70">
                    /mo
                  </span>
                </p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-6 max-w-3xl font-[family-name:var(--font-atkinson)] text-base leading-relaxed text-[#F5F6FC]/75">
          What each covers:{" "}
          <Link href="/services/seo" className={`underline hover:text-[#FFC919] ${focusRing}`}>SEO</Link>,{" "}
          <Link href="/services/generative-engine-optimization" className={`underline hover:text-[#FFC919] ${focusRing}`}>
            generative engine optimization (GEO)
          </Link>
          , and{" "}
          <Link href="/services/answer-engine-optimization" className={`underline hover:text-[#FFC919] ${focusRing}`}>
            answer engine optimization (AEO)
          </Link>
          .
        </p>
      </section>

      <section aria-labelledby="other" className="max-w-7xl mx-auto px-4 md:px-12 mt-24">
        <h2 id="other" className={h2}>
          Other ways to work with us
        </h2>
        <div className="mt-10 grid gap-px bg-[#F5F6FC]/10 md:grid-cols-3">
          <div className="bg-[#130A06] p-8">
            <h3 className="font-[family-name:var(--font-lexend)] font-bold text-xl">Apps and custom software</h3>
            <p className="mt-3 font-[family-name:var(--font-atkinson)] text-base leading-relaxed text-[#F5F6FC]/75">
              Scoped after a discovery call and quoted in a written proposal. See{" "}
              <Link href="/services/app-development" className={`underline hover:text-[#FFC919] ${focusRing}`}>
                app development
              </Link>{" "}
              and{" "}
              <Link href="/services/software-development" className={`underline hover:text-[#FFC919] ${focusRing}`}>
                custom software
              </Link>
              .
            </p>
          </div>
          <div className="bg-[#130A06] p-8">
            <h3 className="font-[family-name:var(--font-lexend)] font-bold text-xl">Dedicated retainers</h3>
            <p className="mt-3 font-[family-name:var(--font-atkinson)] text-base leading-relaxed text-[#F5F6FC]/75">
              Monthly retainers for larger, ongoing work, quoted separately with a 3-month minimum.{" "}
              <a
                href={DISCOVERY_CALL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`underline hover:text-[#FFC919] ${focusRing}`}
              >
                Book a call
              </a>{" "}
              to talk it through.
            </p>
          </div>
          {onDemand !== null && (
            <div className="bg-[#130A06] p-8">
              <h3 className="font-[family-name:var(--font-lexend)] font-bold text-xl">On demand</h3>
              <p className="mt-3 font-[family-name:var(--font-atkinson)] text-base leading-relaxed text-[#F5F6FC]/75">
                {formatUsd(onDemand)} for one month of platform access, no renewal. Credits are bought as
                needed at {usdCents(ON_DEMAND_CENTS_PER_CREDIT)} each.
              </p>
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="faq" className="max-w-7xl mx-auto px-4 md:px-12 mt-24">
        <h2 id="faq" className={h2}>
          Pricing questions
        </h2>
        <div className="mt-10">
          <Faq items={faqItems} />
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-12 mt-24">
        <h2 className={h2}>Ready to start?</h2>
        <p className={`mt-4 max-w-3xl ${body}`}>
          Choose a plan, or talk to us first. Questions about billing go to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className={`underline hover:text-[#FFC919] ${focusRing}`}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
        <div className="mt-10">
          <ServiceCta model="plan" />
        </div>
      </section>
    </MarketingShell>
  );
}
