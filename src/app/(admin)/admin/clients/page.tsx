import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { ClientsClient } from "./clients-client";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  await requireRole(["ADMIN", "PM"]);

  const [clients, plans] = await Promise.all([
    db.user.findMany({
      where: { role: "CLIENT" },
      include: {
        subscription: { include: { plan: true } },
        referredBy: { select: { name: true, code: true } },
        _count: {
          select: {
            tickets: {
              where: { status: { notIn: ["COMPLETED", "CANCELED"] } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.plan.findMany({ where: { isActive: true }, orderBy: { priceMonthly: "asc" } }),
  ]);

  return (
    <ClientsClient
      clients={clients.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        businessName: c.businessName,
        planName: c.subscription?.plan.name || null,
        planSlug: c.subscription?.plan.slug || null,
        creditsRemaining: c.subscription?.creditsRemaining ?? null,
        monthlyCredits: c.subscription?.plan.monthlyCredits ?? null,
        activeTickets: c._count.tickets,
        allianceName: c.referredBy?.name || null,
        allianceCode: c.referredBy?.code || null,
        createdAt: c.createdAt.toISOString(),
      }))}
      plans={plans.map((p) => ({ slug: p.slug, name: p.name }))}
    />
  );
}
