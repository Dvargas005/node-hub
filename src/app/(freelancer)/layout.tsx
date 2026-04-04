import { cookies } from "next/headers";
import { requireAuth } from "@/lib/session";
import { redirect } from "next/navigation";
import { FreelancerShell } from "./freelancer-shell";

export default async function FreelancerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();
  const realRole = (session.user as Record<string, unknown>).role as string;
  const cookieStore = await cookies();
  const viewAs = cookieStore.get("node-view-as-role")?.value;

  const canAccess = realRole === "FREELANCER" || (realRole === "ADMIN" && viewAs === "FREELANCER");
  if (!canAccess) redirect("/dashboard");

  return <FreelancerShell>{children}</FreelancerShell>;
}
