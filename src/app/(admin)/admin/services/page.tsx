import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { ServicesClient } from "./services-client";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  await requireRole(["ADMIN", "PM"]);

  const services = await db.service.findMany({
    where: { isActive: true },
    include: {
      variants: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <ServicesClient
      services={services.map((s: any) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        description: s.description,
        tags: s.tags,
        variants: s.variants.map((v: any) => ({
          id: v.id,
          name: v.name,
          creditCost: v.creditCost,
          description: v.description,
          estimatedDays: v.estimatedDays,
          minPlan: v.minPlan,
          isPopular: v.isPopular,
          isNew: v.isNew,
        })),
      }))}
    />
  );
}
