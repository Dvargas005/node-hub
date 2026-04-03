import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { redirect } from "next/navigation";
import { OnboardingClient } from "./onboarding-client";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await requireAuth();

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      businessName: true,
      onboardingCompleted: true,
    },
  });

  if (user?.onboardingCompleted) {
    redirect("/dashboard");
  }

  return (
    <OnboardingClient initialBusinessName={user?.businessName || ""} />
  );
}
