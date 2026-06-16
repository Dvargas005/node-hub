/**
 * Isolated, idempotent provisioning for the Dedicated Growth retainers ONLY.
 *
 * Unlike setup-stripe.ts, this touches nothing else (no other plans, no credit
 * packs, no coupons) — safe to run against production without side effects.
 *
 * Per plan: upserts the Plan row (incl. minTermMonths), then creates a Stripe
 * Product + recurring monthly Price and writes the price id back. Skips Stripe
 * creation if the row already has a stripePriceId (unless --force).
 *
 * Usage:
 *   npx tsx prisma/setup-dedicated.ts          # idempotent
 *   npx tsx prisma/setup-dedicated.ts --force  # re-create Stripe objects
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const FORCE = process.argv.includes("--force");

interface PlanSeed {
  slug: string;
  name: string;
  description: string;
  priceMonthly: number; // cents
  monthlyCredits: number;
  maxActiveReqs: number;
  deliveryDays: number;
  minTermMonths: number;
}

const PLANS: PlanSeed[] = [
  { slug: "dedicated-light", name: "Dedicated Light", description: "Managed Web, Design & Graphics retainer — Light. Monthly, 3-month minimum commitment.", priceMonthly: 300000, monthlyCredits: 3000, maxActiveReqs: 5, deliveryDays: 4, minTermMonths: 3 },
  { slug: "dedicated-jump", name: "Dedicated Jump", description: "Managed Web, Design & Graphics retainer — Jump. Monthly, 3-month minimum commitment.", priceMonthly: 600000, monthlyCredits: 6000, maxActiveReqs: 10, deliveryDays: 3, minTermMonths: 3 },
  { slug: "dedicated-pro", name: "Dedicated Pro", description: "Managed Web, Design & Graphics retainer — Pro. Monthly, 3-month minimum commitment.", priceMonthly: 1900000, monthlyCredits: 19000, maxActiveReqs: 999, deliveryDays: 2, minTermMonths: 3 },
];

async function provision(plan: PlanSeed) {
  console.log(`\n>>> ${plan.name} (${plan.slug}) — $${plan.priceMonthly / 100}/mo`);

  const row = await prisma.plan.upsert({
    where: { slug: plan.slug },
    update: {
      name: plan.name,
      priceMonthly: plan.priceMonthly,
      monthlyCredits: plan.monthlyCredits,
      maxActiveReqs: plan.maxActiveReqs,
      deliveryDays: plan.deliveryDays,
      minTermMonths: plan.minTermMonths,
      isRecurring: true,
      isHidden: true,
      isActive: true,
    },
    create: {
      slug: plan.slug,
      name: plan.name,
      priceMonthly: plan.priceMonthly,
      setupFee: 0,
      monthlyCredits: plan.monthlyCredits,
      bonusCredits: 0,
      maxActiveReqs: plan.maxActiveReqs,
      deliveryDays: plan.deliveryDays,
      minTermMonths: plan.minTermMonths,
      isRecurring: true,
      isHidden: true,
      isActive: true,
    },
  });

  if (row.stripePriceId && !FORCE) {
    console.log(`  ⏭  Skipped (already provisioned: ${row.stripePriceId}). Use --force to re-create.`);
    return;
  }

  const product = await stripe.products.create({
    name: `N.O.D.E. ${plan.name}`,
    description: plan.description,
    metadata: { slug: plan.slug, type: "dedicated_retainer", minTermMonths: String(plan.minTermMonths) },
  });
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: plan.priceMonthly,
    currency: "usd",
    recurring: { interval: "month" },
    metadata: { slug: plan.slug, type: "subscription" },
  });
  console.log(`  Product: ${product.id}  Price: ${price.id}`);

  await prisma.plan.update({ where: { slug: plan.slug }, data: { stripePriceId: price.id } });

  const verified = await prisma.plan.findUnique({ where: { slug: plan.slug }, select: { stripePriceId: true } });
  if (verified?.stripePriceId !== price.id) {
    throw new Error(`DB write verification FAILED for ${plan.slug}`);
  }
  console.log(`  ✅ DB updated and verified`);
}

async function main() {
  const isLive = (process.env.STRIPE_SECRET_KEY || "").startsWith("sk_live_");
  console.log(`=== Stripe mode: ${isLive ? "LIVE" : "TEST"} — Dedicated Growth ${FORCE ? "(--force)" : "(idempotent)"} ===`);

  for (const plan of PLANS) {
    try {
      await provision(plan);
    } catch (err) {
      console.error(`  ❌ ${plan.slug}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log("\n=== Final state ===");
  const rows = await prisma.plan.findMany({ where: { slug: { in: PLANS.map((p) => p.slug) } }, orderBy: { priceMonthly: "asc" } });
  for (const p of rows) {
    console.log(`  ${p.slug.padEnd(16)} | $${(p.priceMonthly / 100).toString().padStart(6)}/mo | ${p.monthlyCredits} cr | min ${p.minTermMonths}mo | price:${p.stripePriceId ?? "null"}`);
  }
  await prisma.$disconnect();
}

main().then(() => process.exit(0)).catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
