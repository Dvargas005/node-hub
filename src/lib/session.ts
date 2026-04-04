import { auth } from "./auth";
import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireRole(roles: string[]) {
  const session = await requireAuth();
  const realRole = (session.user as Record<string, unknown>).role as string;

  // ADMIN with view-as cookie can access any role's pages
  if (realRole === "ADMIN") {
    const cookieStore = await cookies();
    const viewAs = cookieStore.get("node-view-as-role")?.value;
    if (viewAs && roles.includes(viewAs)) {
      return session;
    }
    // ADMIN always has access to ADMIN/PM pages, and if no viewAs just allow
    if (roles.includes("ADMIN") || roles.includes("PM")) {
      return session;
    }
  }

  if (!roles.includes(realRole)) {
    redirect("/dashboard");
  }
  return session;
}

/** Check if current request is an ADMIN impersonating another role */
export async function getViewAsRole(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("node-view-as-role")?.value || null;
}
