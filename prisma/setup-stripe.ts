/**
 * Idempotent Stripe + Plan setup.
 *
 * - Plans: upserts in DB with full payload. For each plan, only creates Stripe
 *   Products + Prices when stripePriceId is missing in DB. Existing rows are
 *   left untouched on Stripe side (avoids duplicate Stripe products).
 * - Credit packs: skipped entirely (legacy duplicates exist; the new
 *   `credit_pack_custom` flow replaces fixed packs anyway).
 * - Coupons: SOMOSLEN + NOUVOSVIP — creation is idempotent via try/catch.
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

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
    name: "N.O.D.E. Starter",
    description: "1-month trial. No credits included — buy as you go.",
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

async function main() {
  const isLive = (process.env.STRIPE_SECRET_KEY || "").startsWith("sk_live_");
  console.log(`=== Stripe mode: ${isLive ? "LIVE" : "TEST"} ===\n`);
  console.log("=== Plan setup (idempotent) ===\n");

  for (const plan of plans) {
    console.log(`>>> ${plan.name} (${plan.slug})`);

    // 1. Upsert DB row first (no Stripe IDs yet on create)
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

    // 2. Skip Stripe creation if already provisioned
    if (dbRow.stripePriceId) {
      console.log(`  ⏭  Stripe already provisioned: ${dbRow.stripePriceId}`);
      continue;
    }

    // 3. Create Stripe Product + Price(s)
    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
      metadata: { slug: plan.slug },
    });
    console.log(`  Product:       ${product.id}`);

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.priceMonthly,
      currency: "usd",
      // Recurring only for subscription plans; one-time payment for non-recurring (Starter)
      ...(plan.isRecurring ? { recurring: { interval: "month" as const } } : {}),
      metadata: { slug: plan.slug, type: plan.isRecurring ? "subscription" : "one_time" },
    });
    console.log(`  Monthly price: ${price.id} ($${plan.priceMonthly / 100}${plan.isRecurring ? "/mo" : " one-time"})`);

    // Setup fee price (only when > 0)
    let setupPriceId: string | null = null;
    if (plan.setupFee > 0) {
      const setupPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.setupFee,
        currency: "usd",
        metadata: { slug: plan.slug, type: "setup" },
      });
      setupPriceId = setupPrice.id;
      console.log(`  Setup price:   ${setupPrice.id} ($${plan.setupFee / 100})`);
    }

    await prisma.plan.update({
      where: { slug: plan.slug },
      data: {
        stripePriceId: price.id,
        setupFeeStripePriceId: setupPriceId,
      },
    });
    console.log(`  ✅ DB updated with Stripe IDs\n`);
  }

  console.log("=== Coupons ===\n");

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
      } else throw err;
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

  console.log("\n=== Done ===\n");
  await prisma.$disconnect();
}

main().then(() => process.exit(0)).catch((err) => {
  console.error("ERROR:", err);
  process.exit(1);
});
