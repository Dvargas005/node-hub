import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell, focusRing } from "@/components/marketing/marketing-shell";
import { ADDRESS, CITIES } from "@/lib/seo";

const TITLE = "Locations: Chicago, Milwaukee, Dallas, Indianapolis";
const DESCRIPTION =
  "N.O.D.E. serves businesses in Chicago, Milwaukee, Dallas, and Indianapolis from its headquarters in Evanston, IL.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/locations" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/locations" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function LocationsIndex() {
  return (
    <MarketingShell>
      <section className="max-w-7xl mx-auto px-4 md:px-12 pt-16 md:pt-24">
        <p className="font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.3em] text-[#FFC919]">
          LOCATIONS
        </p>
        <h1 className="mt-4 max-w-4xl font-[family-name:var(--font-lexend)] font-black text-[clamp(2.25rem,6vw,4.5rem)] leading-[1.05]">
          Where we work
        </h1>
        <p className="mt-8 max-w-3xl font-[family-name:var(--font-atkinson)] text-lg leading-relaxed text-[#F5F6FC]/80">
          Headquartered in {ADDRESS.addressLocality}, {ADDRESS.addressRegion}, serving businesses
          across the Midwest and Texas.
        </p>
      </section>
      <section className="max-w-7xl mx-auto px-4 md:px-12 mt-16">
        <div className="grid gap-px bg-[#F5F6FC]/10 sm:grid-cols-2">
          {CITIES.map((c) => (
            <Link
              key={c.slug}
              href={`/locations/${c.slug}`}
              className={`group block bg-[#130A06] p-8 md:p-10 hover:bg-[#1c110c] transition-colors duration-200 ${focusRing}`}
            >
              <h2 className="font-[family-name:var(--font-lexend)] font-black text-2xl md:text-3xl group-hover:text-[#FFC919] transition-colors duration-200">
                {c.city}, {c.stateCode} <span aria-hidden="true">→</span>
              </h2>
              <p className="mt-3 font-[family-name:var(--font-atkinson)] text-base text-[#F5F6FC]/75">
                {c.state} / {c.timeZone}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}
