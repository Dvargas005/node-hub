import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { DeliveriesClient } from "./deliveries-client";

export const dynamic = "force-dynamic";

export default async function FreelancerDeliveriesPage() {
  const session = await requireRole(["FREELANCER"]);

  const freelancer = await db.freelancer.findUnique({
    where: { userId: session.user.id },
  });

  if (!freelancer) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-[rgba(245,246,252,0.5)] text-lg">
          Perfil de freelancer no encontrado.
        </p>
      </div>
    );
  }

  const deliveries = await db.delivery.findMany({
    where: { ticket: { freelancerId: freelancer.id } },
    include: {
      ticket: {
        select: {
          id: true,
          number: true,
          variant: { include: { service: { select: { name: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = deliveries.map((d: any) => ({
    id: d.id,
    ticketId: d.ticket.id,
    ticketNumber: d.ticket.number,
    serviceName: d.ticket.variant.service.name,
    round: d.round,
    status: d.status,
    fileUrl: d.fileUrl,
    fileName: d.fileName,
    createdAt: d.createdAt.toISOString(),
  }));

  return <DeliveriesClient deliveries={serialized} />;
}
