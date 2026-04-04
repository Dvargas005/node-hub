import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { SyncClient } from "./sync-client";

export const dynamic = "force-dynamic";

export default async function SyncPage() {
  const session = await requireRole(["ADMIN"]);
  const reports = await db.syncReport.findMany({ orderBy: { createdAt: "desc" }, take: 10 });
  return <SyncClient reports={reports.map((r: any) => ({ id: r.id, data: r.data, appliedAt: r.appliedAt?.toISOString() || null, createdAt: r.createdAt.toISOString() }))} />;
}
