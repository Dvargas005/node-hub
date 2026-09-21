/**
 * Re-price member / growth / pro: the monthly recurring charge AND the
 * one-time setup fee, so Stripe matches what nodedev.one advertises.
 *
 * WHY THE STRIPE DASHBOARD WON'T LET YOU EDIT THE AMOUNT
 * ------------------------------------------------------
 * A Stripe Price is immutable. `unit_amount`, `currency`, and `recurring` can
 * never be edited after creation, in the Dashboard or the API. The only way to
 * change what a plan costs is to mint a NEW Price on the SAME Product, archive
 * the old one, and repoint whatever referenced it. That is what this does.
 *
 * HOW THIS DRIFTED
 * ----------------
 * Commit 535af78 ("raise smaller tiers 20%") raised the prices printed on the
 * landing page and never rotated the Stripe Prices, so the site advertised
 * 1.2x what Stripe charged. Always change prices through this script, never by
 * editing page.tsx alone.
 *
 * EXISTING SUBSCRIBERS ARE NOT TOUCHED
 * ------------------------------------
 * Archiving a Price only blocks NEW checkouts from using it. Stripe keeps
 * billing live subscriptions on the price they signed up with, until someone
 * explicitly migrates them. This script has no code path that modifies a
 * subscription.
 *
 * Deliberately NOT `prisma/setup-stripe.ts --force`, which creates duplicate
 * Products for all 8 plans and wipes the credit packs.
 *
 * Usage:
 *   npx tsx scripts/reprice-plans.ts           # dry run, reports, writes nothing
 *   npx tsx scripts/reprice-plans.ts --apply   # writes to Stripe + DB
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes("--apply");

interface Target {
  slug: string;
  /** Monthly recurring amount, in cents. */
  priceMonthly: number;
  /**
   * One-time setup fee, in cents. Must equal the `setup` value printed in
   * src/app/page.tsx (which is in dollars), or the site and Stripe disagree.
   */
  setupFee: number;
}

const targets: Target[] = [
  { slug: "member", priceMonthly: 30000, setupFee: 31200 },
  { slug: "growth", priceMonthly: 50000, setupFee: 109200 },
  { slug: "pro", priceMonthly: 90000, setupFee: 156000 },
];

const usd = (cents: number) => `$${(cents / 100).toLocaleString("en-US")}`;

/** Problems worth a human's attention, collected and printed at the end. */
const warnings: string[] = [];

async function repriceOne(target: Target) {
  const plan = await prisma.plan.findUnique({ where: { slug: target.slug } });
  if (!plan) {
    warnings.push(`${target.slug}: no DB row. Run prisma/setup-stripe.ts first.`);
    console.log(`\n>>> ${target.slug}\n  SKIP: no DB row.`);
    return;
  }

  console.log(`\n>>> ${plan.name} (${plan.slug})`);

  if (!plan.stripePriceId) {
    warnings.push(`${plan.slug}: no stripePriceId on the DB row.`);
    console.log(`  SKIP: no stripePriceId on the DB row.`);
    return;
  }

  // Reuse the Product the current price already belongs to. Never create one.
  const currentPrice = await stripe.prices.retrieve(plan.stripePriceId);
  const productId = currentPrice.product as string;
  const product = await stripe.products.retrieve(productId);
  console.log(`  Product:        ${product.id} (${product.name})`);

  const liveMonthly = currentPrice.unit_amount ?? 0;
  const needMonthly = liveMonthly !== target.priceMonthly;
  console.log(
    `  Monthly:        ${usd(liveMonthly)} -> ${usd(target.priceMonthly)}` +
      (needMonthly ? "" : "   (already correct)"),
  );

  const setupPrice = plan.setupFeeStripePriceId
    ? await stripe.prices.retrieve(plan.setupFeeStripePriceId)
    : null;
  const liveSetup = setupPrice?.unit_amount ?? 0;
  const needSetup = target.setupFee > 0 && liveSetup !== target.setupFee;
  console.log(
    `  Setup (1-time): ${setupPrice ? usd(liveSetup) : "none"} -> ${usd(target.setupFee)}` +
      (needSetup ? "" : "   (already correct)"),
  );

  // ---- Stray prices left behind by earlier manual Dashboard attempts. ----
  const allPrices = await stripe.prices.list({
    product: productId,
    active: true,
    limit: 100,
  });
  const strays = allPrices.data.filter(
    (p) => p.id !== plan.stripePriceId && p.id !== plan.setupFeeStripePriceId,
  );
  if (strays.length) {
    console.log(`  Stray active prices on this product (not referenced by the DB):`);
    for (const s of strays) {
      console.log(
        `    - ${s.id}  ${usd(s.unit_amount ?? 0)}${s.recurring ? "/mo" : " one-time"}`,
      );
    }
    warnings.push(
      `${plan.slug}: ${strays.length} stray active price(s) on the product. ` +
        `Archive them so nobody checks out on the wrong amount.`,
    );
  }

  // ---- Who is on the monthly price we are about to archive? ----
  const onOldPrice = await stripe.subscriptions.list({
    price: plan.stripePriceId,
    status: "active",
    limit: 100,
  });
  console.log(
    `  Active subs on the old monthly price: ${onOldPrice.data.length}` +
      (onOldPrice.data.length
        ? `   (they stay at ${usd(liveMonthly)}/mo, not migrated)`
        : ""),
  );

  if (!needMonthly && !needSetup) {
    console.log(`  Nothing to rotate.`);
    return;
  }

  if (!APPLY) {
    if (needMonthly) {
      console.log(
        `  DRY RUN: would mint ${usd(target.priceMonthly)}/mo, set as product default, ` +
          `archive ${plan.stripePriceId}.`,
      );
    }
    if (needSetup) {
      console.log(
        `  DRY RUN: would mint ${usd(target.setupFee)} one-time setup` +
          (plan.setupFeeStripePriceId ? `, archive ${plan.setupFeeStripePriceId}.` : "."),
      );
    }
    return;
  }

  // ---- Apply. Order matters: create every new price, repoint the DB, verify,
  // and only THEN archive the old ones. If anything throws midway, the old
  // prices are still live, so checkout keeps working instead of failing on an
  // archived price. The worst case is an unreferenced new price, which is inert. ----
  let newMonthlyId = plan.stripePriceId;
  if (needMonthly) {
    const created = await stripe.prices.create({
      product: productId,
      unit_amount: target.priceMonthly,
      currency: currentPrice.currency,
      recurring: { interval: "month" },
      metadata: { slug: plan.slug, type: "subscription" },
    });
    newMonthlyId = created.id;
    console.log(`  Created monthly: ${created.id} (${usd(target.priceMonthly)}/mo)`);
    // The Dashboard shows a product's default price, so keep it honest.
    await stripe.products.update(productId, { default_price: created.id });
  }

  let newSetupId = plan.setupFeeStripePriceId;
  if (needSetup) {
    const created = await stripe.prices.create({
      product: productId,
      unit_amount: target.setupFee,
      currency: currentPrice.currency,
      metadata: { slug: plan.slug, type: "setup" },
    });
    newSetupId = created.id;
    console.log(`  Created setup:   ${created.id} (${usd(target.setupFee)} one-time)`);
  }

  await prisma.plan.update({
    where: { slug: plan.slug },
    data: {
      priceMonthly: target.priceMonthly,
      stripePriceId: newMonthlyId,
      setupFee: target.setupFee,
      setupFeeStripePriceId: newSetupId,
    },
  });

  // Re-read so the write is proven, not assumed.
  const verified = await prisma.plan.findUnique({ where: { slug: plan.slug } });
  if (
    verified?.priceMonthly !== target.priceMonthly ||
    verified?.stripePriceId !== newMonthlyId ||
    verified?.setupFee !== target.setupFee ||
    verified?.setupFeeStripePriceId !== newSetupId
  ) {
    throw new Error(
      `DB write verification FAILED for ${plan.slug}. New Stripe prices exist but ` +
        `the DB does not reference them. Old prices were NOT archived, so checkout ` +
        `still works. Fix the DB before rerunning.`,
    );
  }
  console.log(`  DB updated and verified.`);

  // Archive only after the DB points somewhere else.
  if (needMonthly) {
    await stripe.prices.update(plan.stripePriceId, { active: false });
    console.log(`  Archived monthly: ${plan.stripePriceId}`);
  }
  if (needSetup && plan.setupFeeStripePriceId) {
    await stripe.prices.update(plan.setupFeeStripePriceId, { active: false });
    console.log(`  Archived setup:   ${plan.setupFeeStripePriceId}`);
  }
}

async function main() {
  const isLive = (process.env.STRIPE_SECRET_KEY || "").startsWith("sk_live_");
  console.log(`=== Stripe mode: ${isLive ? "LIVE" : "TEST"} ===`);
  console.log(`=== ${APPLY ? "APPLY: writing to Stripe + DB" : "DRY RUN: no writes"} ===`);

  for (const target of targets) {
    await repriceOne(target);
  }

  console.log("\n=== Final DB state (re-read) ===\n");
  const rows = await prisma.plan.findMany({
    where: { slug: { in: targets.map((t) => t.slug) } },
    orderBy: { priceMonthly: "asc" },
  });
  for (const p of rows) {
    console.log(
      `${p.slug.padEnd(8)} | ${usd(p.priceMonthly).padStart(7)}/mo | ` +
        `setup ${usd(p.setupFee).padStart(8)} | ` +
        `monthly:${p.stripePriceId ?? "null"} setup:${p.setupFeeStripePriceId ?? "null"}`,
    );
  }

  if (warnings.length) {
    console.log(`\n=== ${warnings.length} thing(s) needing a human ===\n`);
    for (const w of warnings) console.log(`  ! ${w}`);
  } else {
    console.log(`\nNo mismatches found.`);
  }

  await prisma.$disconnect();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("FATAL:", err);
    process.exit(1);
  });
