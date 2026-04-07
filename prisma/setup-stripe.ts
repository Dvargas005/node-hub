import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Base prices (no LEN discount). Schema stores cents — Int.
// LEN 30% off is applied via SOMOSLEN coupon at Stripe Checkout, not here.
const plans = [
  {
    slug: "member",
    name: "N.O.D.E. Member",
    description: "Plan básico: diseño y contenido esencial para tu negocio.",
    priceMonthly: 13000, // $130
    setupFee: 26000, // $260
    monthlyCredits: 140,
    bonusCredits: 0,
    maxActiveReqs: 2,
    deliveryDays: 5,
  },
  {
    slug: "growth",
    name: "N.O.D.E. Growth",
    description: "Plan completo: diseño, web y contenido con prioridad.",
    priceMonthly: 24700, // $247
    setupFee: 91000, // $910
    monthlyCredits: 350,
    bonusCredits: 0,
    maxActiveReqs: 5,
    deliveryDays: 3,
  },
  {
    slug: "pro",
    name: "N.O.D.E. Pro",
    description: "Plan premium: todos los servicios, PM dedicado, turnaround 24-48h.",
    priceMonthly: 42900, // $429
    setupFee: 130000, // $1300
    monthlyCredits: 650,
    bonusCredits: 0,
    maxActiveReqs: 999, // unlimited
    deliveryDays: 2,
  },
];

const creditPacks = [
  { name: "20 Créditos", credits: 20, price: 2000 },
  { name: "50 Créditos", credits: 50, price: 5000 },
  { name: "100 Créditos", credits: 100, price: 10000 },
  { name: "500 Créditos", credits: 500, price: 50000 },
];

async function main() {
  console.log("=== Creating Stripe products for N.O.D.E. ===\n");

  for (const plan of plans) {
    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
      metadata: { slug: plan.slug },
    });
    console.log(`Product: ${product.name} (${product.id})`);

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.priceMonthly,
      currency: "usd",
      recurring: { interval: "month" },
      metadata: { slug: plan.slug, type: "subscription" },
    });
    console.log(`  Monthly: ${price.id} ($${plan.priceMonthly / 100}/mo)`);

    const setupPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.setupFee,
      currency: "usd",
      metadata: { slug: plan.slug, type: "setup" },
    });
    console.log(`  Setup:   ${setupPrice.id} ($${plan.setupFee / 100})`);

    // Upsert plan in DB: create with full payload, update only base prices + stripe IDs on re-run
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      create: {
        name: plan.name,
        slug: plan.slug,
        priceMonthly: plan.priceMonthly,
        setupFee: plan.setupFee,
        monthlyCredits: plan.monthlyCredits,
        bonusCredits: plan.bonusCredits,
        maxActiveReqs: plan.maxActiveReqs,
        deliveryDays: plan.deliveryDays,
        stripePriceId: price.id,
        setupFeeStripePriceId: setupPrice.id,
      },
      update: {
        priceMonthly: plan.priceMonthly,
        setupFee: plan.setupFee,
        stripePriceId: price.id,
        setupFeeStripePriceId: setupPrice.id,
      },
    });
    console.log(`  DB upserted\n`);
  }

  console.log("=== Creating Credit Pack products ===\n");

  for (const pack of creditPacks) {
    const product = await stripe.products.create({
      name: `N.O.D.E. ${pack.name}`,
      description: `${pack.credits} créditos extra para N.O.D.E.`,
      metadata: { type: "credit_pack", credits: String(pack.credits) },
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: pack.price,
      currency: "usd",
      metadata: { type: "credit_pack", credits: String(pack.credits) },
    });
    console.log(`${pack.name}: ${price.id} ($${pack.price / 100} = ${pack.credits} créditos)`);

    await prisma.creditPack.create({
      data: {
        name: pack.name,
        credits: pack.credits,
        priceInCents: pack.price,
        stripePriceId: price.id,
        isActive: true,
      },
    });
  }

  console.log("\n=== Creating Coupons ===\n");

  const coupons = [
    { id: "SOMOSLEN", percent_off: 30, duration: "forever" as const, name: "LEN Members 30% Off" },
    { id: "NOUVOSVIP", percent_off: 7, duration: "forever" as const, name: "Nouvos VIP 7% Off" },
  ];

  for (const coupon of coupons) {
    try {
      await stripe.coupons.create(coupon);
      console.log(`Coupon created: ${coupon.id} (${coupon.percent_off}% off)`);
    } catch (err: any) {
      if (err.code === "resource_already_exists") {
        console.log(`Coupon ${coupon.id} already exists, skipping.`);
      } else throw err;
    }
  }

  // Create promotion codes for manual entry in checkout
  for (const coupon of coupons) {
    try {
      await stripe.promotionCodes.create({
        coupon: coupon.id,
        code: coupon.id,
        restrictions: { first_time_transaction: true },
      });
      console.log(`Promo code created: ${coupon.id}`);
    } catch (err: any) {
      console.log(`Promo code ${coupon.id}: ${err.message}`);
    }
  }

  console.log("\n=== Done! ===");
  console.log("\nPara probar webhooks local:");
  console.log("  stripe listen --forward-to localhost:3000/api/stripe/webhook");
}

main().then(() => process.exit(0)).catch(console.error);
