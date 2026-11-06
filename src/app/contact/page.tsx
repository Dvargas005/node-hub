import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { MarketingShell, focusRing } from "@/components/marketing/marketing-shell";
import { DISCOVERY_CALL_URL } from "@/components/marketing/pricing-strip";
import { ADDRESS, CONTACT_EMAIL, PHONE, SITE_URL, pageMetadata } from "@/lib/seo";

const TITLE = "Contact Us: Email, Phone, and Discovery Calls";
const DESCRIPTION =
  "Contact NODE by Nouvos: email support@nouvos.one, call +1 224-640-1785, or book a 30-minute discovery call. We confirm receipt on the next business day.";

export const metadata: Metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: "/contact" });

const PHONE_DISPLAY = PHONE.replace(/^\+1-/, "+1 ");
const WHATSAPP_URL = `https://wa.me/${PHONE.replace(/\D/g, "")}`;

/**
 * No contact form on purpose: there is no inbox behind one, and an email link
 * cannot silently fail. Every channel here is one a person already answers.
 */
export default function ContactPage() {
  const url = `${SITE_URL}/contact`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ContactPage",
        "@id": `${url}#webpage`,
        url,
        name: TITLE,
        description: DESCRIPTION,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Contact", item: url },
        ],
      },
    ],
  };

  const card = "bg-[#130A06] p-8 flex flex-col";
  const label = "font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.2em] text-[#FFC919]";
  const value = `mt-4 font-[family-name:var(--font-lexend)] font-bold text-xl md:text-2xl break-words hover:text-[#FFC919] transition-colors duration-200 ${focusRing}`;
  const note = "mt-3 font-[family-name:var(--font-atkinson)] text-base leading-relaxed text-[#F5F6FC]/75";

  return (
    <MarketingShell>
      <JsonLd data={schema} />

      <section className="max-w-7xl mx-auto px-4 md:px-12 pt-16 md:pt-24">
        <nav aria-label="Breadcrumb" className="font-[family-name:var(--font-atkinson)] text-sm text-[#F5F6FC]/60">
          <Link href="/" className={`hover:text-[#FFC919] ${focusRing}`}>Home</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">Contact</span>
        </nav>
        <p className="mt-10 font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.3em] text-[#FFC919]">
          Contact
        </p>
        <h1 className="mt-4 max-w-4xl font-[family-name:var(--font-lexend)] font-black text-[clamp(2.25rem,6vw,4.5rem)] leading-[1.05]">
          Contact NODE by Nouvos
        </h1>
        <p className="mt-8 max-w-3xl font-[family-name:var(--font-atkinson)] text-lg leading-relaxed text-[#F5F6FC]/80">
          Email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className={`underline hover:text-[#FFC919] ${focusRing}`}>
            {CONTACT_EMAIL}
          </a>{" "}
          or call{" "}
          <a href={`tel:${PHONE}`} className={`underline hover:text-[#FFC919] ${focusRing}`}>
            {PHONE_DISPLAY}
          </a>
          . We confirm receipt of every message on the next business day, in English or Spanish. For a new
          website, app, or software project, the fastest start is a 30-minute discovery call.
        </p>
      </section>

      <section aria-label="Ways to reach us" className="max-w-7xl mx-auto px-4 md:px-12 mt-16">
        <div className="grid gap-px bg-[#F5F6FC]/10 sm:grid-cols-2">
          <div className={card}>
            <h2 className={label}>Email</h2>
            <a href={`mailto:${CONTACT_EMAIL}`} className={value}>
              {CONTACT_EMAIL}
            </a>
            <p className={note}>Questions, quotes, billing, and support. Receipt confirmed the next business day.</p>
          </div>
          <div className={card}>
            <h2 className={label}>Phone and WhatsApp</h2>
            <a href={`tel:${PHONE}`} className={value}>
              {PHONE_DISPLAY}
            </a>
            <p className={note}>
              Call, or{" "}
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={`underline hover:text-[#FFC919] ${focusRing}`}>
                message us on WhatsApp
              </a>
              .
            </p>
          </div>
          <div className={card}>
            <h2 className={label}>Discovery call</h2>
            <a href={DISCOVERY_CALL_URL} target="_blank" rel="noopener noreferrer" className={value}>
              Book 30 minutes <span aria-hidden="true">→</span>
            </a>
            <p className={note}>
              Talk through a website, app, or custom software project before you commit. Apps and software are
              quoted per project after this call.
            </p>
          </div>
          <div className={card}>
            <h2 className={label}>Mailing address</h2>
            <address className="mt-4 not-italic font-[family-name:var(--font-lexend)] font-bold text-xl md:text-2xl leading-snug">
              Nouvos Solutions LLC
              <br />
              {ADDRESS.streetAddress}
              <br />
              {ADDRESS.addressLocality}, {ADDRESS.addressRegion} {ADDRESS.postalCode}
            </address>
            <p className={note}>
              Our registered office, for mail. In-person meetings are by appointment in Illinois and Wisconsin;
              everywhere else we work remotely.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-12 mt-24 grid gap-12 md:grid-cols-2">
        <div>
          <h2 className="font-[family-name:var(--font-lexend)] font-black text-3xl md:text-4xl">Already a client?</h2>
          <p className="mt-4 font-[family-name:var(--font-atkinson)] text-lg leading-relaxed text-[#F5F6FC]/80">
            <Link href="/login" className={`underline hover:text-[#FFC919] ${focusRing}`}>
              Log in
            </Link>{" "}
            to submit a request or message the team from your dashboard, so the conversation stays with the
            work.
          </p>
        </div>
        <div>
          <h2 className="font-[family-name:var(--font-lexend)] font-black text-3xl md:text-4xl">Before you write</h2>
          <ul className="mt-4 space-y-3 font-[family-name:var(--font-atkinson)] text-lg leading-relaxed text-[#F5F6FC]/80">
            <li>
              <Link href="/pricing" className={`underline hover:text-[#FFC919] ${focusRing}`}>Pricing</Link>: plans,
              add-ons, and terms.
            </li>
            <li>
              <Link href="/free-website-check" className={`underline hover:text-[#FFC919] ${focusRing}`}>
                Free website check
              </Link>
              : see how your current site does on Google and in AI answers.
            </li>
            <li>
              <Link href="/work" className={`underline hover:text-[#FFC919] ${focusRing}`}>Our work</Link>: what we
              have built.
            </li>
          </ul>
        </div>
      </section>
    </MarketingShell>
  );
}
