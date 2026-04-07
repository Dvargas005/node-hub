import { db } from "@/lib/db";

/**
 * Verify that the current viewer is allowed to message the target user.
 *
 * Rules:
 * - CLIENT may only message their assigned PM (`assignedPmId`).
 * - PM/ADMIN may only message clients assigned to them.
 *   ADMIN bypasses the assignment check (can message any user).
 *
 * Returns the related user record on success, or null if the relationship is not allowed.
 */
export async function verifyMessageRelationship(
  viewerId: string,
  viewerRole: string,
  targetUserId: string,
): Promise<{ id: string; name: string; email: string; role: string; businessName: string | null } | null> {
  if (viewerId === targetUserId) return null;

  if (viewerRole === "CLIENT") {
    // CLIENT viewing → target must be their assigned PM
    const me = await db.user.findUnique({
      where: { id: viewerId },
      select: { assignedPmId: true },
    });
    if (!me?.assignedPmId || me.assignedPmId !== targetUserId) return null;

    const pm = await db.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, email: true, role: true, businessName: true },
    });
    if (!pm) return null;
    if (pm.role !== "PM" && pm.role !== "ADMIN") return null;
    return pm;
  }

  if (viewerRole === "PM" || viewerRole === "ADMIN") {
    const target = await db.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, email: true, role: true, businessName: true, assignedPmId: true },
    });
    if (!target) return null;

    // ADMIN bypass: can talk to anyone
    if (viewerRole === "ADMIN") {
      return {
        id: target.id,
        name: target.name,
        email: target.email,
        role: target.role,
        businessName: target.businessName,
      };
    }

    // PM: target must be a client assigned to viewer
    if (target.role !== "CLIENT") return null;
    if (target.assignedPmId !== viewerId) return null;
    return {
      id: target.id,
      name: target.name,
      email: target.email,
      role: target.role,
      businessName: target.businessName,
    };
  }

  return null;
}
