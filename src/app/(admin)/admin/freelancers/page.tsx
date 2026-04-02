import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { FreelancersClient } from "./freelancers-client";

export const dynamic = "force-dynamic";

export default async function AdminFreelancersPage() {
  await requireRole(["ADMIN", "PM"]);

  const freelancers = await db.freelancer.findMany({
    include: { pm: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <FreelancersClient
      freelancers={freelancers.map((f) => ({
        id: f.id,
        name: f.name,
        email: f.email,
        role: f.role,
        skills: f.skills,
        skillTags: f.skillTags,
        monthlySalary: f.monthlySalary,
        currentLoad: f.currentLoad,
        clientCapacity: f.clientCapacity,
        availability: f.availability,
        pmName: f.pm.name,
      }))}
    />
  );
}
