"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { CheckGroup, CheckReport, CheckStatus } from "@/lib/website-check";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FFC919]";

const GROUP_LABEL: Record<CheckGroup, string> = {
  search: "Search basics",
  ai: "AI answers (GEO and AEO)",
  speed: "Mobile, speed, and upkeep",
};

// Status is carried by the icon shape and the word, not only the color.
const STATUS: Record<CheckStatus, { word: string; icon: string; className: string }> = {
  pass: { word: "Good", icon: "✓", className: "text-[#7EE2A8] border-[#7EE2A8]/40" },
  warn: { word: "Improve", icon: "!", className: "text-[#FFC919] border-[#FFC919]/40" },
  fail: { word: "Fix", icon: "✕", className: "text-[#FF8A7A] border-[#FF8A7A]/40" },
};

function scoreWord(score: number): string {
  if (score >= 85) return "Strong";
  if (score >= 65) return "Decent, with gaps";
  if (score >= 45) return "Needs work";
  return "Losing visitors";
}

export function WebsiteCheckForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<CheckReport | null>(null);
  const resultsRef = useRef<HTMLHeadingElement>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) {
      setError("Enter a website address.");
      return;
    }
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const res = await fetch("/api/website-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json()) as CheckReport | { error: string };
      if (!res.ok || "error" in data) {
        setError("error" in data ? data.error : "Something went wrong. Try again.");
      } else {
        setReport(data);
        requestAnimationFrame(() => resultsRef.current?.focus());
      }
    } catch {
      setError("We could not reach the checker. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const groups: CheckGroup[] = ["search", "ai", "speed"];

  return (
    <div>
      <form onSubmit={onSubmit} noValidate className="max-w-3xl">
        <label
          htmlFor="website-check-url"
          className="block font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.2em] text-[#F5F6FC]/80"
        >
          Your website address
        </label>
        <div className="mt-3 flex flex-col sm:flex-row gap-3">
          <input
            id="website-check-url"
            name="url"
            type="text"
            inputMode="url"
            autoComplete="url"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="yourbusiness.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "website-check-error" : "website-check-help"}
            className={`flex-1 min-h-[52px] bg-[#0a0504] border border-[#F5F6FC]/25 px-4 font-[family-name:var(--font-atkinson)] text-lg text-[#F5F6FC] placeholder:text-[#F5F6FC]/40 focus:border-[#FFC919] ${focusRing}`}
          />
          <button
            type="submit"
            disabled={loading}
            className={`min-h-[52px] px-6 font-[family-name:var(--font-lexend)] font-bold text-[0.8125rem] uppercase tracking-[0.15em] bg-[#FFC919] text-[#130A06] hover:bg-[#F5F6FC] disabled:opacity-60 disabled:cursor-wait transition-colors duration-200 ${focusRing}`}
          >
            {loading ? "Checking…" : "Check my site"}
          </button>
        </div>
        {error ? (
          <p id="website-check-error" role="alert" className="mt-3 font-[family-name:var(--font-atkinson)] text-base text-[#FF8A7A]">
            {error}
          </p>
        ) : (
          <p id="website-check-help" className="mt-3 font-[family-name:var(--font-atkinson)] text-sm text-[#F5F6FC]/60">
            Free, no signup. We read one public page and its robots.txt, sitemap, and llms.txt. Nothing is stored.
          </p>
        )}
      </form>

      <div aria-live="polite" className="mt-12">
        {loading && (
          <div className="max-w-3xl border border-[#F5F6FC]/10 p-6 md:p-8">
            <p className="font-[family-name:var(--font-lexend)] font-bold text-lg">Checking your site…</p>
            <p className="mt-2 font-[family-name:var(--font-atkinson)] text-base text-[#F5F6FC]/70">
              We are loading the page and asking Google for a mobile speed score. This can take up to a minute.
            </p>
            <div className="mt-6 h-1 w-full overflow-hidden bg-[#F5F6FC]/10" aria-hidden="true">
              <div className="h-full w-1/3 bg-[#FFC919] motion-safe:animate-pulse" />
            </div>
          </div>
        )}

        {report && (
          <section aria-labelledby="website-check-results">
            <div className="grid gap-px bg-[#F5F6FC]/10 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
              <div className="bg-[#130A06] p-6 md:p-8">
                <h2
                  id="website-check-results"
                  ref={resultsRef}
                  tabIndex={-1}
                  className="font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.2em] text-[#FFC919] outline-none"
                >
                  Overall score
                </h2>
                <p className="mt-3 font-[family-name:var(--font-lexend)] font-black text-6xl">
                  {report.score}
                  <span className="text-2xl text-[#F5F6FC]/50">/100</span>
                </p>
                <p className="mt-2 font-[family-name:var(--font-atkinson)] text-base text-[#F5F6FC]/80">{scoreWord(report.score)}</p>
                <p className="mt-4 break-all font-[family-name:var(--font-atkinson)] text-sm text-[#F5F6FC]/60">{report.finalUrl}</p>
              </div>
              {groups.map((g) => (
                <div key={g} className="bg-[#130A06] p-6 md:p-8">
                  <p className="font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.2em] text-[#F5F6FC]/70">
                    {GROUP_LABEL[g]}
                  </p>
                  <p className="mt-3 font-[family-name:var(--font-lexend)] font-black text-4xl">{report.groups[g]}</p>
                </div>
              ))}
            </div>

            {groups.map((g) => (
              <div key={g} className="mt-12">
                <h3 className="font-[family-name:var(--font-lexend)] font-black text-2xl md:text-3xl">{GROUP_LABEL[g]}</h3>
                <ul className="mt-6 divide-y divide-[#F5F6FC]/10 border-y border-[#F5F6FC]/10">
                  {report.items
                    .filter((i) => i.group === g)
                    .map((item) => {
                      const s = STATUS[item.status];
                      return (
                        <li key={item.id} className="flex gap-4 py-5">
                          <span
                            className={`shrink-0 inline-flex items-center gap-2 self-start border px-2.5 py-1 font-[family-name:var(--font-lexend)] font-bold text-[0.6875rem] uppercase tracking-[0.15em] ${s.className}`}
                          >
                            <span aria-hidden="true">{s.icon}</span>
                            {s.word}
                          </span>
                          <div>
                            <p className="font-[family-name:var(--font-lexend)] font-bold text-lg">{item.label}</p>
                            <p className="mt-1 font-[family-name:var(--font-atkinson)] text-base leading-relaxed text-[#F5F6FC]/75">
                              {item.detail}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                </ul>
              </div>
            ))}

            <div className="mt-16 border border-[#FFC919]/40 p-6 md:p-10">
              <h3 className="font-[family-name:var(--font-lexend)] font-black text-2xl md:text-3xl">Want these fixed?</h3>
              <p className="mt-3 max-w-2xl font-[family-name:var(--font-atkinson)] text-lg leading-relaxed text-[#F5F6FC]/80">
                Our team fixes the basics, the structured data, and the AI readiness items on this list. Tell us
                what you need and we will tell you what it takes.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/register"
                  className={`min-h-[48px] inline-flex items-center justify-center px-6 font-[family-name:var(--font-lexend)] font-bold text-[0.8125rem] uppercase tracking-[0.15em] bg-[#FFC919] text-[#130A06] hover:bg-[#F5F6FC] transition-colors duration-200 ${focusRing}`}
                >
                  Get started
                </Link>
                <Link
                  href="/services/generative-engine-optimization"
                  className={`min-h-[48px] inline-flex items-center justify-center px-6 border border-[#F5F6FC]/30 font-[family-name:var(--font-lexend)] font-bold text-[0.8125rem] uppercase tracking-[0.15em] hover:border-[#FFC919] hover:text-[#FFC919] transition-colors duration-200 ${focusRing}`}
                >
                  How GEO works
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
