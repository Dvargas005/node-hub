/**
 * Idempotent SEO bundling/availability wiring. NON-destructive — touches only
 * the "seo" service variants.
 *
 * Product rule (Jun 2026): SEO is BUNDLED into the dedicated retainers —
 * "SEO Starter" (SEO Foundation) starting at Dedicated Jump and "Full SEO"
 * (Ongoing SEO) at Dedicated Pro — presented on /dedicated and covered by each
 * plan's monthly credits. For everyone else SEO is BOUGHT INDIVIDUALLY from the
 * catalog, so no SEO variant carries a hard `minPlan` gate (a gate would block
 * individual purchase below the tier, which is the opposite of what we want).
 *
 * Run: npx tsx scripts/wire-seo-individual.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const host = (process.env.DATABASE_URL || "").replace(/.*@/, "").split("/")[0];
  console.log("DB host:", host || "(unset)");

  const seo = await prisma.service.findUnique({
    where: { slug: "seo" },
    include: { variants: true },
  });
  if (!seo) {
    console.error("No service with slug 'seo' found — nothing changed.");
    process.exit(1);
  }

  for (const v of seo.variants) {
    if (v.minPlan !== null || !v.isActive) {
      console.log(`  ${v.name}: minPlan ${v.minPlan ?? "null"} -> null, active`);
      await prisma.serviceVariant.update({
        where: { id: v.id },
        data: { minPlan: null, isActive: true },
      });
    } else {
      console.log(`  ${v.name}: already ungated & active`);
    }
  }

  console.log(
    "✅ SEO is individually purchasable; Jump (Starter) / Pro (Full) bundling lives on /dedicated.",
  );
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("ERROR:", err);
  process.exit(1);
});
