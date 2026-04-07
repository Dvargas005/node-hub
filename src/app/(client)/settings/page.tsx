import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { SettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireAuth();
  const userId = session.user.id;

  const [user, subscription] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        businessName: true,
        businessIndustry: true,
        businessDescription: true,
        targetAudience: true,
        hasBranding: true,
        brandColors: true,
        brandStyle: true,
        website: true,
        socialMedia: true,
        freeCredits: true,
        language: true,
        deliveryLanguage: true,
        phone: true,
        whatsappNumber: true,
        telegramId: true,
        linkedinUrl: true,
        instagramHandle: true,
        preferredContact: true,
      },
    }),
    db.subscription.findUnique({
      where: { userId },
      select: { creditsRemaining: true },
    }),
  ]);

  const totalCredits =
    (user?.freeCredits || 0) + (subscription?.creditsRemaining || 0);

  return (
    <SettingsClient
      profile={{
        businessName: user?.businessName || "",
        businessIndustry: user?.businessIndustry || "",
        businessDescription: user?.businessDescription || "",
        targetAudience: user?.targetAudience || "",
        hasBranding: user?.hasBranding,
        brandColors: user?.brandColors || "",
        brandStyle: user?.brandStyle || "",
        website: user?.website || "",
        socialMedia: (user?.socialMedia as Record<string, string>) || {},
        language: user?.language || "es",
        deliveryLanguage: user?.deliveryLanguage || "es",
        phone: user?.phone || "",
        whatsappNumber: user?.whatsappNumber || "",
        telegramId: user?.telegramId || "",
        linkedinUrl: user?.linkedinUrl || "",
        instagramHandle: user?.instagramHandle || "",
        preferredContact: user?.preferredContact || "email",
      }}
      totalCredits={totalCredits}
    />
  );
}
