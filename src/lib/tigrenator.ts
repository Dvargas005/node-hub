const TIGRENATOR_URL = process.env.TIGRENATOR_API_URL || "https://tigrenator.com/api";
const TIGRENATOR_KEY = process.env.TIGRENATOR_API_KEY || "";

const NODE_DEFAULTS = {
  country: "VE",
  clientSize: "Emprendimiento",
  urgency: "Normal",
  currency: "USD",
  workMode: "Remoto",
  language: "Español",
  revisions: "Ilimitadas",
  experience: "Semi-senior",
  rights: "Uso comercial",
};

const TIGRENATOR_CATEGORIES = {
  DESIGN: ["branding designer", "graphic designer", "uxui designer"],
  MARKETING: ["social media manager", "SEO/SEM/ASO", "inbound"],
  WEB: ["front end"],
};

export async function getTigrenatorPricing(service: string, overrides?: Record<string, string>) {
  try {
    const params = new URLSearchParams({ ...NODE_DEFAULTS, ...overrides, service });
    const res = await fetch(`${TIGRENATOR_URL}/pricing?${params}`, {
      headers: TIGRENATOR_KEY ? { "X-API-Key": TIGRENATOR_KEY } : {},
      next: { revalidate: 43200 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getTigrenatorBulkPricing(services: string[]) {
  try {
    const params = new URLSearchParams({ ...NODE_DEFAULTS, services: services.join(",") });
    const res = await fetch(`${TIGRENATOR_URL}/pricing/bulk?${params}`, {
      headers: TIGRENATOR_KEY ? { "X-API-Key": TIGRENATOR_KEY } : {},
      next: { revalidate: 43200 },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function getTigrenatorServices() {
  try {
    const res = await fetch(`${TIGRENATOR_URL}/services`, {
      headers: TIGRENATOR_KEY ? { "X-API-Key": TIGRENATOR_KEY } : {},
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const allCategories = Object.values(TIGRENATOR_CATEGORIES).flat();
    return (data.services || data || []).filter((s: any) =>
      allCategories.some((cat: any) => s.category?.toLowerCase().includes(cat.toLowerCase()))
    );
  } catch {
    return [];
  }
}

export { TIGRENATOR_CATEGORIES, NODE_DEFAULTS };
