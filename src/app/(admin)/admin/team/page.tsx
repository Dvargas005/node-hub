import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { TeamClient } from "./team-client";

export const dynamic = "force-dynamic";

export default async function AdminTeamPage() {
  await requireRole(["ADMIN"]);

  const team = await db.user.findMany({
    where: { role: { in: ["PM", "ADMIN"] } },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      timezone: true,
      calendlyUrl: true,
      createdAt: true,
      _count: { select: { pmClients: true, managedFreelancers: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <TeamClient
      team={team.map((m: any) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role,
        phone: m.phone,
        timezone: m.timezone,
        calendlyUrl: m.calendlyUrl || null,
        createdAt: m.createdAt.toISOString(),
        clientCount: m._count.pmClients,
        freelancerCount: m._count.managedFreelancers,
      }))}
    />
  );
}
