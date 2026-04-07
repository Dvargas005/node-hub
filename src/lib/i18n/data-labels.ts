// Reverse lookup: given a value stored in ANY language, return the i18n key
// This handles legacy data stored in Spanish/English/Portuguese

const audienceMap: Record<string, string> = {
  // English
  "End consumer (B2C)": "audience.b2c",
  "Consumer (B2C)": "audience.b2c",
  "Businesses (B2B)": "audience.b2b",
  "Both": "audience.both",
  "Families": "audience.families",
  "Professionals": "audience.professionals",
  "Local community": "audience.local",
  "Online / E-commerce": "audience.ecommerce",
  // Spanish
  "Consumidor final (B2C)": "audience.b2c",
  "Empresas (B2B)": "audience.b2b",
  "Ambos": "audience.both",
  "Familias": "audience.families",
  "Profesionistas": "audience.professionals",
  "Comunidad local": "audience.local",
  // Portuguese
  "Famílias": "audience.families",
  "Profissionais": "audience.professionals",
  "Comunidade local": "audience.local",
};

const industryMap: Record<string, string> = {
  // English
  "Food & Bakery": "industry.food",
  "Retail / Store": "industry.retail",
  "Professional Services": "industry.professional",
  "Health & Therapy": "industry.health",
  "Technology": "industry.tech",
  "Education": "industry.education",
  "Events": "industry.events",
  "Construction": "industry.construction",
  "Transportation": "industry.transport",
  "Real Estate": "industry.realestate",
  "Automotive": "industry.automotive",
  "Cleaning & Maintenance": "industry.cleaning",
  "Beauty & Hair": "industry.beauty",
  "Fitness & Gym": "industry.fitness",
  "Legal": "industry.legal",
  "Tourism & Hospitality": "industry.tourism",
  "Agriculture": "industry.agriculture",
  "Other": "industry.other",
  // Spanish
  "Alimentos y Panadería": "industry.food",
  "Retail / Tienda": "industry.retail",
  "Servicios Profesionales": "industry.professional",
  "Salud y Terapia": "industry.health",
  "Tecnología": "industry.tech",
  "Educación": "industry.education",
  "Eventos": "industry.events",
  "Construcción": "industry.construction",
  "Transporte": "industry.transport",
  "Bienes Raíces": "industry.realestate",
  "Automotriz": "industry.automotive",
  "Limpieza y Mantenimiento": "industry.cleaning",
  "Belleza y Peluquería": "industry.beauty",
  "Fitness y Gym": "industry.fitness",
  "Turismo y Hotelería": "industry.tourism",
  "Agricultura": "industry.agriculture",
  "Otro": "industry.other",
};

/** Given a stored value in any language, return the translated version */
export function translateIndustry(value: string, t: (key: string) => string): string {
  const key = industryMap[value];
  return key ? t(key) : value;
}

export function translateAudience(value: string, t: (key: string) => string): string {
  if (!value) return value;
  // Audience can be comma-separated
  return value.split(",").map((v: string) => {
    const trimmed = v.trim();
    const key = audienceMap[trimmed];
    return key ? t(key) : trimmed;
  }).join(", ");
}

export { industryMap, audienceMap };
