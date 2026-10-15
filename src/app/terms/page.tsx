import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/marketing-shell";

const TITLE = "Terms of Service";
const DESCRIPTION =
  "Terms of Service for N.O.D.E. by Nouvos Solutions LLC: plans, minimum terms, automatic renewal, cancellation, credits, revisions, and ownership.";
const EFFECTIVE = "October 12, 2026";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/terms" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/terms" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

/**
 * Keep every statement here in sync with the code and docs/pricing-option-c/README.md
 * (section 5). Plan prices are not repeated here on purpose: checkout and the pricing
 * pages are the source for amounts, so a reprice cannot leave this page stale.
 */
const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "Who we are",
    body: [
      "N.O.D.E. is a service of Nouvos Solutions LLC, an Illinois limited liability company at 909 Davis Street, Suite 500, Evanston, IL 60201. In these terms, \"we\" and \"us\" mean Nouvos Solutions LLC, and \"you\" means the business or person that creates an account or buys a plan.",
      "By creating an account, subscribing, or buying credits, you agree to these terms.",
    ],
  },
  {
    title: "Plans and prices",
    body: [
      "Prices are in US dollars and are shown on our pricing pages and at checkout before you pay. Member, Growth, and Pro plans include a monthly credit allowance and a one-time setup fee charged with the first payment. Dedicated plans are billed monthly and include their stated credit allowance.",
      "On demand is a one-time payment for one month of platform access. It does not renew automatically. Credits on On demand are bought separately as needed, at the per-credit price shown before you pay.",
      "Mobile app and custom software projects are not part of the subscription plans. They are scoped and quoted in a separate written proposal, and that proposal governs the project.",
      "SEO, GEO, and AEO are add-ons billed monthly with your plan, unless your Dedicated plan states that they are included.",
      "The Member plan includes hosting for your website and small edits to it. If you buy a website as a one-time project and do not subscribe to a plan, you pay for hosting directly to your hosting provider.",
    ],
  },
  {
    title: "Minimum terms and automatic renewal",
    body: [
      "Member, Growth, and Pro are offered on two terms: the 12-month rate, with a 12-month minimum term, and the Flexible rate, with a 3-month minimum term at a higher monthly price. Both are billed monthly. Dedicated plans and SEO add-ons have a 3-month minimum term, billed monthly. The minimum term and the monthly amount are shown at checkout before you pay.",
      "Your subscription renews automatically every month and is charged to the payment method on file until you cancel. After the minimum term ends, the subscription continues month to month at the same monthly price, and you can cancel at any time.",
      "Upgrading to a higher plan on the same term keeps your original minimum term end date. You can move from the Flexible rate to the 12-month rate at any time: on the same plan, the 12-month rate and a new 12-month minimum term start at your next billing date; on a higher plan, they start when you upgrade. Moving from the 12-month rate to the Flexible rate is not available from the Billing page; contact support.",
    ],
  },
  {
    title: "How to cancel",
    body: [
      "You can cancel online from the Billing page of your account, or by emailing support@nouvos.one. Cancellation takes effect at the end of the current billing period, and you will not be charged again after that.",
      "During a minimum term, the subscription cannot be canceled from the Billing page. To ask for an early exit, contact support@nouvos.one; we review each request individually.",
    ],
  },
  {
    title: "Credits",
    body: [
      "Each request costs the number of credits shown in the service catalog when you submit it. Your plan's credits are renewed at the start of each billing period. Unused credits, including credits bought during the period, do not carry over and are not refundable. When a subscription ends, any remaining credits expire.",
    ],
  },
  {
    title: "Delivery, revisions, and support",
    body: [
      "Each plan states a target delivery window in business days. Delivery windows are targets, not guarantees, and are always subject to scope of work. They apply to complete requests; larger work, such as a full e-commerce site, may be split into several requests and scheduled by scope.",
      "Each request includes two revision rounds. From the third revision round on, each additional round costs 10% of the credits charged for that request.",
      "We confirm receipt of requests and messages on the next business day. Dedicated Pro includes 24/7 service.",
    ],
  },
  {
    title: "Ownership",
    body: [
      "Work is paid for in advance. Once delivered and paid, the code, design, and content we create for you belong to you.",
      "Third-party components, such as open-source software, fonts, stock media, plugins, and hosted services, remain subject to their own licenses and terms.",
      "You confirm that you have the right to use the materials you send us, such as logos, text, and images.",
    ],
  },
  {
    title: "Refunds",
    body: [
      "Setup fees and subscription payments are not refunded automatically. If you believe something went wrong, contact support@nouvos.one and we will review the request.",
    ],
  },
  {
    title: "Price and terms changes",
    body: [
      "Price changes do not apply to an existing subscription unless we notify you by email in advance. We may update these terms by posting a new version on this page with a new effective date; we will email active subscribers about material changes.",
    ],
  },
  {
    title: "Liability",
    body: [
      "To the extent the law allows, our total liability for any claim related to the service is limited to the amounts you paid us in the 3 months before the claim, and we are not liable for indirect or consequential damages, such as lost profits or lost data.",
    ],
  },
  {
    title: "Governing law and contact",
    body: [
      "These terms are governed by the laws of the State of Illinois.",
      "Questions about these terms: support@nouvos.one or +1 224-640-1785. Nouvos Solutions LLC, 909 Davis Street, Suite 500, Evanston, IL 60201.",
    ],
  },
];

export default function TermsPage() {
  return (
    <MarketingShell>
      <section className="max-w-7xl mx-auto px-4 md:px-12 pt-16 md:pt-24 pb-24">
        <p className="font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.3em] text-[#FFC919]">
          LEGAL
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-lexend)] font-black text-[clamp(2.25rem,6vw,4rem)] leading-[1.05]">
          Terms of Service
        </h1>
        <p className="mt-6 font-[family-name:var(--font-atkinson)] text-base text-[#F5F6FC]/70">
          Effective {EFFECTIVE}
        </p>

        <div className="mt-12 max-w-prose">
          {SECTIONS.map((s, i) => (
            <section key={s.title} className="mt-12 first:mt-0">
              <h2 className="font-[family-name:var(--font-lexend)] font-black text-xl md:text-2xl">
                {i + 1}. {s.title}
              </h2>
              {s.body.map((p) => (
                <p
                  key={p.slice(0, 40)}
                  className="mt-4 font-[family-name:var(--font-atkinson)] text-base md:text-lg leading-relaxed text-[#F5F6FC]/85"
                >
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}
