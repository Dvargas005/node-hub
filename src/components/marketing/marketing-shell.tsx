import Link from "next/link";
import { ADDRESS, CITIES, CONTACT_EMAIL, PHONE, SERVICES } from "@/lib/seo";

/**
 * Server-rendered frame for the SEO pages (/services, /locations).
 *
 * Deliberately not the landing page's nav: that one is a client component with
 * framer-motion and a JS language toggle, and these pages have to be complete
 * in raw HTML for crawlers that never run JavaScript. The footer is the
 * internal-linking backbone: every service and city page links to every other.
 */

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FFC919]";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#130A06] text-[#F5F6FC]">
      <header className="border-b border-[#F5F6FC]/10">
        <nav
          aria-label="Main"
          className="max-w-7xl mx-auto px-4 md:px-12 py-5 flex items-center justify-between gap-4"
        >
          <Link
            href="/"
            className={`font-[family-name:var(--font-lexend)] font-black text-xl tracking-tight ${focusRing}`}
          >
            N.O.D.E.
          </Link>
          <div className="flex items-center gap-4 md:gap-8">
            <Link
              href="/services"
              className={`font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.2em] text-[#F5F6FC]/70 hover:text-[#FFC919] transition-colors duration-200 ${focusRing}`}
            >
              Services
            </Link>
            <Link
              href="/#pricing"
              className={`hidden sm:inline font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.2em] text-[#F5F6FC]/70 hover:text-[#FFC919] transition-colors duration-200 ${focusRing}`}
            >
              Plans
            </Link>
            <Link
              href="/login"
              className={`hidden md:inline font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.2em] text-[#F5F6FC]/70 hover:text-[#FFC919] transition-colors duration-200 ${focusRing}`}
            >
              Log in
            </Link>
            <Link
              href="/register"
              className={`font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.15em] bg-[#FFC919] text-[#130A06] px-4 py-3 min-h-[44px] inline-flex items-center hover:bg-[#F5F6FC] transition-colors duration-200 ${focusRing}`}
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      <main>{children}</main>

      <footer className="mt-24 bg-[#0a0504] border-t border-[#F5F6FC]/10">
        <div className="max-w-7xl mx-auto px-4 md:px-12 py-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-[family-name:var(--font-lexend)] font-black text-2xl">N.O.D.E.</p>
            <p className="mt-3 font-[family-name:var(--font-atkinson)] text-sm leading-relaxed text-[#F5F6FC]/70">
              Web, app, and software development plus SEO under one monthly subscription. By
              Nouvos Solutions LLC.
            </p>
          </div>

          <div>
            <h2 className="font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.2em] text-[#FFC919]">
              Services
            </h2>
            <ul className="mt-4 space-y-3 font-[family-name:var(--font-atkinson)] text-sm">
              {SERVICES.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/services/${s.slug}`}
                    className={`text-[#F5F6FC]/70 hover:text-[#FFC919] transition-colors duration-200 ${focusRing}`}
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.2em] text-[#FFC919]">
              Locations
            </h2>
            <ul className="mt-4 space-y-3 font-[family-name:var(--font-atkinson)] text-sm">
              {CITIES.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/locations/${c.slug}`}
                    className={`text-[#F5F6FC]/70 hover:text-[#FFC919] transition-colors duration-200 ${focusRing}`}
                  >
                    {c.city}, {c.stateCode}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.2em] text-[#FFC919]">
              Contact
            </h2>
            {/* Name, address, and phone must match the Google Business Profile exactly. */}
            <address className="mt-4 not-italic font-[family-name:var(--font-atkinson)] text-sm leading-relaxed text-[#F5F6FC]/70">
              Nouvos Solutions LLC
              <br />
              {ADDRESS.streetAddress}
              <br />
              {ADDRESS.addressLocality}, {ADDRESS.addressRegion} {ADDRESS.postalCode}
              <br />
              <a
                href={`tel:${PHONE}`}
                className={`hover:text-[#FFC919] transition-colors duration-200 ${focusRing}`}
              >
                {PHONE.replace(/^\+1-/, "+1 ")}
              </a>
              <br />
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className={`hover:text-[#FFC919] transition-colors duration-200 ${focusRing}`}
              >
                {CONTACT_EMAIL}
              </a>
            </address>
          </div>
        </div>
        <p className="max-w-7xl mx-auto px-4 md:px-12 pb-10 font-[family-name:var(--font-atkinson)] text-xs text-[#F5F6FC]/50">
          © 2026 Nouvos Solutions LLC
        </p>
      </footer>
    </div>
  );
}

/** Native <details> FAQ: no JavaScript, keyboard accessible, and fully in the HTML. */
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-[#F5F6FC]/10 border-y border-[#F5F6FC]/10">
      {items.map((item) => (
        <details key={item.q} className="group py-6">
          <summary
            className={`flex cursor-pointer list-none items-start justify-between gap-6 font-[family-name:var(--font-lexend)] font-bold text-lg md:text-xl ${focusRing}`}
          >
            <h3>{item.q}</h3>
            <span
              aria-hidden="true"
              className="mt-1 shrink-0 text-[#FFC919] transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none"
            >
              +
            </span>
          </summary>
          <p className="mt-4 max-w-3xl font-[family-name:var(--font-atkinson)] text-base leading-relaxed text-[#F5F6FC]/75">
            {item.a}
          </p>
        </details>
      ))}
    </div>
  );
}

export { focusRing };
