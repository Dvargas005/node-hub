import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── PLANES ─────────────────────────────────────────
  const member = await prisma.plan.upsert({
    where: { slug: "member" },
    update: {},
    create: {
      name: "Member",
      slug: "member",
      priceMonthly: 10000, // $100
      setupFee: 20000, // $200
      monthlyCredits: 140,
      maxActiveReqs: 1,
      deliveryDays: 5,
    },
  });

  const growth = await prisma.plan.upsert({
    where: { slug: "growth" },
    update: {},
    create: {
      name: "Growth",
      slug: "growth",
      priceMonthly: 19000, // $190
      setupFee: 70000, // $700
      monthlyCredits: 350,
      maxActiveReqs: 2,
      deliveryDays: 3,
    },
  });

  const pro = await prisma.plan.upsert({
    where: { slug: "pro" },
    update: {},
    create: {
      name: "Pro",
      slug: "pro",
      priceMonthly: 33000, // $330
      setupFee: 100000, // $1000
      monthlyCredits: 650,
      maxActiveReqs: 999,
      deliveryDays: 2,
    },
  });

  console.log("✅ Plans:", member.name, growth.name, pro.name);

  // ─── CATÁLOGO DE SERVICIOS ──────────────────────────

  // DESIGN SERVICES
  const logoDesign = await prisma.service.upsert({
    where: { slug: "logo-design" },
    update: {},
    create: {
      name: "Diseño de Logo",
      slug: "logo-design",
      category: "DESIGN",
      description: "Logo profesional para tu marca con variantes y archivos editables.",
      icon: "Palette",
      sortOrder: 1,
      tags: ["branding", "identidad", "logo"],
    },
  });

  await prisma.serviceVariant.createMany({
    skipDuplicates: true,
    data: [
      {
        serviceId: logoDesign.id,
        name: "Logo Básico",
        creditCost: 30,
        description: "1 concepto, 2 revisiones, archivos PNG/SVG.",
        estimatedDays: 3,
        sortOrder: 1,
        isPopular: true,
      },
      {
        serviceId: logoDesign.id,
        name: "Logo Premium",
        creditCost: 60,
        description: "3 conceptos, revisiones ilimitadas, brand guidelines básicas.",
        estimatedDays: 5,
        minPlan: "growth",
        sortOrder: 2,
      },
      {
        serviceId: logoDesign.id,
        name: "Logo + Branding Kit",
        creditCost: 120,
        description: "Logo completo + paleta de colores, tipografía, tarjetas de presentación.",
        estimatedDays: 7,
        minPlan: "pro",
        sortOrder: 3,
        isNew: true,
      },
    ],
  });

  const socialMedia = await prisma.service.upsert({
    where: { slug: "social-media-design" },
    update: {},
    create: {
      name: "Diseño para Redes Sociales",
      slug: "social-media-design",
      category: "DESIGN",
      description: "Posts, stories, banners y templates para tus redes sociales.",
      icon: "Image",
      sortOrder: 2,
      tags: ["social media", "instagram", "facebook", "redes"],
    },
  });

  await prisma.serviceVariant.createMany({
    skipDuplicates: true,
    data: [
      {
        serviceId: socialMedia.id,
        name: "Pack 5 Posts",
        creditCost: 20,
        description: "5 diseños estáticos para feed (Instagram, Facebook, LinkedIn).",
        estimatedDays: 3,
        sortOrder: 1,
        isPopular: true,
      },
      {
        serviceId: socialMedia.id,
        name: "Pack 10 Posts + Stories",
        creditCost: 40,
        description: "10 posts + 5 stories, diseño cohesivo con tu marca.",
        estimatedDays: 4,
        sortOrder: 2,
      },
      {
        serviceId: socialMedia.id,
        name: "Kit Mensual Completo",
        creditCost: 80,
        description: "20 posts + 10 stories + templates editables en Canva.",
        estimatedDays: 5,
        minPlan: "growth",
        sortOrder: 3,
      },
    ],
  });

  const presentation = await prisma.service.upsert({
    where: { slug: "presentation-design" },
    update: {},
    create: {
      name: "Diseño de Presentaciones",
      slug: "presentation-design",
      category: "DESIGN",
      description: "Presentaciones profesionales en PowerPoint, Keynote o Google Slides.",
      icon: "Presentation",
      sortOrder: 3,
      tags: ["presentaciones", "pitch", "slides"],
    },
  });

  await prisma.serviceVariant.createMany({
    skipDuplicates: true,
    data: [
      {
        serviceId: presentation.id,
        name: "Hasta 10 slides",
        creditCost: 25,
        description: "Presentación profesional con diseño de hasta 10 diapositivas.",
        estimatedDays: 3,
        sortOrder: 1,
      },
      {
        serviceId: presentation.id,
        name: "Hasta 25 slides",
        creditCost: 50,
        description: "Presentación completa, gráficos personalizados e infografías.",
        estimatedDays: 5,
        sortOrder: 2,
        isPopular: true,
      },
      {
        serviceId: presentation.id,
        name: "Pitch Deck",
        creditCost: 90,
        description: "Pitch deck para inversionistas, storytelling visual profesional.",
        estimatedDays: 7,
        minPlan: "growth",
        sortOrder: 3,
      },
    ],
  });

  const printDesign = await prisma.service.upsert({
    where: { slug: "print-design" },
    update: {},
    create: {
      name: "Diseño para Impresión",
      slug: "print-design",
      category: "DESIGN",
      description: "Flyers, brochures, tarjetas de presentación y material impreso.",
      icon: "Printer",
      sortOrder: 4,
      tags: ["impresión", "flyers", "brochures", "tarjetas"],
    },
  });

  await prisma.serviceVariant.createMany({
    skipDuplicates: true,
    data: [
      {
        serviceId: printDesign.id,
        name: "Tarjeta de Presentación",
        creditCost: 15,
        description: "Diseño de tarjeta de presentación (ambos lados), lista para imprimir.",
        estimatedDays: 2,
        sortOrder: 1,
      },
      {
        serviceId: printDesign.id,
        name: "Flyer / Poster",
        creditCost: 25,
        description: "Diseño de flyer o poster en cualquier tamaño estándar.",
        estimatedDays: 3,
        sortOrder: 2,
        isPopular: true,
      },
      {
        serviceId: printDesign.id,
        name: "Brochure / Catálogo",
        creditCost: 60,
        description: "Brochure o catálogo de hasta 8 páginas con diseño profesional.",
        estimatedDays: 5,
        sortOrder: 3,
      },
    ],
  });

  const brandIdentity = await prisma.service.upsert({
    where: { slug: "brand-identity" },
    update: {},
    create: {
      name: "Identidad de Marca",
      slug: "brand-identity",
      category: "DESIGN",
      description: "Desarrollo completo de identidad visual para tu marca.",
      icon: "Sparkles",
      sortOrder: 5,
      tags: ["branding", "identidad", "marca"],
    },
  });

  await prisma.serviceVariant.createMany({
    skipDuplicates: true,
    data: [
      {
        serviceId: brandIdentity.id,
        name: "Brand Board",
        creditCost: 40,
        description: "Paleta de colores, tipografía, estilo visual y moodboard.",
        estimatedDays: 4,
        sortOrder: 1,
      },
      {
        serviceId: brandIdentity.id,
        name: "Brand Guidelines",
        creditCost: 100,
        description: "Manual de marca completo con reglas de uso, aplicaciones y ejemplos.",
        estimatedDays: 7,
        minPlan: "growth",
        sortOrder: 2,
        isPopular: true,
      },
    ],
  });

  // WEB SERVICES
  const landingPage = await prisma.service.upsert({
    where: { slug: "landing-page" },
    update: {},
    create: {
      name: "Landing Page",
      slug: "landing-page",
      category: "WEB",
      description: "Diseño y desarrollo de landing page optimizada para conversión.",
      icon: "Globe",
      sortOrder: 6,
      tags: ["web", "landing", "conversión"],
    },
  });

  await prisma.serviceVariant.createMany({
    skipDuplicates: true,
    data: [
      {
        serviceId: landingPage.id,
        name: "Landing Básica",
        creditCost: 50,
        description: "1 página, diseño responsive, formulario de contacto.",
        estimatedDays: 5,
        sortOrder: 1,
        isPopular: true,
      },
      {
        serviceId: landingPage.id,
        name: "Landing Pro",
        creditCost: 100,
        description: "Landing con animaciones, integraciones (CRM, email), SEO básico.",
        estimatedDays: 7,
        minPlan: "growth",
        sortOrder: 2,
      },
      {
        serviceId: landingPage.id,
        name: "Landing + Funnel",
        creditCost: 180,
        description: "Landing + páginas de gracias, upsell y secuencia de emails.",
        estimatedDays: 10,
        minPlan: "pro",
        sortOrder: 3,
        isNew: true,
      },
    ],
  });

  const webDev = await prisma.service.upsert({
    where: { slug: "website-development" },
    update: {},
    create: {
      name: "Desarrollo Web",
      slug: "website-development",
      category: "WEB",
      description: "Sitio web completo, multi-página, con CMS o custom.",
      icon: "Code",
      sortOrder: 7,
      tags: ["web", "desarrollo", "sitio web"],
    },
  });

  await prisma.serviceVariant.createMany({
    skipDuplicates: true,
    data: [
      {
        serviceId: webDev.id,
        name: "Sitio Informativo (hasta 5 páginas)",
        creditCost: 120,
        description: "Sitio web estático con hasta 5 páginas, responsive y SEO.",
        estimatedDays: 7,
        minPlan: "growth",
        sortOrder: 1,
      },
      {
        serviceId: webDev.id,
        name: "Sitio con CMS",
        creditCost: 200,
        description: "Sitio web con panel de administración para actualizar contenido.",
        estimatedDays: 14,
        minPlan: "pro",
        sortOrder: 2,
        isPopular: true,
      },
      {
        serviceId: webDev.id,
        name: "E-Commerce Básico",
        creditCost: 300,
        description: "Tienda online con catálogo, carrito, pagos y gestión de pedidos.",
        estimatedDays: 21,
        minPlan: "pro",
        sortOrder: 3,
      },
    ],
  });

  const webMaintenance = await prisma.service.upsert({
    where: { slug: "web-maintenance" },
    update: {},
    create: {
      name: "Mantenimiento Web",
      slug: "web-maintenance",
      category: "WEB",
      description: "Actualizaciones, correcciones y mejoras en sitios web existentes.",
      icon: "Wrench",
      sortOrder: 8,
      tags: ["web", "mantenimiento", "actualizaciones"],
    },
  });

  await prisma.serviceVariant.createMany({
    skipDuplicates: true,
    data: [
      {
        serviceId: webMaintenance.id,
        name: "Cambio Menor",
        creditCost: 10,
        description: "Corrección de texto, imágenes o ajuste de estilos simples.",
        estimatedDays: 1,
        sortOrder: 1,
        isPopular: true,
      },
      {
        serviceId: webMaintenance.id,
        name: "Actualización Media",
        creditCost: 30,
        description: "Nueva sección, integración de formulario o rediseño parcial.",
        estimatedDays: 3,
        sortOrder: 2,
      },
      {
        serviceId: webMaintenance.id,
        name: "Rediseño de Página",
        creditCost: 60,
        description: "Rediseño completo de una página existente.",
        estimatedDays: 5,
        sortOrder: 3,
      },
    ],
  });

  const uiUx = await prisma.service.upsert({
    where: { slug: "ui-ux-design" },
    update: {},
    create: {
      name: "Diseño UI/UX",
      slug: "ui-ux-design",
      category: "WEB",
      description: "Diseño de interfaces y experiencia de usuario para apps y web.",
      icon: "Layout",
      sortOrder: 9,
      tags: ["ui", "ux", "diseño", "figma", "prototipo"],
    },
  });

  await prisma.serviceVariant.createMany({
    skipDuplicates: true,
    data: [
      {
        serviceId: uiUx.id,
        name: "Wireframes (hasta 5 pantallas)",
        creditCost: 30,
        description: "Wireframes de baja fidelidad para flujos clave de tu app.",
        estimatedDays: 3,
        sortOrder: 1,
      },
      {
        serviceId: uiUx.id,
        name: "UI Diseño (hasta 5 pantallas)",
        creditCost: 60,
        description: "Diseño de alta fidelidad en Figma, listo para desarrollo.",
        estimatedDays: 5,
        sortOrder: 2,
        isPopular: true,
      },
      {
        serviceId: uiUx.id,
        name: "Prototipo Interactivo",
        creditCost: 100,
        description: "Prototipo clickeable en Figma con animaciones y transiciones.",
        estimatedDays: 7,
        minPlan: "growth",
        sortOrder: 3,
        isNew: true,
      },
    ],
  });

  // MARKETING SERVICES
  const socialMediaMgmt = await prisma.service.upsert({
    where: { slug: "social-media-management" },
    update: {},
    create: {
      name: "Community Management",
      slug: "social-media-management",
      category: "MARKETING",
      description: "Gestión profesional de tus redes sociales.",
      icon: "Users",
      sortOrder: 10,
      tags: ["marketing", "redes", "community", "social media"],
    },
  });

  await prisma.serviceVariant.createMany({
    skipDuplicates: true,
    data: [
      {
        serviceId: socialMediaMgmt.id,
        name: "1 Red Social (mensual)",
        creditCost: 60,
        description: "Gestión de 1 red social: 12 posts + stories + engagement.",
        estimatedDays: 30,
        sortOrder: 1,
      },
      {
        serviceId: socialMediaMgmt.id,
        name: "2 Redes Sociales (mensual)",
        creditCost: 100,
        description: "Gestión de 2 redes sociales con calendario editorial.",
        estimatedDays: 30,
        minPlan: "growth",
        sortOrder: 2,
        isPopular: true,
      },
      {
        serviceId: socialMediaMgmt.id,
        name: "Pack Full (3 redes + reportes)",
        creditCost: 180,
        description: "3 redes, reportes mensuales, estrategia de contenido.",
        estimatedDays: 30,
        minPlan: "pro",
        sortOrder: 3,
      },
    ],
  });

  const contentMarketing = await prisma.service.upsert({
    where: { slug: "content-marketing" },
    update: {},
    create: {
      name: "Marketing de Contenido",
      slug: "content-marketing",
      category: "MARKETING",
      description: "Creación de contenido estratégico para atraer y retener clientes.",
      icon: "FileText",
      sortOrder: 11,
      tags: ["marketing", "contenido", "blog", "copywriting"],
    },
  });

  await prisma.serviceVariant.createMany({
    skipDuplicates: true,
    data: [
      {
        serviceId: contentMarketing.id,
        name: "Blog Post (1 artículo)",
        creditCost: 15,
        description: "Artículo SEO-optimizado de 800-1200 palabras.",
        estimatedDays: 3,
        sortOrder: 1,
      },
      {
        serviceId: contentMarketing.id,
        name: "Pack 4 Blog Posts",
        creditCost: 50,
        description: "4 artículos mensuales con estrategia de keywords.",
        estimatedDays: 15,
        sortOrder: 2,
        isPopular: true,
      },
      {
        serviceId: contentMarketing.id,
        name: "Copywriting Landing",
        creditCost: 30,
        description: "Copy persuasivo para landing page, headlines y CTAs.",
        estimatedDays: 3,
        sortOrder: 3,
      },
    ],
  });

  const emailMarketing = await prisma.service.upsert({
    where: { slug: "email-marketing" },
    update: {},
    create: {
      name: "Email Marketing",
      slug: "email-marketing",
      category: "MARKETING",
      description: "Diseño y estrategia de campañas de email marketing.",
      icon: "Mail",
      sortOrder: 12,
      tags: ["marketing", "email", "newsletter", "automatización"],
    },
  });

  await prisma.serviceVariant.createMany({
    skipDuplicates: true,
    data: [
      {
        serviceId: emailMarketing.id,
        name: "Template de Email",
        creditCost: 20,
        description: "Diseño de template HTML responsive para newsletters.",
        estimatedDays: 3,
        sortOrder: 1,
      },
      {
        serviceId: emailMarketing.id,
        name: "Campaña Completa",
        creditCost: 45,
        description: "Estrategia + diseño + copy para campaña de email (3-5 emails).",
        estimatedDays: 5,
        sortOrder: 2,
        isPopular: true,
      },
      {
        serviceId: emailMarketing.id,
        name: "Automatización + Secuencia",
        creditCost: 80,
        description: "Setup de automatización con secuencia de emails (onboarding, nurturing).",
        estimatedDays: 7,
        minPlan: "growth",
        sortOrder: 3,
        isNew: true,
      },
    ],
  });

  const seo = await prisma.service.upsert({
    where: { slug: "seo-optimization" },
    update: {},
    create: {
      name: "Optimización SEO",
      slug: "seo-optimization",
      category: "MARKETING",
      description: "Mejora tu posicionamiento en buscadores.",
      icon: "Search",
      sortOrder: 13,
      tags: ["marketing", "seo", "google", "posicionamiento"],
    },
  });

  await prisma.serviceVariant.createMany({
    skipDuplicates: true,
    data: [
      {
        serviceId: seo.id,
        name: "Auditoría SEO",
        creditCost: 30,
        description: "Análisis completo de tu sitio con recomendaciones priorizadas.",
        estimatedDays: 5,
        sortOrder: 1,
        isPopular: true,
      },
      {
        serviceId: seo.id,
        name: "SEO On-Page (hasta 10 páginas)",
        creditCost: 60,
        description: "Optimización de meta tags, headers, imágenes y contenido.",
        estimatedDays: 7,
        minPlan: "growth",
        sortOrder: 2,
      },
      {
        serviceId: seo.id,
        name: "Estrategia SEO Mensual",
        creditCost: 120,
        description: "Estrategia completa: keywords, contenido, link building, reportes.",
        estimatedDays: 30,
        minPlan: "pro",
        sortOrder: 3,
      },
    ],
  });

  const paidAds = await prisma.service.upsert({
    where: { slug: "paid-advertising" },
    update: {},
    create: {
      name: "Publicidad Digital",
      slug: "paid-advertising",
      category: "MARKETING",
      description: "Gestión de campañas en Google Ads, Meta Ads y más.",
      icon: "Megaphone",
      sortOrder: 14,
      tags: ["marketing", "ads", "publicidad", "google ads", "meta"],
    },
  });

  await prisma.serviceVariant.createMany({
    skipDuplicates: true,
    data: [
      {
        serviceId: paidAds.id,
        name: "Setup de Campaña",
        creditCost: 40,
        description: "Configuración inicial de campaña en 1 plataforma (Google/Meta).",
        estimatedDays: 3,
        sortOrder: 1,
      },
      {
        serviceId: paidAds.id,
        name: "Gestión Mensual (1 plataforma)",
        creditCost: 80,
        description: "Optimización continua, A/B testing y reportes semanales.",
        estimatedDays: 30,
        minPlan: "growth",
        sortOrder: 2,
        isPopular: true,
      },
      {
        serviceId: paidAds.id,
        name: "Gestión Multi-Plataforma",
        creditCost: 150,
        description: "Gestión de campañas en Google + Meta + retargeting.",
        estimatedDays: 30,
        minPlan: "pro",
        sortOrder: 3,
      },
    ],
  });

  console.log("✅ Service catalog seeded (14 services with variants)");

  // ─── ALIANZA LEN ────────────────────────────────────
  await prisma.alliance.upsert({
    where: { slug: "len" },
    update: {},
    create: {
      name: "LEN",
      slug: "len",
      code: "LEN2026",
      contactName: "LEN Team",
      discountPercent: 30,
      bonusCredits: 50,
      revenueShare: 10, // $10
      isActive: true,
    },
  });

  console.log("✅ Alliance: LEN");

  // ─── ADMIN USER ─────────────────────────────────────
  await prisma.user.upsert({
    where: { email: "daniel@nouvos.one" },
    update: {},
    create: {
      email: "daniel@nouvos.one",
      name: "Daniel",
      role: "ADMIN",
      emailVerified: true,
    },
  });

  console.log("✅ Admin user: daniel@nouvos.one");

  console.log("🎉 Seed complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
