/**
 * Detect and clean up orphaned users — users without an Account record.
 *
 * These users were created but Better Auth has no credential entry for them,
 * so they cannot log in.
 *
 * Usage:
 *   npx tsx scripts/fix-orphaned-users.ts          # list only
 *   npx tsx scripts/fix-orphaned-users.ts --delete  # list + delete
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
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
  const { count } = await prisma.user.deleteMany({
    where: { id: { in: orphaned.map((u) => u.id) } },
  });
  console.log(`Deleted ${count} orphaned user(s). They can now re-register.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
