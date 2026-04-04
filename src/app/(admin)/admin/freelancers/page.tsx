import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { FreelancersClient } from "./freelancers-client";

export const dynamic = "force-dynamic";

export default async function AdminFreelancersPage() {
  const session = await requireRole(["ADMIN", "PM"]);
  const userRole = (session.user as Record<string, unknown>).role as string;
  const isAdmin = userRole === "ADMIN";

  const freelancers = await db.freelancer.findMany({
    include: { pm: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <FreelancersClient
      showSalary={isAdmin}
      isAdmin={isAdmin}
      freelancers={freelancers.map((f: any) => ({
        id: f.id,
        name: f.name,
        email: f.email,
        role: f.role,
        skills: f.skills,
        skillTags: f.skillTags,
        monthlySalary: isAdmin ? f.monthlySalary : null,
        currentLoad: f.currentLoad,
        clientCapacity: f.clientCapacity,
        availability: f.availability,
        pmName: f.pm.name,
        phone: f.phone ?? undefined,
        telegramId: f.telegramId ?? undefined,
        bio: f.bio ?? undefined,
        portfolioUrl: f.portfolioUrl ?? undefined,
        timezone: f.timezone ?? undefined,
        tempPassword: isAdmin ? (f.tempPassword ?? null) : null,
      }))}
    />
  );
}
