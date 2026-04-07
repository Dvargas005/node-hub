/**
 * Idempotent Stripe + Plan setup.
 *
 * Default behaviour: per plan, skips Stripe creation if the DB row already
 * has a stripePriceId. Pass `--force` to ignore the skip and re-create
 * everything from scratch (useful when DB IDs point to stale/wiped Stripe
 * objects, or when switching from TEST to LIVE).
 *
 * After every Stripe creation, the DB row is updated with the new price IDs
 * AND immediately re-fetched and logged so the user can verify the write.
 *
 * - Plans: upserts in DB with full payload, then provisions Stripe + writes
 *   IDs back. Per-plan try/catch — one failure doesn't abort the others.
 * - Credit packs: 4 canonical packs (20/50/100/500 credits, 1:1 USD).
 *   Detects duplicates and runs a clean reset when needed.
 * - Coupons: SOMOSLEN + NOUVOSVIP — idempotent via try/catch.
 *
 * Usage:
 *   npx tsx prisma/setup-stripe.ts            # idempotent (skips if provisioned)
 *   npx tsx prisma/setup-stripe.ts --force    # re-create everything in Stripe
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
  setupFee: number; // cents
  monthlyCredits: number;
  bonusCredits: number;
  maxActiveReqs: number;
  deliveryDays: number;
  isRecurring: boolean;
}

const plans: PlanSeed[] = [
  {
    slug: "starter",
    name: "N.O.D.E. On demand",
    description: "1-month pay-as-you-go. No credits included — buy 1:1 as you need them.",
    priceMonthly: 500, // $5
    setupFee: 0,
    monthlyCredits: 0,
    bonusCredits: 0,
    maxActiveReqs: 1,
    deliveryDays: 5,
    isRecurring: false,
  },
  {
    slug: "member",
    name: "N.O.D.E. Member",
    description: "Entry plan: design and content essentials for your business.",
    priceMonthly: 13000, // $130
    setupFee: 26000, // $260
    monthlyCredits: 140,
    bonusCredits: 0,
    maxActiveReqs: 2,
    deliveryDays: 5,
    isRecurring: true,
  },
  {
    slug: "growth",
    name: "N.O.D.E. Growth",
    description: "Full creative power: design, web and content with priority.",
    priceMonthly: 24700, // $247
    setupFee: 91000, // $910
    monthlyCredits: 350,
    bonusCredits: 0,
    maxActiveReqs: 5,
    deliveryDays: 3,
    isRecurring: true,
  },
  {
    slug: "pro",
    name: "N.O.D.E. Pro",
    description: "Premium: all services, dedicated PM, 24-48h turnaround.",
    priceMonthly: 42900, // $429
    setupFee: 130000, // $1300
    monthlyCredits: 650,
    bonusCredits: 0,
    maxActiveReqs: 999, // unlimited (display fallback maps 999 → ∞)
    deliveryDays: 2,
    isRecurring: true,
  },
];

interface ProvisionResult {
  slug: string;
  status: "skipped" | "provisioned" | "error";
  before: { stripePriceId: string | null; setupFeeStripePriceId: string | null };
  after?: { stripePriceId: string | null; setupFeeStripePriceId: string | null };
  error?: string;
}

async function provisionPlan(plan: PlanSeed): Promise<ProvisionResult> {
  console.log(`\n>>> ${plan.name} (${plan.slug})`);

  // 1. Upsert DB row first (only updates non-Stripe fields)
  const existing = await prisma.plan.findUnique({ where: { slug: plan.slug } });
  const dbRow = existing
    ? await prisma.plan.update({
        where: { slug: plan.slug },
        data: {
          name: plan.name,
          priceMonthly: plan.priceMonthly,
          setupFee: plan.setupFee,
          monthlyCredits: plan.monthlyCredits,
          bonusCredits: plan.bonusCredits,
          maxActiveReqs: plan.maxActiveReqs,
          deliveryDays: plan.deliveryDays,
          isRecurring: plan.isRecurring,
        },
      })
    : await prisma.plan.create({
        data: {
          name: plan.name,
          slug: plan.slug,
          priceMonthly: plan.priceMonthly,
          setupFee: plan.setupFee,
          monthlyCredits: plan.monthlyCredits,
          bonusCredits: plan.bonusCredits,
          maxActiveReqs: plan.maxActiveReqs,
          deliveryDays: plan.deliveryDays,
          isRecurring: plan.isRecurring,
        },
      });

  const before = {
    stripePriceId: dbRow.stripePriceId,
    setupFeeStripePriceId: dbRow.setupFeeStripePriceId,
  };
  console.log(
    `  Before:        price=${before.stripePriceId ?? "null"}, setup=${before.setupFeeStripePriceId ?? "null"}`,
  );

  // 2. Skip if already provisioned (unless --force)
  if (dbRow.stripePriceId && !FORCE) {
    console.log(`  ⏭  Skipped (already provisioned). Use --force to re-create.`);
    return { slug: plan.slug, status: "skipped", before };
  }

  // 3. Create Stripe Product + Price(s)
  const product = await stripe.products.create({
    name: plan.name,
    description: plan.description,
    metadata: { slug: plan.slug },
  });
  console.log(`  Product:       ${product.id}`);

  const monthlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: plan.priceMonthly,
    currency: "usd",
    // Recurring only for subscription plans; one-time payment for non-recurring (Starter)
    ...(plan.isRecurring ? { recurring: { interval: "month" as const } } : {}),
    metadata: { slug: plan.slug, type: plan.isRecurring ? "subscription" : "one_time" },
  });
  console.log(
    `  Monthly price: ${monthlyPrice.id} ($${plan.priceMonthly / 100}${plan.isRecurring ? "/mo" : " one-time"})`,
  );

  // Setup fee price (only when > 0)
  let setupFeePrice: Stripe.Price | null = null;
  if (plan.setupFee > 0) {
    setupFeePrice = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.setupFee,
      currency: "usd",
      metadata: { slug: plan.slug, type: "setup" },
    });
    console.log(`  Setup price:   ${setupFeePrice.id} ($${plan.setupFee / 100})`);
  }

  // 4. Update DB with the new Stripe IDs
  await prisma.plan.update({
    where: { slug: plan.slug },
    data: {
      stripePriceId: monthlyPrice.id,
      setupFeeStripePriceId: setupFeePrice?.id || null,
    },
  });

  // 5. Re-fetch and verify the write actually landed in the DB
  const verified = await prisma.plan.findUnique({
    where: { slug: plan.slug },
    select: { stripePriceId: true, setupFeeStripePriceId: true },
  });

  console.log(
    `  After:         price=${verified?.stripePriceId ?? "null"}, setup=${verified?.setupFeeStripePriceId ?? "null"}`,
  );

  if (verified?.stripePriceId !== monthlyPrice.id) {
    throw new Error(
      `DB write verification FAILED: expected ${monthlyPrice.id}, got ${verified?.stripePriceId}`,
    );
  }

  console.log(`  ✅ DB updated and verified`);

  return {
    slug: plan.slug,
    status: "provisioned",
    before,
    after: {
      stripePriceId: verified.stripePriceId,
      setupFeeStripePriceId: verified.setupFeeStripePriceId,
    },
  };
}

interface CreditPackSeed {
  name: string;
  credits: number;
  priceInCents: number;
}

const CANONICAL_PACKS: CreditPackSeed[] = [
  { name: "20 Credits", credits: 20, priceInCents: 2000 },
  { name: "50 Credits", credits: 50, priceInCents: 5000 },
  { name: "100 Credits", credits: 100, priceInCents: 10000 },
  { name: "500 Credits", credits: 500, priceInCents: 50000 },
];

async function provisionCreditPacks() {
  const existing = await prisma.creditPack.findMany({ orderBy: { credits: "asc" } });
  console.log(`Existing packs: ${existing.length}`);

  // Detect a clean state: exactly 4 packs, one per canonical credit value,
  // English names, all priced 1:1, all with stripePriceId set, no extras.
  const isClean =
    !FORCE &&
    existing.length === CANONICAL_PACKS.length &&
    CANONICAL_PACKS.every((canonical: CreditPackSeed) => {
      const matches = existing.filter((p: any) => p.credits === canonical.credits);
      if (matches.length !== 1) return false;
      const p = matches[0];
      return (
        p.priceInCents === canonical.priceInCents &&
        p.name === canonical.name &&
        !!p.stripePriceId
      );
    });

  if (isClean) {
    console.log("⏭  Already clean — 4 canonical packs with Stripe IDs. Use --force to re-create.");
    return;
  }

  console.log(
    FORCE
      ? "🗑  --force: wiping all credit packs and re-creating from scratch"
      : "🗑  Detected duplicates / legacy packs — wiping and re-creating",
  );
  const wipeCount = await prisma.creditPack.deleteMany({});
  console.log(`   Deleted ${wipeCount.count} pack rows from DB`);

  for (const pack of CANONICAL_PACKS) {
    console.log(`\n>>> ${pack.name}`);
    const product = await stripe.products.create({
      name: `N.O.D.E. ${pack.name}`,
      description: `${pack.credits} extra credits for N.O.D.E. (1:1 USD)`,
      metadata: { type: "credit_pack", credits: String(pack.credits) },
    });
    console.log(`  Product:       ${product.id}`);

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: pack.priceInCents,
      currency: "usd",
      metadata: { type: "credit_pack", credits: String(pack.credits) },
    });
    console.log(`  Price:         ${price.id} ($${pack.priceInCents / 100} = ${pack.credits} credits)`);

    await prisma.creditPack.create({
      data: {
        name: pack.name,
        credits: pack.credits,
        priceInCents: pack.priceInCents,
        stripePriceId: price.id,
        isActive: true,
      },
    });

    // Verify
    const verified = await prisma.creditPack.findFirst({ where: { credits: pack.credits } });
    if (!verified || verified.stripePriceId !== price.id) {
      throw new Error(`Pack ${pack.name}: DB write verification FAILED`);
    }
    console.log(`  ✅ DB row created and verified (id=${verified.id})`);
  }

  console.log("\n📦 Final pack summary:");
  const finalPacks = await prisma.creditPack.findMany({ orderBy: { credits: "asc" } });
  for (const p of finalPacks) {
    console.log(`  ${p.name.padEnd(15)} | ${p.credits} cr | $${p.priceInCents / 100} | stripe:${p.stripePriceId}`);
  }
}

async function main() {
  const isLive = (process.env.STRIPE_SECRET_KEY || "").startsWith("sk_live_");
  console.log(`=== Stripe mode: ${isLive ? "LIVE" : "TEST"} ===`);
  console.log(`=== Plan setup ${FORCE ? "(--force: re-create)" : "(idempotent)"} ===`);

  const results: ProvisionResult[] = [];
  for (const plan of plans) {
    try {
      const result = await provisionPlan(plan);
      results.push(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  ❌ ERROR: ${message}`);
      results.push({
        slug: plan.slug,
        status: "error",
        before: { stripePriceId: null, setupFeeStripePriceId: null },
        error: message,
      });
    }
  }

  console.log("\n=== Credit packs ===");
  await provisionCreditPacks();

  console.log("\n=== Coupons ===");

  const coupons = [
    { id: "SOMOSLEN", percent_off: 30, duration: "forever" as const, name: "LEN Members 30% Off" },
    { id: "NOUVOSVIP", percent_off: 7, duration: "forever" as const, name: "Nouvos VIP 7% Off" },
  ];

  for (const coupon of coupons) {
    try {
      await stripe.coupons.create(coupon);
      console.log(`✅ Coupon: ${coupon.id} (${coupon.percent_off}% off)`);
    } catch (err: any) {
      if (err.code === "resource_already_exists") {
        console.log(`⏭  Coupon ${coupon.id} already exists`);
      } else {
        console.error(`❌ Coupon ${coupon.id}: ${err.message}`);
      }
    }
  }

  for (const coupon of coupons) {
    try {
      await stripe.promotionCodes.create({
        coupon: coupon.id,
        code: coupon.id,
        restrictions: { first_time_transaction: true },
      });
      console.log(`✅ Promo code: ${coupon.id}`);
    } catch (err: any) {
      if (String(err.message).includes("already exists") || err.code === "resource_already_exists") {
        console.log(`⏭  Promo ${coupon.id} already exists`);
      } else {
        console.log(`Promo ${coupon.id}: ${err.message}`);
      }
    }
  }

  // Final summary table
  console.log("\n=== Final DB state (verified by re-read) ===\n");
  const finalRows = await prisma.plan.findMany({ orderBy: { priceMonthly: "asc" } });
  for (const p of finalRows) {
    const r = results.find((x) => x.slug === p.slug);
    const tag =
      r?.status === "provisioned"
        ? "✅ PROVISIONED"
        : r?.status === "skipped"
          ? "⏭  SKIPPED"
          : r?.status === "error"
            ? "❌ ERROR"
            : "—";
    console.log(
      `${p.slug.padEnd(8)} | ${tag.padEnd(15)} | $${(p.priceMonthly / 100).toString().padStart(5)} | price:${p.stripePriceId ?? "null"} | setup:${p.setupFeeStripePriceId ?? "null"}`,
    );
    if (r?.error) console.log(`         error: ${r.error}`);
  }

  const failed = results.filter((r) => r.status === "error");
  console.log(
    `\n${failed.length === 0 ? "🎉 All good." : `⚠  ${failed.length} plan(s) failed.`}`,
  );

  await prisma.$disconnect();
  if (failed.length > 0) process.exit(1);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
