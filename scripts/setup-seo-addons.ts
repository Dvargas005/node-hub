/**
 * Idempotent provisioning of the SEO add-ons (Stripe Products + monthly Prices + DB rows),
 * and of which add-on tier each Dedicated plan already includes.
 *
 *   npx tsx scripts/setup-seo-addons.ts           # dry run: prints what it would do
 *   npx tsx scripts/setup-seo-addons.ts --apply   # writes to Stripe + DB
 *
 * Point it at a test setup with DOTENV_CONFIG_PATH=.env.development.local (Stripe test key +
 * Neon branch). Prices are found by lookup_key, so re-running never duplicates them.
 * A price change = new lookup_key (amount is part of it) -> new Price; the old one stays
 * on existing subscriptions until moved, same as scripts/reprice-plans.ts.
 */
import "dotenv/config";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const APPLY = process.argv.includes("--apply");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const ADDONS = [
  { slug: "starter-seo", name: "Starter SEO", rank: 1, priceMonthly: 125000,
    description: "SEO add-on: Starter SEO. Monthly, 3-month minimum. Requires an active N.O.D.E. plan." },
  { slug: "full-seo", name: "Full SEO", rank: 2, priceMonthly: 250000,
    description: "SEO add-on: Full SEO. Monthly, 3-month minimum. Requires an active N.O.D.E. plan." },
  { slug: "full-seo-geo-aeo", name: "Full SEO, GEO & AEO", rank: 3, priceMonthly: 400000,
    description: "SEO add-on: Full SEO, GEO and AEO. Monthly, 3-month minimum. Requires an active N.O.D.E. plan." },
];

// Tier already included in the plan price (Erich, 2026-10-01).
const INCLUDED: Record<string, string> = {
  "dedicated-jump": "starter-seo",
  "dedicated-pro": "full-seo-geo-aeo",
};

async function main() {
  const key = process.env.STRIPE_SECRET_KEY || "";
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  const stripe = new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
  const host = (process.env.DATABASE_URL || "").replace(/.*@/, "").split("/")[0];
  console.log(`=== Stripe ${key.startsWith("sk_live_") ? "LIVE" : "TEST"} | DB ${host || "(unset)"} | ${APPLY ? "APPLY" : "DRY RUN"} ===`);

  for (const a of ADDONS) {
    const lookupKey = `addon_${a.slug.replace(/-/g, "_")}_monthly_${a.priceMonthly}`;
    const row = await prisma.addOn.findUnique({ where: { slug: a.slug } });
    console.log(`\n>>> ${a.name} $${a.priceMonthly / 100}/mo (${lookupKey})`);

    let productId = row?.stripeProductId || null;
    if (productId) {
      const p = await stripe.products.retrieve(productId).catch(() => null);
      if (!p || p.deleted) productId = null;
    }
    if (!productId) {
      const found = await stripe.products.search({ query: `metadata['addon_slug']:'${a.slug}'` }).catch(() => null);
      productId = found?.data[0]?.id || null;
    }
    if (!productId) {
      console.log(`  create Product "SEO Add-on: ${a.name}"`);
      if (APPLY) {
        const p = await stripe.products.create({
          name: `SEO Add-on: ${a.name}`,
          description: a.description,
          metadata: { addon_slug: a.slug, type: "seo_addon" },
        });
        productId = p.id;
      }
    } else {
      console.log(`  Product ok: ${productId}`);
    }

    const existing = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
    let priceId = existing.data[0]?.id || null;
    if (!priceId) {
      console.log(`  create Price $${a.priceMonthly / 100}/month`);
      if (APPLY && productId) {
        const price = await stripe.prices.create({
          product: productId,
          currency: "usd",
          unit_amount: a.priceMonthly,
          recurring: { interval: "month" },
          lookup_key: lookupKey,
          metadata: { addon_slug: a.slug, type: "seo_addon" },
        });
        priceId = price.id;
      }
    } else {
      console.log(`  Price ok: ${priceId}`);
    }

    console.log(`  DB add_ons.${a.slug}: ${row ? "update" : "create"}`);
    if (APPLY) {
      const data = {
        name: a.name, rank: a.rank, priceMonthly: a.priceMonthly, minTermMonths: 3,
        stripeProductId: productId, stripePriceId: priceId, isActive: true,
      };
      await prisma.addOn.upsert({ where: { slug: a.slug }, update: data, create: { slug: a.slug, ...data } });
    }
  }

  console.log("");
  for (const [planSlug, addOnSlug] of Object.entries(INCLUDED)) {
    const plan = await prisma.plan.findUnique({ where: { slug: planSlug } });
    if (!plan) {
      console.warn(`  ! plan ${planSlug} not found, skipped`);
      continue;
    }
    console.log(`  ${planSlug} includes ${addOnSlug}`);
    if (APPLY) {
      const addOn = await prisma.addOn.findUnique({ where: { slug: addOnSlug } });
      await prisma.plan.update({ where: { id: plan.id }, data: { includedAddOnId: addOn?.id ?? null } });
    }
  }

  console.log(APPLY ? "\nDone." : "\nDry run only. Re-run with --apply to write.");
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("ERROR:", err);
  await prisma.$disconnect();
  process.exit(1);
});
