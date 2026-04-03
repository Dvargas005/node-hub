import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { TicketsClient } from "./tickets-client";

export const dynamic = "force-dynamic";

export default async function TicketsPage() {
  const session = await requireAuth();

  const tickets = await db.ticket.findMany({
    where: { userId: session.user.id },
    include: {
      variant: { include: { service: true } },
      freelancer: { select: { name: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <TicketsClient
      tickets={tickets.map((t: any) => ({
        id: t.id,
        number: t.number,
        serviceName: t.variant.service.name,
        serviceCategory: t.variant.service.category,
        variantName: t.variant.name,
        status: t.status,
        creditsCharged: t.creditsCharged,
        summary:
          (t.briefStructured as Record<string, unknown>)?.summary as string ||
          t.clientNotes ||
          null,
        freelancerName: t.freelancer?.name || null,
        freelancerRole: t.freelancer?.role || null,
        createdAt: t.createdAt.toISOString(),
      }))}
    />
  );
}
