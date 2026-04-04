/**
 * Detect and clean up orphaned users — users without an Account record.
 * Updated for Prisma 7 with PrismaPg adapter.
 *
 * Usage:
 *   npx tsx scripts/fix-orphaned-users.ts          # list only
 *   npx tsx scripts/fix-orphaned-users.ts --delete  # list + delete
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const shouldDelete = process.argv.includes("--delete");

async function main() {
  const orphaned = await prisma.user.findMany({
    where: { accounts: { none: {} } },
    select: { id: true, email: true, name: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  if (orphaned.length === 0) {
    console.log("No orphaned users found. All users have account records.");
    return;
  }

  console.log(`Found ${orphaned.length} user(s) without account records:\n`);
  for (const u of orphaned) {
    console.log(
      `  ${u.email} — ${u.name || "(no name)"} — created ${u.createdAt.toISOString()}`
    );
  }

  if (!shouldDelete) {
    console.log(
      "\nRun with --delete to remove these users so they can re-register."
    );
    return;
  }

  console.log("\nDeleting orphaned users...");
  for (const u of orphaned) {
    await prisma.session.deleteMany({ where: { userId: u.id } });
    await prisma.ticketMessage.deleteMany({ where: { senderId: u.id } });
    await prisma.ticket.deleteMany({ where: { userId: u.id } });
    await prisma.subscription.deleteMany({ where: { userId: u.id } });
    await prisma.user.delete({ where: { id: u.id } });
    console.log(`  Deleted ${u.email}`);
  }
  console.log(`\nDeleted ${orphaned.length} orphaned user(s). They can now re-register.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
