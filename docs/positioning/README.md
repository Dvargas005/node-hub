# NODE positioning (non-review levers)

Started 2026-10-28. Rule for everything here: low cost to the company first. Code we
already own and free listings beat paid tools, paid placements and new vendors.

Baseline (GSC, 28d to 2026-10-25): 1.14K impressions, avg position 74.7. Home and
service pages rank 6 to 28; the Indianapolis page (786 impr at ~79) drags the average.

---

## Built: 1) Case studies at /work and 2) logistics vertical page

Status 2026-10-28: built on branch `feat/work-and-logistics`, not committed. Erich's answers: named
clients WECL, COnovate, W.A.R.; Zana only as a Nouvos product; no result numbers yet; vertical wording
"small logistics, 3PL, freight, and supply chain firms". Also needed: `src/middleware.ts` public-route regex.

Cost: $0 cash (code only, existing Vercel plan). Reversible: revert the PR.

### Files
| File | Change |
|---|---|
| `src/lib/work-content.ts` | new, typed case study entries (pattern of `service-content.ts`) |
| `src/app/work/page.tsx` | new, index of case studies |
| `src/app/work/[slug]/page.tsx` | new, case study page, `generateStaticParams`, metadata, JSON-LD |
| `src/lib/industry-content.ts` | new, one entry (`logistics`) so more verticals cost one entry later |
| `src/app/industries/[slug]/page.tsx` | new, vertical landing page, links to its case studies |
| `src/app/sitemap.ts` | add /work, /work/*, /industries/* |
| `public/llms.txt` | add the new URLs |
| footer (or nav) | add a "Work" link |

### Case study fields
Problem, what we built, stack, live link, location, related service.
"Results" only if the client sent a number. If not sent, the section is not rendered.
No quotes (that is the review lane). Own products (Zana, WAIPAX) are labeled as
"Nouvos product", never presented as a client engagement.

### Candidates (live check 2026-10-28)
| Project | Type | Live | Fits |
|---|---|---|---|
| WECL (weclogistic.net) | client, logistics consulting | 200 | logistics vertical anchor |
| COnovate (conovateinc.com) | client, Wauwatosa WI, WordPress to Astro rebuild | 200 | Milwaukee local proof |
| W.A.R. (weallrelated.com) | client, apparel brand | 200 | consumer |
| Postres Mary (postresmary.com) | client, bilingual one-pager | 200 | consumer, bilingual |
| Zanapronto (zanapronto.com) | Nouvos product, multi-tenant SaaS + iOS | 200 | app/software proof |
| WAIPAX (www.waipax.com) | Nouvos product, logistics WMS | **404** | hold until the site is live |
| unnamed e-commerce client | client refused naming | n/a | never name; anonymized only if Erich approves |

### Blocked on Erich (do not fill in without it)
- Which clients agreed to a named case study page.
- Any result numbers each client will stand behind (traffic, leads, launch time).
- Logistics vertical wording: "small logistics, 3PL, freight and supply-chain firms" OK?

### Test
`npx tsc --noEmit`, `npm run build` (`npm run lint` is not configured in this repo); open the Vercel preview for /work,
each /work/*, /industries/logistics; validate JSON-LD in Rich Results Test; confirm sitemap.

### Out of scope
Blog, client quotes/testimonials, new design system pieces, i18n of these pages,
edits to existing service or location copy, anything in Stripe or pricing.

---

## Backlog (noted, not started)

Ordered by cost to the company, cheapest first.

| # | Idea | Cash cost | Effort | Notes |
|---|---|---|---|---|
| B1 | Push pages ranking 6 to 28 into top 5: deeper copy, FAQ blocks, internal links from location pages and case studies | $0 | S to M | Biggest click upside; GSC shows which queries |
| B2 | "Built by NODE" footer credit on W.A.R. and COnovate (already on Zana, WECL, Postres Mary, WAIPAX) | $0 | XS | Needs each client's OK |
| B3 | Dogfood GEO/AEO on nodedev.one: FAQ schema on service pages, answer-first sections, keep `llms.txt` current | $0 | S | `llms.txt` and Phase 1 entity fixes already exist |
| B4 | DONE 2026-10-29 (PR, /free-website-check). Free website check on nodedev.one, reusing `site_audit.py` + PageSpeed from Agents outreach | ~$0 (PageSpeed API free tier) | M | A free tool, not a discount; confirm with Erich against the no-freebies policy |
| B5 | Illinois BEP / minority-owned certification listings (SAM already shows Hispanic-owned SDB) | free to low, check each program's fee | S (paperwork) | Directory links + buyer/prime visibility |
| B6 | Chamber memberships: Evanston, Lake County, Kenosha Area Business Alliance | annual dues, check before joining | S | Local links; only join where a buyer pool exists |
| B7 | More industry pages (business services, consumer) once logistics proves out | $0 | S each | One entry in `industry-content.ts` |
| skip | Scheduled blogging | time-heavy | L | Lowest return per hour for now |
