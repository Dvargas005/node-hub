import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const KEEP_EMAILS = [
  "dvargas.taita@gmail.com",
  "erich.betancourt@gmail.com",
  "litopb@gmail.com",
];

async function main() {
  console.log("=== Cleanup Test Users ===\n");
  console.log("Conservando:", KEEP_EMAILS.join(", "));

  const toDelete = await prisma.user.findMany({
    where: { email: { notIn: KEEP_EMAILS } },
    select: { id: true, email: true, role: true },
  });

  if (toDelete.length === 0) {
    console.log("\nNo hay usuarios para borrar.");
    return;
  }

  console.log(`\nEliminando ${toDelete.length} usuarios:\n`);

  for (const user of toDelete) {
    console.log(`  Borrando ${user.email} (${user.role})...`);
    const uid = user.id;

    // Delete notifications
    await prisma.notification.deleteMany({ where: { userId: uid } });

    // Delete ticket messages sent by this user
    await prisma.ticketMessage.deleteMany({ where: { senderId: uid } });

    // Delete deliveries from tickets owned by this user
    const userTickets = await prisma.ticket.findMany({ where: { userId: uid }, select: { id: true } });
    const ticketIds = userTickets.map((t: any) => t.id);
    if (ticketIds.length > 0) {
      await prisma.ticketSurcharge.deleteMany({ where: { ticketId: { in: ticketIds } } });
      await prisma.delivery.deleteMany({ where: { ticketId: { in: ticketIds } } });
      await prisma.ticketMessage.deleteMany({ where: { ticketId: { in: ticketIds } } });
      await prisma.ticketFile.deleteMany({ where: { ticketId: { in: ticketIds } } });
    }

    // Delete tickets
    await prisma.ticket.deleteMany({ where: { userId: uid } });

    // Delete subscription
    await prisma.subscription.deleteMany({ where: { userId: uid } });

    // Delete wizard conversations
    await prisma.wizardConversation.deleteMany({ where: { userId: uid } });

    // Delete freelancer profile if linked
    await prisma.freelancer.deleteMany({ where: { userId: uid } });

    // Delete sessions + accounts
    await prisma.session.deleteMany({ where: { userId: uid } });
    await prisma.account.deleteMany({ where: { userId: uid } });

    // Delete user
    await prisma.user.delete({ where: { id: uid } });
  }

  const kept = await prisma.user.count();
  console.log(`\nLimpieza completa. ${toDelete.length} usuarios eliminados. ${kept} conservados.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
