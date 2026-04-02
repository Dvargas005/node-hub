"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user) return;
    const user = session.user as Record<string, unknown>;
    if (
      user.role === "CLIENT" &&
      user.onboardingCompleted === false &&
      pathname !== "/onboarding"
    ) {
      router.replace("/onboarding");
    }
  }, [session, pathname, router]);

  return <>{children}</>;
}
