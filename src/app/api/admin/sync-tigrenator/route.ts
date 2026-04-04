import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { getTigrenatorServices, getTigrenatorBulkPricing } from "@/lib/tigrenator";

const slugToTigrenator: Record<string, string> = {
  "brand-starter": "logo",
  "social-pack": "social media templates",
  "flyer-promo": "flyer",
  "landing-page": "landing page",
  "seo-foundation": "seo",
  "content-pack": "social media content",
  "promo-campaign": "marketing campaign",
  "google-presence": "google business",
  "whatsapp-business": "whatsapp business",
  "contact-form": "web form",
  "profile-setup": "social media setup",
  "business-kit": "business card",
};

export async function POST() {
  const { error } = await requireApiRole(["ADMIN"]);
  if (error) return error;

  try {
    // 1. Fetch Tigrenator services
    const tigrenatorServices = await getTigrenatorServices();

    // 2. Fetch current NODE services from DB
    const nodeServices = await db.service.findMany({
      where: { isActive: true },
      include: { variants: { where: { isActive: true } } },
    });

    // 3. Fetch bulk pricing from Tigrenator for mapped services
    const mappedTigrenatorNames = Object.values(slugToTigrenator);
    const bulkPricing = await getTigrenatorBulkPricing(mappedTigrenatorNames);

    // Build pricing lookup by service name (lowercase)
    const pricingMap: Record<string, any> = {};
    if (Array.isArray(bulkPricing)) {
      for (const item of bulkPricing) {
        const name = (item.service || item.name || "").toLowerCase();
        if (name) pricingMap[name] = item;
      }
    }

    // 4. Compare: if price difference > 20%, add to priceUpdates
    const priceUpdates: any[] = [];
    for (const service of nodeServices) {
      const tigrenatorName = slugToTigrenator[service.slug];
      if (!tigrenatorName) continue;

      const tigPrice = pricingMap[tigrenatorName.toLowerCase()];
      if (!tigPrice) continue;

      const tigrenatorPrice = tigPrice.price || tigPrice.amount || 0;

      for (const variant of service.variants) {
        if (variant.creditCost > 0 && tigrenatorPrice > 0) {
          const diff = Math.abs(variant.creditCost - tigrenatorPrice) / variant.creditCost;
          if (diff > 0.2) {
            priceUpdates.push({
              serviceSlug: service.slug,
              serviceName: service.name,
              variantName: variant.name,
              currentCredits: variant.creditCost,
              tigrenatorPrice,
              diffPercent: Math.round(diff * 100),
            });
          }
        }
      }
    }

    // 5. Find new suggestions: Tigrenator services not mapped, price < 500
    const mappedSet = new Set(mappedTigrenatorNames.map((n: string) => n.toLowerCase()));
    const suggestions: any[] = [];
    if (Array.isArray(tigrenatorServices)) {
      for (const svc of tigrenatorServices) {
        const name = (svc.name || svc.service || "").toLowerCase();
        if (!mappedSet.has(name)) {
          const price = svc.price || svc.amount || 0;
          if (price < 500) {
            suggestions.push({
              name: svc.name || svc.service,
              category: svc.category,
              price,
            });
          }
        }
      }
    }

    // 6. Find unmatched: NODE services without Tigrenator match
    const unmatched: any[] = [];
    for (const service of nodeServices) {
      if (!slugToTigrenator[service.slug]) {
        unmatched.push({
          slug: service.slug,
          name: service.name,
          category: service.category,
        });
      }
    }

    const report = {
      generatedAt: new Date().toISOString(),
      priceUpdates,
      suggestions,
      unmatched,
      totalTigrenatorServices: Array.isArray(tigrenatorServices) ? tigrenatorServices.length : 0,
      totalNodeServices: nodeServices.length,
    };

    // 7. Save report to SyncReport table
    const saved = await db.syncReport.create({
      data: { data: report },
    });

    // 8. Return report
    return NextResponse.json({ id: saved.id, ...report });
  } catch (err: any) {
    console.error("[SYNC_TIGRENATOR]", err);
    return NextResponse.json(
      { error: "Error al sincronizar con Tigrenator" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const { error } = await requireApiRole(["ADMIN"]);
  if (error) return error;

  try {
    const reports = await db.syncReport.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    return NextResponse.json(reports);
  } catch (err: any) {
    console.error("[SYNC_TIGRENATOR_GET]", err);
    return NextResponse.json(
      { error: "Error al obtener reportes de sincronización" },
      { status: 500 }
    );
  }
}
