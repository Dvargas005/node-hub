/**
 * Real service catalog seed — pricing benchmarked against Tigrenator
 * (Venezuela "Emprendimiento" tier, semi-senior, remote, unlimited revisions).
 *
 * Rule: N.O.D.E. credit cost ≤ Tigrenator USD price, rounded to multiples of 5.
 * 1 credit = $1 USD.
 *
 * Plan caps:
 *   Member  140 credits/mo · 5 day SLA  → "basic" variants
 *   Growth  350 credits/mo · 3 day SLA  → "standard" variants
 *   Pro     650 credits/mo · 2 day SLA  → "premium" variants
 *
 * Wipes all existing services + variants. Safe only if there are 0 tickets.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

interface VariantSeed {
  name: string;
  creditCost: number;
  description: string;
  estimatedDays: number;
  minPlan: string | null;
  isPopular?: boolean;
  isNew?: boolean;
  sortOrder: number;
}

interface ServiceSeed {
  name: string;
  slug: string;
  category: "DESIGN" | "WEB" | "MARKETING";
  description: string;
  icon: string | null;
  tags: string[];
  sortOrder: number;
  variants: VariantSeed[];
}

const services: ServiceSeed[] = [
  // ═══ DESIGN ═══════════════════════════════════════
  {
    name: "Logo Design",
    slug: "logo-design",
    category: "DESIGN",
    description: "Professional logo design for your brand",
    icon: "palette",
    tags: ["branding", "logo", "identity"],
    sortOrder: 1,
    variants: [
      {
        name: "Basic Logo",
        creditCost: 60,
        description: "2 concepts, clean and simple. PNG/SVG/PDF export.",
        estimatedDays: 3,
        minPlan: null,
        isPopular: true,
        sortOrder: 1,
      },
      {
        name: "Brand Starter",
        creditCost: 120,
        description: "Logo + color palette + typography + 1-page brand sheet.",
        estimatedDays: 5,
        minPlan: null,
        sortOrder: 2,
      },
      {
        name: "Full Brand Identity",
        creditCost: 250,
        description: "Logo, palette, typography, mini brand book, business card and 3 social templates.",
        estimatedDays: 7,
        minPlan: "growth",
        isNew: true,
        sortOrder: 3,
      },
    ],
  },
  {
    name: "Social Media Kit",
    slug: "social-media-kit",
    category: "DESIGN",
    description: "Branded templates and graphics for social media",
    icon: "instagram",
    tags: ["social", "instagram", "templates"],
    sortOrder: 2,
    variants: [
      {
        name: "Template Pack",
        creditCost: 80,
        description: "10 editable post templates (Canva or Figma) in your brand style.",
        estimatedDays: 3,
        minPlan: null,
        isPopular: true,
        sortOrder: 1,
      },
      {
        name: "Full Social Kit",
        creditCost: 180,
        description: "20 templates + story templates + highlight covers + bio header.",
        estimatedDays: 5,
        minPlan: "growth",
        sortOrder: 2,
      },
    ],
  },
  {
    name: "Print Design",
    slug: "print-design",
    category: "DESIGN",
    description: "Flyers, business cards and marketing collateral",
    icon: "file-text",
    tags: ["print", "flyer", "card", "brochure"],
    sortOrder: 3,
    variants: [
      {
        name: "Single Piece",
        creditCost: 70,
        description: "One print piece: flyer, business card, poster or postcard. Print-ready PDF.",
        estimatedDays: 2,
        minPlan: null,
        isPopular: true,
        sortOrder: 1,
      },
      {
        name: "Marketing Collateral Pack",
        creditCost: 180,
        description: "3 coordinated pieces (e.g. flyer + card + poster) with consistent branding.",
        estimatedDays: 5,
        minPlan: "growth",
        sortOrder: 2,
      },
    ],
  },
  {
    name: "Illustration",
    slug: "illustration",
    category: "DESIGN",
    description: "Custom illustrations and graphic assets",
    icon: "pen-tool",
    tags: ["illustration", "artwork", "graphics"],
    sortOrder: 4,
    variants: [
      {
        name: "Simple Illustration",
        creditCost: 70,
        description: "One custom illustration: spot art, character or icon. Vector + PNG.",
        estimatedDays: 3,
        minPlan: null,
        sortOrder: 1,
      },
      {
        name: "Custom Illustration Pack",
        creditCost: 200,
        description: "3 cohesive illustrations in the same style. Source files included.",
        estimatedDays: 5,
        minPlan: "growth",
        sortOrder: 2,
      },
    ],
  },
  {
    name: "Presentation Design",
    slug: "presentation-design",
    category: "DESIGN",
    description: "Pitch decks and corporate presentations",
    icon: "presentation",
    tags: ["pitch", "deck", "presentation", "slides"],
    sortOrder: 5,
    variants: [
      {
        name: "Pitch Deck",
        creditCost: 130,
        description: "10 slides, branded, ready to present. PowerPoint + PDF.",
        estimatedDays: 3,
        minPlan: null,
        sortOrder: 1,
      },
      {
        name: "Corporate Presentation",
        creditCost: 280,
        description: "20+ slides with charts, data viz, custom layouts and animations.",
        estimatedDays: 5,
        minPlan: "growth",
        sortOrder: 2,
      },
    ],
  },

  // ═══ WEB ══════════════════════════════════════════
  {
    name: "Landing Page",
    slug: "landing-page",
    category: "WEB",
    description: "High-converting single-page websites",
    icon: "layout",
    tags: ["landing", "web", "conversion"],
    sortOrder: 1,
    variants: [
      {
        name: "Basic Landing",
        creditCost: 100,
        description: "Single-section landing with hero, features, contact form. Mobile responsive.",
        estimatedDays: 4,
        minPlan: null,
        isPopular: true,
        sortOrder: 1,
      },
      {
        name: "Advanced Landing with SEO",
        creditCost: 220,
        description: "Multi-section landing, SEO meta + structured data, performance optimized, analytics.",
        estimatedDays: 6,
        minPlan: null,
        sortOrder: 2,
      },
    ],
  },
  {
    name: "Business Website",
    slug: "business-website",
    category: "WEB",
    description: "Multi-page websites for businesses",
    icon: "globe",
    tags: ["website", "business", "wordpress"],
    sortOrder: 2,
    variants: [
      {
        name: "Single Page Site",
        creditCost: 200,
        description: "Single-page site with multiple sections, contact form and basic SEO.",
        estimatedDays: 5,
        minPlan: null,
        sortOrder: 1,
      },
      {
        name: "Multi-page Website",
        creditCost: 350,
        description: "3–5 page site (home, about, services, contact). CMS optional.",
        estimatedDays: 7,
        minPlan: "growth",
        isNew: true,
        sortOrder: 2,
      },
    ],
  },
  {
    name: "E-commerce",
    slug: "ecommerce",
    category: "WEB",
    description: "Online stores with payment integration",
    icon: "shopping-cart",
    tags: ["shop", "store", "ecommerce", "shopify"],
    sortOrder: 3,
    variants: [
      {
        name: "Basic Store",
        creditCost: 400,
        description: "Up to 20 products, payment gateway, basic checkout. Shopify or WooCommerce.",
        estimatedDays: 8,
        minPlan: "growth",
        sortOrder: 1,
      },
      {
        name: "Full Store",
        creditCost: 600,
        description: "Unlimited products, advanced checkout, integrations (CRM/email), custom theme.",
        estimatedDays: 10,
        minPlan: "pro",
        sortOrder: 2,
      },
    ],
  },
  {
    name: "Web Forms & Tools",
    slug: "web-forms",
    category: "WEB",
    description: "Contact forms and custom web utilities",
    icon: "clipboard",
    tags: ["form", "tool", "contact"],
    sortOrder: 4,
    variants: [
      {
        name: "Contact Form",
        creditCost: 50,
        description: "Branded contact form with email delivery. Embeddable anywhere.",
        estimatedDays: 2,
        minPlan: null,
        sortOrder: 1,
      },
      {
        name: "Custom Web Tool",
        creditCost: 250,
        description: "Custom calculator, quote generator, booking widget or similar utility.",
        estimatedDays: 6,
        minPlan: "growth",
        sortOrder: 2,
      },
    ],
  },
  {
    name: "Google & Local Presence",
    slug: "google-local-presence",
    category: "WEB",
    description: "Google Business Profile and local SEO",
    icon: "map-pin",
    tags: ["google", "local", "seo", "business profile"],
    sortOrder: 5,
    variants: [
      {
        name: "Google Business Setup",
        creditCost: 60,
        description: "Full GBP setup: categories, services, photos, hours, posts and Q&A seed.",
        estimatedDays: 2,
        minPlan: null,
        isPopular: true,
        sortOrder: 1,
      },
      {
        name: "Local SEO Pack",
        creditCost: 150,
        description: "GBP optimization + 10 citation listings + local schema markup + review strategy.",
        estimatedDays: 4,
        minPlan: null,
        sortOrder: 2,
      },
    ],
  },

  // ═══ MARKETING ════════════════════════════════════
  {
    name: "Content Pack",
    slug: "content-pack",
    category: "MARKETING",
    description: "Ready-to-publish social media content",
    icon: "image",
    tags: ["content", "posts", "social"],
    sortOrder: 1,
    variants: [
      {
        name: "4 Posts",
        creditCost: 80,
        description: "4 branded posts with copy + hashtags. Ready to schedule.",
        estimatedDays: 3,
        minPlan: null,
        isPopular: true,
        sortOrder: 1,
      },
      {
        name: "8 Posts",
        creditCost: 140,
        description: "8 branded posts with copy + hashtags + 2 carousel ideas.",
        estimatedDays: 4,
        minPlan: null,
        sortOrder: 2,
      },
      {
        name: "12 Posts + Stories",
        creditCost: 240,
        description: "12 feed posts + 6 story templates + content calendar.",
        estimatedDays: 6,
        minPlan: "growth",
        sortOrder: 3,
      },
    ],
  },
  {
    name: "Social Media Management",
    slug: "social-media-management",
    category: "MARKETING",
    description: "Full social media management service",
    icon: "users",
    tags: ["social", "management", "monthly"],
    sortOrder: 2,
    variants: [
      {
        name: "Basic Management",
        creditCost: 180,
        description: "1 month: scheduling + community responses + monthly report. Content from your library.",
        estimatedDays: 30,
        minPlan: "growth",
        sortOrder: 1,
      },
      {
        name: "Full Management",
        creditCost: 350,
        description: "1 month: strategy + content creation (12 posts) + scheduling + community + monthly report.",
        estimatedDays: 30,
        minPlan: "growth",
        sortOrder: 2,
      },
    ],
  },
  {
    name: "SEO",
    slug: "seo",
    category: "MARKETING",
    description: "Search engine optimization services",
    icon: "search",
    tags: ["seo", "search", "google", "ranking"],
    sortOrder: 3,
    variants: [
      {
        name: "SEO Audit",
        creditCost: 100,
        description: "Full technical and on-page audit with prioritized action plan.",
        estimatedDays: 3,
        minPlan: null,
        sortOrder: 1,
      },
      {
        name: "SEO Foundation",
        creditCost: 200,
        description: "Audit + on-page fixes + meta tags + sitemap + 5 keyword targets.",
        estimatedDays: 5,
        minPlan: null,
        isNew: true,
        sortOrder: 2,
      },
      {
        name: "Ongoing SEO",
        creditCost: 400,
        description: "1 month: technical maintenance + 2 optimized blog posts + backlink outreach + monthly report.",
        estimatedDays: 30,
        minPlan: "growth",
        sortOrder: 3,
      },
    ],
  },
  {
    name: "Marketing Campaign",
    slug: "marketing-campaign",
    category: "MARKETING",
    description: "Promotional campaigns for launches and events",
    icon: "megaphone",
    tags: ["campaign", "launch", "promo"],
    sortOrder: 4,
    variants: [
      {
        name: "Organic Campaign",
        creditCost: 150,
        description: "3-week organic campaign: 6 posts + 6 stories + email + landing copy.",
        estimatedDays: 5,
        minPlan: null,
        sortOrder: 1,
      },
      {
        name: "Paid Campaign Setup",
        creditCost: 250,
        description: "Meta or Google Ads setup: audiences, creatives (3 variants), copy, conversion tracking. Ad spend NOT included.",
        estimatedDays: 5,
        minPlan: "growth",
        sortOrder: 2,
      },
    ],
  },
  {
    name: "Email Marketing",
    slug: "email-marketing",
    category: "MARKETING",
    description: "Email templates and campaigns",
    icon: "mail",
    tags: ["email", "newsletter", "automation"],
    sortOrder: 5,
    variants: [
      {
        name: "Template + Setup",
        creditCost: 80,
        description: "Branded email template + ESP setup (Mailchimp or similar) + welcome email.",
        estimatedDays: 3,
        minPlan: null,
        sortOrder: 1,
      },
      {
        name: "Full Campaign",
        creditCost: 250,
        description: "5-email campaign with copy + automation flow + segmentation + reporting.",
        estimatedDays: 7,
        minPlan: "growth",
        sortOrder: 2,
      },
    ],
  },
  {
    name: "WhatsApp Business",
    slug: "whatsapp-business",
    category: "MARKETING",
    description: "WhatsApp Business setup and automation",
    icon: "message-circle",
    tags: ["whatsapp", "messaging", "chatbot"],
    sortOrder: 6,
    variants: [
      {
        name: "Setup",
        creditCost: 60,
        description: "WhatsApp Business profile setup with catalog, greetings and business hours.",
        estimatedDays: 2,
        minPlan: null,
        sortOrder: 1,
      },
      {
        name: "Setup + Auto-responses",
        creditCost: 150,
        description: "Full setup + 5 quick replies + greeting/away messages + catalog with up to 10 products.",
        estimatedDays: 4,
        minPlan: "growth",
        sortOrder: 2,
      },
    ],
  },
];

async function main() {
  console.log("🌱 Seeding service catalog (Tigrenator-benchmarked)...\n");

  // Wipe existing
  const variantsBefore = await prisma.serviceVariant.count();
  const servicesBefore = await prisma.service.count();
  await prisma.serviceVariant.deleteMany({});
  await prisma.service.deleteMany({});
  console.log(`🗑  Wiped ${servicesBefore} services and ${variantsBefore} variants.\n`);

  let totalVariants = 0;
  for (const s of services) {
    const { variants, ...serviceData } = s;
    const service = await prisma.service.create({ data: serviceData });
    for (const v of variants) {
      await prisma.serviceVariant.create({
        data: {
          ...v,
          serviceId: service.id,
          isActive: true,
          isPopular: v.isPopular || false,
          isNew: v.isNew || false,
        },
      });
      totalVariants++;
    }
    console.log(
      `✅ ${s.category.padEnd(9)} ${s.name.padEnd(28)} ${variants.length} variants  (${variants.map((v: VariantSeed) => v.creditCost + "cr").join(", ")})`,
    );
  }

  console.log(`\n🎉 Done. ${services.length} services, ${totalVariants} variants.`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("ERROR:", err);
  process.exit(1);
});
