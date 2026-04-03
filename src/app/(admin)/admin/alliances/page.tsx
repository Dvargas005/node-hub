import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { AlliancesClient } from "./alliances-client";

export const dynamic = "force-dynamic";

export default async function AdminAlliancesPage() {
  await requireRole(["ADMIN", "PM"]);

  const alliances = await db.alliance.findMany({
    include: {
      _count: { select: { referredClients: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AlliancesClient
      alliances={alliances.map((a: any) => ({
        id: a.id,
        name: a.name,
        code: a.code,
        discountPercent: a.discountPercent,
        bonusCredits: a.bonusCredits,
        revenueShare: a.revenueShare,
        referredCount: a._count.referredClients,
        isActive: a.isActive,
        contactName: a.contactName,
        contactEmail: a.contactEmail,
      }))}
    />
  );
}
