/**
 * Idempotent repricing of the SEO service variants. NON-destructive — updates
 * only the three "seo" service variants by name (no wipe, no other rows).
 * 1 credit = $1. Run: npx tsx scripts/update-seo-pricing.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const UPDATES: { match: string; creditCost: number; description: string; estimatedDays: number }[] = [
  { match: "SEO Audit", creditCost: 0, description: "Free full technical & on-page SEO audit with a prioritized action plan — no cost, no commitment.", estimatedDays: 3 },
  { match: "SEO Foundation", creditCost: 1000, description: "One-time foundation ($1,000): full audit + on-page fixes + technical SEO + metadata + XML sitemap + structured data (JSON-LD) + keyword/landing strategy.", estimatedDays: 7 },
  { match: "Ongoing SEO", creditCost: 3000, description: "Monthly SEO retainer ($3,000/mo): technical maintenance, content, internal linking, backlink outreach and monthly reporting. Billed monthly — 3-month minimum commitment.", estimatedDays: 30 },
];

async function main() {
  const host = (process.env.DATABASE_URL || "").replace(/.*@/, "").split("/")[0];
  console.log("DB host:", host || "(unset)");

  const seo = await prisma.service.findUnique({ where: { slug: "seo" }, include: { variants: true } });
  if (!seo) {
    console.error("No service with slug 'seo' found — nothing changed.");
    process.exit(1);
  }

  for (const u of UPDATES) {
    const v = seo.variants.find((x) => x.name === u.match);
    if (!v) {
      console.warn(`  ! variant not found, skipped: ${u.match}`);
      continue;
    }
    console.log(`  ${u.match}: ${v.creditCost}cr -> ${u.creditCost}cr`);
    await prisma.serviceVariant.update({
      where: { id: v.id },
      data: { creditCost: u.creditCost, description: u.description, estimatedDays: u.estimatedDays, isActive: true },
    });
  }

  console.log("✅ SEO pricing updated.");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("ERROR:", err);
  process.exit(1);
});
