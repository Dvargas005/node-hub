import Link from "next/link";
import { focusRing } from "@/components/marketing/marketing-shell";
import { formatUsd, type PublicPlan } from "@/lib/public-plans";

export const DISCOVERY_CALL_URL = "https://calendly.com/erich-nouvos/30min";

/** Plan tiers for work sold through subscription credits. Renders nothing if plans failed to load. */
export function PricingStrip({ plans }: { plans: PublicPlan[] }) {
  if (!plans.length) return null;
  return (
    <div className="grid gap-px bg-[#130A06]/15 md:grid-cols-3">
      {plans.map((p) => (
        <div key={p.slug} className="bg-[#FFC919] p-8 text-[#130A06]">
          <h3 className="font-[family-name:var(--font-lexend)] font-bold text-sm uppercase tracking-[0.2em]">
            {p.name}
          </h3>
          <p className="mt-4 font-[family-name:var(--font-lexend)] font-black text-5xl leading-none">
            {formatUsd(p.priceMonthly)}
            <span className="ml-1 font-[family-name:var(--font-atkinson)] font-normal text-base text-[#130A06]/70">
              /mo
            </span>
          </p>
          <ul className="mt-6 space-y-2 font-[family-name:var(--font-atkinson)] text-sm text-[#130A06]/80">
            <li>{formatUsd(p.setupFee)} one-time setup</li>
            <li>{p.monthlyCredits} credits per month</li>
            <li>{p.deliveryDays}-business-day delivery</li>
          </ul>
        </div>
      ))}
    </div>
  );
}

/** Primary call to action: plan signup for credit work, a discovery call for scoped projects. */
export function ServiceCta({ model }: { model: "plan" | "project" }) {
  const primary =
    model === "plan"
      ? { href: "/register", label: "Start with 10 free credits", external: false }
      : { href: DISCOVERY_CALL_URL, label: "Book a discovery call", external: true };
  const secondary =
    model === "plan"
      ? { href: DISCOVERY_CALL_URL, label: "Talk to us first", external: true }
      : { href: "/register", label: "Create an account", external: false };

  const base = `inline-flex min-h-[44px] items-center px-8 py-4 font-[family-name:var(--font-lexend)] font-bold text-[0.8rem] uppercase tracking-[0.15em] transition-colors duration-200 ${focusRing}`;

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      {[
        { ...primary, cls: `${base} bg-[#FFC919] text-[#130A06] hover:bg-[#F5F6FC]` },
        { ...secondary, cls: `${base} border border-[#F5F6FC]/30 hover:bg-[#F5F6FC] hover:text-[#130A06]` },
      ].map((b) =>
        b.external ? (
          <a key={b.label} href={b.href} target="_blank" rel="noopener noreferrer" className={b.cls}>
            {b.label}
          </a>
        ) : (
          <Link key={b.label} href={b.href} className={b.cls}>
            {b.label}
          </Link>
        ),
      )}
    </div>
  );
}
