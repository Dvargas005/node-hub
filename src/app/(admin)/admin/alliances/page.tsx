import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { AlliancesClient } from "./alliances-client";

export const dynamic = "force-dynamic";

export default async function AdminAlliancesPage() {
  const session = await requireRole(["ADMIN", "PM"]);
  const userRole = (session.user as Record<string, unknown>).role as string;
  const isAdmin = userRole === "ADMIN";

  const alliances = await db.alliance.findMany({
    include: {
      _count: { select: { referredClients: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AlliancesClient
      isAdmin={isAdmin}
      alliances={alliances.map((a: any) => ({
        id: a.id,
        name: a.name,
        slug: a.slug,
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
