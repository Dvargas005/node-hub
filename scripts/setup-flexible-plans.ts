/**
 * Flexible term for Member / Growth / Pro (Erich, 2026-10-12, docs/pricing-option-c/README.md).
 *
 * WHAT IT DOES
 * ------------
 * 1. Creates one recurring monthly Stripe Price per tier on the EXISTING Product
 *    ($375 / $625 / $1,125 = 1.25x the 12-month rate). Reuses a matching active
 *    Price if one already exists, so re-running is safe.
 * 2. Upserts plan rows "member-flex" / "growth-flex" / "pro-flex": same credits,
 *    active requests, delivery and setup fee (same setup-fee Price) as the 12-month
 *    row, minTermMonths = 3, pointing at the new Price.
 * 3. Rewrites the three Product descriptions so they no longer say "12-month
 *    commitment" (the Product is shared by both terms; Checkout states the term in
 *    custom_text) and no longer claim "priority" or "dedicated PM".
 *
 * NOT TOUCHED: the 12-month Prices and rows, any subscription, Dedicated, add-ons.
 * Deliberately NOT `prisma/setup-stripe.ts --force` (duplicates Products).
 *
 * Usage:
 *   npx tsx scripts/setup-flexible-plans.ts           # dry run, reports, writes nothing
 *   npx tsx scripts/setup-flexible-plans.ts --apply   # writes to Stripe + DB
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { FLEX_MIN_TERM_MONTHS, FLEX_PRICE_MULTIPLIER, flexSlug } from "../src/lib/plan-terms";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const APPLY = process.argv.includes("--apply");
const TIERS = ["member", "growth", "pro"] as const;

// Keep in sync with prisma/setup-stripe.ts and scripts/set-plan-commitment.ts
const DESCRIPTIONS: Record<(typeof TIERS)[number], string> = {
  member: "Entry plan: design and content essentials for your business. Billed monthly; the minimum term is shown at checkout.",
  growth: "Full creative power: design, web, and content. Billed monthly; the minimum term is shown at checkout.",
  pro: "Premium: all plan services, unlimited active requests, 2-business-day turnaround. Billed monthly; the minimum term is shown at checkout.",
};

const usd = (cents: number) => `$${(cents / 100).toLocaleString("en-US")}`;

async function main() {
  console.log(APPLY ? "APPLY: writing to Stripe and the database\n" : "DRY RUN: nothing is written. Re-run with --apply.\n");
  console.log(`Stripe mode: ${process.env.STRIPE_SECRET_KEY?.startsWith("sk_live") ? "LIVE" : "TEST"}\n`);

  for (const tier of TIERS) {
    const base = await db.plan.findUnique({ where: { slug: tier } });
    if (!base?.stripePriceId) throw new Error(`${tier}: missing plan row or Stripe price`);

    const flexCents = Math.round(base.priceMonthly * FLEX_PRICE_MULTIPLIER);
    const basePrice = await stripe.prices.retrieve(base.stripePriceId);
    const productId = typeof basePrice.product === "string" ? basePrice.product : basePrice.product.id;
    const product = await stripe.products.retrieve(productId);

    // 1. Flexible Price on the same Product
    const existing = (await stripe.prices.list({ product: productId, active: true, limit: 100 })).data.find(
      (p) => p.unit_amount === flexCents && p.currency === "usd" && p.recurring?.interval === "month" && p.metadata.term === "flex",
    );
    console.log(`${tier.padEnd(7)} | 12-month ${usd(base.priceMonthly)} -> Flexible ${usd(flexCents)}/mo | product ${productId}`);
    let flexPriceId = existing?.id ?? null;
    if (existing) {
      console.log(`        | Flexible Price exists: ${existing.id}`);
    } else if (APPLY) {
      const created = await stripe.prices.create({
        product: productId,
        currency: "usd",
        unit_amount: flexCents,
        recurring: { interval: "month" },
        nickname: `Flexible (${FLEX_MIN_TERM_MONTHS}-month minimum)`,
        metadata: { term: "flex", planSlug: flexSlug(tier) },
      });
      flexPriceId = created.id;
      console.log(`        | created Flexible Price ${created.id}`);
    } else {
      console.log(`        | would create Flexible Price ${usd(flexCents)}/mo`);
    }

    // 2. Plan row
    const slug = flexSlug(tier);
    const row = await db.plan.findUnique({ where: { slug } });
    const data = {
      name: `${base.name} Flexible`,
      priceMonthly: flexCents,
      setupFee: base.setupFee,
      monthlyCredits: base.monthlyCredits,
      bonusCredits: base.bonusCredits,
      maxActiveReqs: base.maxActiveReqs,
      deliveryDays: base.deliveryDays,
      setupFeeStripePriceId: base.setupFeeStripePriceId,
      isActive: true,
      isRecurring: true,
      isHidden: false,
      minTermMonths: FLEX_MIN_TERM_MONTHS,
    };
    console.log(`        | plan row ${slug}: ${row ? "update" : "create"} (${data.monthlyCredits} credits, ${data.maxActiveReqs} active, ${data.deliveryDays}d, setup ${usd(data.setupFee)}, ${data.minTermMonths}-month minimum)`);
    if (APPLY && flexPriceId) {
      await db.plan.upsert({
        where: { slug },
        create: { slug, ...data, stripePriceId: flexPriceId },
        update: { ...data, stripePriceId: flexPriceId },
      });
    }

    // 3. Product description (shared by both terms)
    const desc = DESCRIPTIONS[tier];
    if (product.description === desc) {
      console.log(`        | product description already current`);
    } else {
      console.log(`        | product description: "${product.description ?? ""}"\n        |                  -> "${desc}"`);
      if (APPLY) await stripe.products.update(productId, { description: desc });
    }
    console.log("");
  }

  if (APPLY) {
    // Verify what checkout will read
    for (const tier of TIERS) {
      const row = await db.plan.findUnique({ where: { slug: flexSlug(tier) } });
      const price = row?.stripePriceId ? await stripe.prices.retrieve(row.stripePriceId) : null;
      const ok = !!row && !!price && price.unit_amount === row.priceMonthly && price.active;
      console.log(`verify ${flexSlug(tier).padEnd(12)} | row ${row ? usd(row.priceMonthly) : "MISSING"} | stripe ${price ? usd(price.unit_amount ?? 0) : "MISSING"} | ${ok ? "OK" : "MISMATCH"}`);
      if (!ok) process.exitCode = 1;
    }
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
