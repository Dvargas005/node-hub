"use client";

import { Check } from "lucide-react";

export interface AddOnOption {
  slug: string;
  name: string;
  /** Monthly charge in cents on the plan in question; null = not available (already included). */
  chargeCents: number | null;
}

/**
 * SEO add-on choice: a native radio group (keyboard + screen reader support for free),
 * with a check mark on the selected option so selection is not conveyed by color alone.
 */
export function SeoAddOnPicker({
  options,
  value,
  onChange,
  noneLabel,
  perMonth,
  includedLabel,
  name = "seo-addon",
  disabled = false,
}: {
  options: AddOnOption[];
  value: string | null;
  onChange: (slug: string | null) => void;
  noneLabel: string;
  perMonth: string;
  includedLabel: string;
  name?: string;
  disabled?: boolean;
}) {
  const items: { slug: string | null; name: string; price: string | null; available: boolean }[] = [
    { slug: null, name: noneLabel, price: null, available: true },
    ...options.map((o) => ({
      slug: o.slug,
      name: o.name,
      price: o.chargeCents === null ? includedLabel : `+$${(o.chargeCents / 100).toLocaleString("en-US")}${perMonth}`,
      available: o.chargeCents !== null,
    })),
  ];

  return (
    <div role="radiogroup" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const selected = value === item.slug;
        const id = `${name}-${item.slug ?? "none"}`;
        return (
          <label
            key={id}
            htmlFor={id}
            className={`flex min-h-[44px] items-start gap-3 border p-3 transition-colors duration-200 ${
              !item.available || disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            } ${
              selected
                ? "border-[var(--gold-bar)] bg-[rgba(255,201,25,0.06)]"
                : "border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)] hover:border-[rgba(245,246,252,0.25)]"
            } has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--gold-bar)]`}
          >
            <input
              id={id}
              type="radio"
              name={name}
              className="sr-only"
              checked={selected}
              disabled={!item.available || disabled}
              onChange={() => onChange(item.slug)}
            />
            <span
              aria-hidden
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border ${
                selected ? "border-[var(--gold-bar)] bg-[var(--gold-bar)]" : "border-[rgba(245,246,252,0.3)]"
              }`}
            >
              {selected && <Check className="h-3 w-3 text-[var(--asphalt-black)]" />}
            </span>
            <span className="min-w-0">
              <span className="block font-[var(--font-lexend)] text-sm font-semibold text-[var(--ice-white)]">{item.name}</span>
              {item.price && (
                <span className="block font-[var(--font-atkinson)] text-xs text-[rgba(245,246,252,0.6)]">{item.price}</span>
              )}
            </span>
          </label>
        );
      })}
    </div>
  );
}
