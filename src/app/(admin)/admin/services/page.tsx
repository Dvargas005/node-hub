import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { ServicesClient } from "./services-client";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  const session = await requireRole(["ADMIN", "PM"]);
  const role = (session.user as Record<string, unknown>).role as string;
  const isAdmin = role === "ADMIN";

  const services = await db.service.findMany({
    include: {
      variants: {
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <ServicesClient
      isAdmin={isAdmin}
      services={services.map((s: any) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        category: s.category,
        description: s.description,
        longDescription: s.longDescription,
        icon: s.icon,
        tags: s.tags,
        sortOrder: s.sortOrder,
        isActive: s.isActive,
        variants: s.variants.map((v: any) => ({
          id: v.id,
          name: v.name,
          creditCost: v.creditCost,
          description: v.description,
          estimatedDays: v.estimatedDays,
          minPlan: v.minPlan,
          isPopular: v.isPopular,
          isNew: v.isNew,
          isActive: v.isActive,
          sortOrder: v.sortOrder,
        })),
      }))}
    />
  );
}
