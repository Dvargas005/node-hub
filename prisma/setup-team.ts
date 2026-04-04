import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// This script does NOT create users — they register via /register.
// It only promotes existing users to ADMIN.

async function main() {
  console.log("=== N.O.D.E. Team Setup ===\n");

  const admins = [
    "dvargas.taita@gmail.com",
    "erich.betancourt@gmail.com",
  ];

  for (const email of admins) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.user.update({
        where: { email },
        data: { role: "ADMIN", onboardingCompleted: true },
      });
      console.log(`  ${email} -> ADMIN`);
    } else {
      console.log(`  ${email} no existe. Registrate primero en /register y luego corre este script.`);
    }
  }

  console.log("\n=== Done! ===");
}

main().then(() => process.exit(0)).catch(console.error);
