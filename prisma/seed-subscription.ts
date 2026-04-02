import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findFirst({ where: { role: "CLIENT" } });
  const plan = await prisma.plan.findFirst({ where: { slug: "growth" } });
  if (!user || !plan) { console.log("No user or plan found"); return; }

  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      planId: plan.id,
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30*24*60*60*1000),
      creditsRemaining: plan.monthlyCredits,
    },
    update: {
      creditsRemaining: plan.monthlyCredits,
      status: "ACTIVE",
    }
  });
  console.log("Done - subscription created for", user.email);
}
main().then(() => process.exit(0));
