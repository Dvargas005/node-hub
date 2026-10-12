# Pricing Option C: Flexible term, On demand repricing, Terms page

Handoff for the next session. Decided by Erich on 2026-10-12. Read this whole file before touching
pricing, Stripe, or plan copy. Repo rules in `../../CLAUDE.md` still apply (no em dashes in copy,
no discounts except C-level corporate ones, Stripe Prices are immutable, use scripts with dry run first).

## 1. Decisions (Erich, 2026-10-12)

| Item | Decision |
|---|---|
| Option | **C** (not the +90% month-to-month idea; see section 3 for why) |
| Flexible term | **3-month minimum, then month to month, at +25%** over the 12-month rate |
| Flexible prices | Member **$375**/mo, Growth **$625**/mo, Pro **$1,125**/mo. Setup fees unchanged ($312 / $1,092 / $1,560) |
| 12-month prices | Unchanged: $300 / $500 / $900, 12-month commitment, billed monthly |
| On demand credits | **$2.75 per credit** (Erich, 2026-10-12). Applies to On demand buyers only; subscribers of any plan keep $1 per extra credit. The $5 On demand access fee stays (one month, no renewal) |
| Terms page | Claude writes it as a plain statement; Erich reviews with counsel and adjusts. Ship a version now so any subscription today or tomorrow has published terms |
| Toggle label | "12-month rate" / "Flexible rate". Show Flexible as the higher price. **No "Save X%" badge** (that is discount framing; only C-level corporate discounts are allowed) |
| Wording | Never "No contract". Say "Flexible: 3-month minimum, then month to month" |

## 2. Status

| Step | Status |
|---|---|
| Consistency audit + copy fixes (PR #42) | DONE, live 2026-10-12 |
| GoodFirms SEO add-on sentence | DONE, live 2026-10-12 |
| Terms page `/terms` (current offer only, no Flexible yet) | PR #43 (branch `feat/terms-page`): page, footer links, sitemap, public route, checkout notice links to /terms. LIVE 2026-10-12 (merged; Vercel missed the Git push, deployed with `vercel --prod`; verified /terms 200, footer links, sitemap) |
| Confirm On demand credit price | DONE: $2.75 (Erich, 2026-10-12) |
| Code (branch `feat/flexible-term`): term rules, checkout, upgrade preview, billing toggle, On demand $2.75, homepage toggle, copy, Terms, CLAUDE.md | PR open, waiting on Erich's merge |
| Stripe + DB: `scripts/setup-flexible-plans.ts --apply` (3 Prices, 3 plan rows, Product descriptions) | Dry run OK. Run ONLY after the PR is live (rows are public on /billing) |
| Clutch + GoodFirms descriptions | TODO (after the site is live) |
| Counsel review of Terms | Erich, pending |

## 3. Why C (the audit findings that drove it)

- **Pricing ladder was upside down.** On demand credits cost $1.00 each (`src/app/api/stripe/credit-pack-custom/route.ts:72`,
  `unit_amount: credits * 100`) with no commitment. Member costs $2.14 per credit ($300 / 140) with a 12-month lock,
  Growth $1.43, Pro $1.38, Dedicated $1.00 with a 3-month minimum. A rational small buyer picks On demand and never
  subscribes, and the smallest, least-trusting buyers get the worst rate and the longest lock-in.
- **+90% month to month fails.** Member would be $570 for 140 credits (about $4.07 per credit), 4x On demand on the
  same page, and above Kimp (~$699) and ManyPixels (reported from ~$599). The toggle would read "Save 47%", which is
  discount marketing against the C-level-only discount rule. "No contract" is also inaccurate (terms + auto-renewal).
- **Trust is the real blocker, not the term.** 1 Clutch review, 0 GoodFirms reviews, founded 2024, and until now no
  Terms page. Illinois Automatic Contract Renewal Act (815 ILCS 601, amended by PA 103-0070 and PA 103-0919) requires
  clear auto-renewal disclosures and an online cancellation path for online sign-ups. B2B applicability is unclear:
  counsel question.
- **Option C gives one rule everywhere:** every plan has a 3-month minimum (Flexible, Dedicated, SEO add-ons);
  committing to 12 months gets the lower rate. The 3-month floor plus the setup fee protects against
  "subscribe one month, take the code, leave" (clients own work once paid).

Per-credit after C (assuming $2.50 On demand):

| Option | Monthly | Credits | Per credit | Term |
|---|---|---|---|---|
| On demand | $5 + credits | bought as needed | $2.50 | none |
| Member 12-mo / Flexible | $300 / $375 | 140 | $2.14 / $2.68 | 12 mo / 3 mo |
| Growth 12-mo / Flexible | $500 / $625 | 350 | $1.43 / $1.79 | 12 mo / 3 mo |
| Pro 12-mo / Flexible | $900 / $1,125 | 650 | $1.38 / $1.73 | 12 mo / 3 mo |
| Dedicated | $3k-$19k | 1:1 | $1.00 | 3 mo |

Note: Member Flexible ($2.68) ends up above On demand ($2.50). That is acceptable only because plans add active
requests and delivery speed; if Erich wants every plan cheaper per credit than On demand, On demand must be at
least ~$2.75. **Raise this when confirming the On demand price.**

## 4. Implementation plan (T3, wait for GO on numbers before Stripe)

Order matters: Stripe first (dry run), then DB, then code, then copy, then directories.

1. **Stripe** (new script `scripts/setup-flexible-plans.ts`, pattern of `scripts/reprice-plans.ts`; dry run, then `--apply`):
   - Create 3 recurring monthly Prices ($375 / $625 / $1,125) on the EXISTING Member/Growth/Pro Products.
     Do not run `prisma/setup-stripe.ts --force` (duplicates Products).
   - Reuse the existing setup-fee Prices.
   - Product descriptions: mention both terms.
   - On demand credits: `credit-pack-custom` uses inline `price_data` (`unit_amount: credits * 100`), so the price is
     in code, not Stripe. Change to `credits * 250` (or the confirmed number). Also check fixed `CreditPack` rows
     (`db.creditPack`, `stripePriceId`): those are Stripe Prices and need new Prices if their per-credit rate changes.
     Note: credit packs require an ACTIVE subscription (On demand counts).
2. **DB / plans**: add Plan rows `member-flex`, `growth-flex`, `pro-flex` with `minTermMonths: 3`, same credits,
   active requests, delivery, and setup fee as the base plan. Commitment logic already reads `Plan.minTermMonths`
   (`src/lib/commitment.ts`), so cancel/minimum-term enforcement works unchanged. Seed uses `upsert` with
   `update: {}`: create rows via a script, not by re-seeding.
3. **Switching terms rule** (needs code in upgrade/checkout):
   - Flexible to 12-month: allowed anytime; a new 12-month term starts at the switch.
   - 12-month to Flexible: not allowed during the 12-month term.
   - Upgrade within the same term keeps the original `minTermEndsAt` (existing behavior).
4. **App code**:
   - `src/app/(client)/billing/billing-client.tsx`: term toggle on plan cards.
   - `src/app/api/stripe/checkout/route.ts`: accept the flex plan slugs; `custom_text.submit` shows the right term.
   - `src/app/api/stripe/upgrade-preview/route.ts` and the upgrade path: enforce the switching rule.
   - `src/app/api/wizard/chat/route.ts`: plan facts in the prompt.
   - Admin metrics: confirm flex plans count in MRR.
5. **Site copy** (EN / ES / PT; no em dashes; invoke `ui-ux-pro-max` skill before building the toggle UI):
   - `src/app/page.tsx` pricing section: toggle, note line, plan cards.
   - `src/components/marketing/pricing-strip.tsx`.
   - `src/lib/service-content.ts`: plan cards and FAQ "Is there a minimum commitment?".
   - `src/lib/city-content.ts`: pricing FAQs.
   - `public/llms.txt`: Pricing section.
   - `src/lib/i18n/{en,es,pt}.json`: billing strings, `billing.starter.description` ("buy credits 1:1" must change
     if the credit price changes; grep for `1:1` everywhere, including `/dedicated` which stays 1:1).
   - Homepage "…or pay as you go with 1:1 credits." must change with the new On demand price.
   - `/terms`: add Flexible term and the new credit price.
6. **Docs**: rewrite the `CLAUDE.md` rule "never write mes a mes / month to month" (it becomes: allowed only as
   "Flexible: 3-month minimum, then month to month"). Update memory `node-seo-local-targeting.md`.
7. **Directories** (outward, Erich already approved C; still confirm the exact text before saving):
   - Clutch description: "on a 12-month commitment billed monthly" becomes "on a 12-month commitment billed
     monthly, or a Flexible term (3-month minimum, then month to month) at a higher rate". Min project $1,000+ stays.
   - GoodFirms description: same sentence. Edit page: `myaccount.goodfirms.co/users/update-listing?edit=1&step=1`
     (CKEditor; set via `.ck-editor__editable.ckeditorInstance.setData`, then real-click "Save & Next").
   - Bonfire: no pricing published, no change.
   - Check `nouvos-outreach` templates and the NODE capability statement for "12-month" or pricing mentions.
8. **Verify**: `npx tsc --noEmit`, `npx tsx --test src/lib/commitment.test.ts` (add flex cases), Vercel preview in EN
   and ES, then live check on www.nodedev.one. Tell Erich immediately if any live Stripe subscriber exists.

**Out of scope**: Dedicated plan prices and terms, SEO add-on prices, service catalog credit costs, Early Adopters.

**Reversibility**: copy and code are easy to revert. Stripe Prices can be archived, but once a customer subscribes on
Flexible they are grandfathered: treat Flexible as a one-way door per subscriber.

## 5. Facts the Terms page states (verified in code 2026-10-12)

- Credits reset every billing period; unused credits are lost (`src/app/api/stripe/webhook/route.ts:254`).
  Purchased credit packs are added to the same balance, so they are also lost at renewal (the reset overwrites
  `creditsRemaining`). Erich: confirm that is intended; if not, it is a code change.
- Canceling sets credits to 0 at period end (`webhook/route.ts:302`).
- Revisions: 2 rounds included per request; from the 3rd, each round costs 10% of the request's credits
  (`src/app/api/tickets/[id]/revision/route.ts:45`).
- On demand is a one-time $5 payment for one month of access; it does not auto-renew ("Renew on demand").
- Cancel path: in-app Cancel button (`POST /api/stripe/cancel`), effective at period end; blocked before the
  minimum term ends (early exit = contact support, Erich decides). Stripe portal cancel is OFF on purpose.
- Support: receipt confirmed the next business day; Dedicated Pro is the only 24/7 plan.
- Clients own delivered work once paid. Apps and custom software run under a separate written scope and quote.

### Terms clauses Claude wrote without an explicit Erich decision (counsel must review)

- Governing law: Illinois.
- Liability cap: fees paid in the 3 months before the claim.
- Refunds: "reviewed case by case" (no refund promise; matches "early exit, Erich decides").
- Third-party components (open source, fonts, stock, plugins) stay under their own licenses.
- Client warrants it has rights to the materials it provides.
- Price changes: existing subscriptions keep their price unless notified in advance by email.
- Terms changes: posted with a new effective date; material changes emailed to active subscribers.

## 6. Found while auditing (not fixed, separate tickets)

- Vercel did not auto-deploy the PR #43 merge to main (no deployment, no GitHub status). If it happens again, check the Git integration in Vercel project settings; workaround `vercel --prod` from a clean `main`.

- `webhook/route.ts:245` reads `items.data[0]` for period dates; repo rule says use `splitSubscriptionItems()`.
  Harmless today (plan and add-on share a period) but violates the rule.
- `webhook/route.ts:251,265` use `console.warn` / `console.log`.
- Homepage footer social links (Twitter, LinkedIn, Instagram) are `href="#"` dead links (`src/app/page.tsx` footer). LinkedIn should be https://www.linkedin.com/company/111339069; ask Erich for Twitter/Instagram or remove them.
- Terms page is English only; add ES/PT after counsel review.
- In-app strings not visually verified after PR #42 (billing feature lists, wizard success screen): need a client login.
