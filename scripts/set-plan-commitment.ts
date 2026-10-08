/**
 * Make the 12-month commitment on Member / Growth / Pro real everywhere it lives
 * outside the code: the plans table, the Stripe Products, and the Stripe portal.
 *
 * WHAT IT DOES
 * ------------
 * 1. plans.minTermMonths = 12 for member / growth / pro. The webhook and
 *    verify-session stamp Subscription.minTermEndsAt from this on every new checkout.
 * 2. Stripe Product description for those plans states the commitment (it prints on
 *    Checkout and invoices) and matches prisma/setup-stripe.ts.
 * 3. Stripe customer portal: turns OFF "cancel subscription" on every active
 *    configuration. POST /api/stripe/cancel is then the only self-service way to
 *    cancel, and it checks the term (src/lib/commitment.ts). The portal still
 *    handles payment methods and invoices.
 *
 * EXISTING SUBSCRIBERS ARE NOT TOUCHED
 * ------------------------------------
 * No subscription row or Stripe subscription is modified. A subscription that
 * started before this ran has no minTermEndsAt and stays cancellable. The script
 * lists any live Stripe subscription it finds so nobody is surprised.
 *
 * Usage:
 *   npx tsx scripts/set-plan-commitment.ts           # dry run, reports, writes nothing
 *   npx tsx scripts/set-plan-commitment.ts --apply   # writes to Stripe + DB
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const APPLY = process.argv.includes("--apply");
const MIN_TERM_MONTHS = 12;

// Keep in sync with prisma/setup-stripe.ts
const DESCRIPTIONS: Record<string, string> = {
  member: "Entry plan: design and content essentials for your business. 12-month commitment, billed monthly.",
  growth: "Full creative power: design, web and content with priority. 12-month commitment, billed monthly.",
  pro: "Premium: all services, dedicated PM, 2-business-day turnaround. 12-month commitment, billed monthly.",
};

async function main() {
  console.log(APPLY ? "APPLY: writing to Stripe and the database\n" : "DRY RUN: nothing is written. Re-run with --apply.\n");

  // 1 + 2. Plans and their Stripe Products
  for (const slug of Object.keys(DESCRIPTIONS)) {
    // `select` keeps this runnable before newer columns are pushed to the database
    const plan = await db.plan.findUnique({ where: { slug }, select: { id: true, minTermMonths: true, stripePriceId: true } });
    if (!plan) {
      console.log(`  ${slug.padEnd(8)} | NOT FOUND in plans, skipped`);
      continue;
    }
    console.log(`  ${slug.padEnd(8)} | minTermMonths ${plan.minTermMonths} -> ${MIN_TERM_MONTHS}${plan.minTermMonths === MIN_TERM_MONTHS ? " (already set)" : ""}`);
    if (APPLY && plan.minTermMonths !== MIN_TERM_MONTHS) {
      await db.plan.update({ where: { id: plan.id }, data: { minTermMonths: MIN_TERM_MONTHS } });
    }

    if (!plan.stripePriceId) {
      console.log(`           | no Stripe price on this plan, product description skipped`);
      continue;
    }
    const price = await stripe.prices.retrieve(plan.stripePriceId);
    const productId = typeof price.product === "string" ? price.product : price.product.id;
    const product = await stripe.products.retrieve(productId);
    const same = product.description === DESCRIPTIONS[slug];
    console.log(`           | product ${productId}: "${product.description ?? ""}"`);
    console.log(`           |   -> "${DESCRIPTIONS[slug]}"${same ? " (already set)" : ""}`);
    if (APPLY && !same) {
      await stripe.products.update(productId, { description: DESCRIPTIONS[slug] });
    }
  }

  // 3. Customer portal: no self-service cancel
  const configs = await stripe.billingPortal.configurations.list({ active: true, limit: 100 });
  console.log("");
  for (const c of configs.data) {
    const on = c.features.subscription_cancel.enabled;
    console.log(`  portal ${c.id}${c.is_default ? " (default)" : ""} | cancel ${on ? "ON -> OFF" : "already OFF"}`);
    if (APPLY && on) {
      await stripe.billingPortal.configurations.update(c.id, { features: { subscription_cancel: { enabled: false } } });
    }
  }

  // Report anyone this could affect
  console.log("");
  let live = 0;
  for (const status of ["active", "trialing", "past_due"] as const) {
    const subs = await stripe.subscriptions.list({ status, limit: 100 });
    for (const s of subs.data) {
      live++;
      console.log(`  LIVE SUBSCRIPTION ${s.id} (${status}) customer ${typeof s.customer === "string" ? s.customer : s.customer.id}: keeps no term, but loses the portal cancel button`);
    }
  }
  console.log(live === 0 ? "  No live Stripe subscriptions: nobody is affected." : `  ${live} live Stripe subscription(s) found. Tell Erich before applying.`);
}

main()
  .catch((e) => {
    console.error("FAILED:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
