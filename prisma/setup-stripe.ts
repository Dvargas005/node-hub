import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const plans = [
  {
    slug: "member",
    name: "N.O.D.E. Member",
    description: "Plan básico: diseño y contenido esencial para tu negocio.",
    monthlyPrice: 10000,
    setupFee: 20000,
  },
  {
    slug: "growth",
    name: "N.O.D.E. Growth",
    description: "Plan completo: diseño, web y contenido con prioridad.",
    monthlyPrice: 19000,
    setupFee: 70000,
  },
  {
    slug: "pro",
    name: "N.O.D.E. Pro",
    description: "Plan premium: todos los servicios, PM dedicado, turnaround 24-48h.",
    monthlyPrice: 33000,
    setupFee: 100000,
  },
];

const creditPacks = [
  { name: "Pack Básico", credits: 100, price: 5000 },
  { name: "Pack Plus", credits: 250, price: 10000 },
  { name: "Pack Premium", credits: 500, price: 17500 },
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
      unit_amount: plan.monthlyPrice,
      currency: "usd",
      recurring: { interval: "month" },
      metadata: { slug: plan.slug, type: "subscription" },
    });
    console.log(`  Monthly: ${price.id} ($${plan.monthlyPrice / 100}/mo)`);

    const setupPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.setupFee,
      currency: "usd",
      metadata: { slug: plan.slug, type: "setup" },
    });
    console.log(`  Setup:   ${setupPrice.id} ($${plan.setupFee / 100})`);

    await prisma.plan.update({
      where: { slug: plan.slug },
      data: {
        stripePriceId: price.id,
        setupFeeStripePriceId: setupPrice.id,
      },
    });
    console.log(`  DB updated\n`);
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

  console.log("\n=== Done! ===");
  console.log("\nPara probar webhooks local:");
  console.log("  stripe listen --forward-to localhost:3000/api/stripe/webhook");
}

main().then(() => process.exit(0)).catch(console.error);
