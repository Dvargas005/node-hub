// app/page.tsx
"use client";

import { useEffect, useState } from "react";

// Language content
const content = {
  en: {
    nav: {
      join: "Join Waitlist",
      menu: "Menu",
    },
    hero: {
      label: "NETWORK ORGANIZED DELIVERY ENGINE",
      powered: "POWERED BY NOUVOS",
      services: "DESIGN · WEB · MARKETING",
      est: "EST. 2026",
    },
    services: {
      title: "What We Deliver",
      subtitle: "Three service lines. Real deliverables.",
      filters: ["All", "Design", "Web", "Marketing"],
      items: [
        { name: "Brand Starter", category: "Design", price: "from $299 credits", desc: "Complete brand identity package for new businesses" },
        { name: "Landing Page", category: "Web", price: "from $499 credits", desc: "High-converting single page with AI-assisted copy" },
        { name: "Content Pack", category: "Marketing", price: "from $199 credits", desc: "Blog posts, newsletters, and social content" },
        { name: "Social Pack", category: "Design", price: "from $249 credits", desc: "30 days of branded social media graphics" },
        { name: "SEO Foundation", category: "Web", price: "from $399 credits", desc: "Technical SEO setup and content optimization" },
        { name: "Promo Campaign", category: "Marketing", price: "from $599 credits", desc: "End-to-end promotional campaign management" },
      ],
    },
    process: {
      blocks: [
        {
          num: "01",
          label: "// 01",
          title: "START IN UNDER 24 HOURS",
          para: "Pick the plan that fits your business. No long contracts, no fine print, no surprises. Your digital team activates the moment you subscribe. One monthly payment gives you access to dedicated designers, developers, and marketers.",
          list: [
            { name: "Plan Member", num: "01" },
            { name: "Plan Growth", num: "02" },
            { name: "Plan Pro", num: "03" },
            { name: "Custom Projects", num: "04" },
          ],
        },
        {
          num: "02",
          label: "// 02",
          title: "AI-GUIDED BRIEFING SYSTEM",
          para: "You don't need to know design or tech to request what you need. Our smart assistant guides you step by step to articulate your request. The result is a professional brief your team can execute without back and forth.",
          list: [
            { name: "Smart Wizard", num: "01" },
            { name: "Auto-categorization", num: "02" },
            { name: "File Attachments", num: "03" },
            { name: "Brief Generation", num: "04" },
            { name: "PM Escalation", num: "05" },
          ],
        },
        {
          num: "03",
          label: "// 03",
          title: "YOUR DEDICATED CREATIVE TEAM",
          para: "Behind every request is a real team. Graphic designers, AI-assisted developers, and specialized community managers. Your project manager coordinates everything — you just receive finished work in 48 to 72 business hours.",
          list: [
            { name: "Graphic Design", num: "01" },
            { name: "AI-Assisted Development", num: "02" },
            { name: "Community Management", num: "03" },
            { name: "Project Management", num: "04" },
            { name: "Quality Assurance", num: "05" },
          ],
        },
        {
          num: "04",
          label: "// 04",
          title: "APPROVE, ITERATE, SCALE",
          para: "Receive ready-to-use deliverables. Need adjustments? Request unlimited revisions. Approve on first round and earn bonus credits. As your business grows, your plan grows with you — more credits, more speed, more services.",
          list: [
            { name: "Unlimited Revisions", num: "01" },
            { name: "First-Round Bonus", num: "02" },
            { name: "Credit Packs", num: "03" },
            { name: "Plan Upgrades", num: "04" },
          ],
        },
      ],
    },
    about: {
      title: "Why N.O.D.E. exists",
      para: "N.O.D.E. is born from Nouvos Solutions — a logistics technology company that has spent years building systems for the global supply chain. We know what it means to operate with distributed teams, manage deliveries with real deadlines, and scale operations without losing quality. We apply exactly that mindset to creative services: clear processes, predictable deliveries, technology that amplifies human talent.",
    },
    quote: "In a world full of generic noise, we help businesses build their digital presence with a real team, proven processes, and technology that accelerates everything.",
    pricing: {
      title: "Simple Pricing",
      subtitle: "One monthly fee. Unlimited requests.",
      plans: [
        { name: "Member", price: "$299", period: "/month", features: ["5 requests per month", "48-72h delivery", "Unlimited revisions", "Basic design & web"], featured: false },
        { name: "Growth", price: "$599", period: "/month", features: ["15 requests per month", "24-48h priority delivery", "Unlimited revisions", "Advanced design & dev", "SEO included"], featured: true },
        { name: "Pro", price: "$999", period: "/month", features: ["Unlimited requests", "Same-day delivery", "Dedicated PM", "Full marketing stack", "Custom integrations"], featured: false },
      ],
    },
    waitlist: {
      title: "Be among the first",
      subtitle: "Join the waitlist for early access and exclusive pricing.",
      cta: "Join Waitlist",
      placeholder: "Enter your email",
      sending: "Sending...",
      success: "You're on the list! We'll be in touch.",
      duplicate: "This email is already registered.",
      error: "Something went wrong. Try again.",
    },
    footer: {
      rights: "© 2026 Nouvos Solutions LLC",
    },
  },
  es: {
    nav: {
      join: "Unirse a Waitlist",
      menu: "Menú",
    },
    hero: {
      label: "NETWORK ORGANIZED DELIVERY ENGINE",
      powered: "POWERED BY NOUVOS",
      services: "DISEÑO · WEB · MARKETING",
      est: "EST. 2026",
    },
    services: {
      title: "Lo que entregamos",
      subtitle: "Tres líneas de servicio. Entregables reales.",
      filters: ["Todos", "Diseño", "Web", "Marketing"],
      items: [
        { name: "Brand Starter", category: "Diseño", price: "desde $299 créditos", desc: "Paquete completo de identidad de marca para nuevos negocios" },
        { name: "Landing Page", category: "Web", price: "desde $499 créditos", desc: "Página única de alta conversión con copy asistido por AI" },
        { name: "Content Pack", category: "Marketing", price: "desde $199 créditos", desc: "Posts de blog, newsletters y contenido social" },
        { name: "Social Pack", category: "Diseño", price: "desde $249 créditos", desc: "30 días de gráficos de redes sociales con marca" },
        { name: "SEO Foundation", category: "Web", price: "desde $399 créditos", desc: "Configuración técnica SEO y optimización de contenido" },
        { name: "Promo Campaign", category: "Marketing", price: "desde $599 créditos", desc: "Gestión integral de campañas promocionales" },
      ],
    },
    process: {
      blocks: [
        {
          num: "01",
          label: "// 01",
          title: "ACTÍVATE EN MENOS DE 24 HORAS",
          para: "Elige el plan que se ajuste a tu negocio. Sin contratos largos, sin letra chica, sin sorpresas. Tu equipo digital se activa desde el momento en que te suscribes. Un solo pago mensual te da acceso a diseñadores, developers y marketers dedicados.",
          list: [
            { name: "Plan Member", num: "01" },
            { name: "Plan Growth", num: "02" },
            { name: "Plan Pro", num: "03" },
            { name: "Proyectos Custom", num: "04" },
          ],
        },
        {
          num: "02",
          label: "// 02",
          title: "SISTEMA DE BRIEFING GUIADO POR AI",
          para: "No necesitas saber de diseño ni de tecnología para pedir lo que necesitas. Nuestro asistente inteligente te guía paso a paso para articular tu solicitud. El resultado es un brief profesional que nuestro equipo puede ejecutar sin idas y vueltas.",
          list: [
            { name: "Smart Wizard", num: "01" },
            { name: "Auto-categorización", num: "02" },
            { name: "Adjuntos de Archivos", num: "03" },
            { name: "Generación de Brief", num: "04" },
            { name: "Escalación a PM", num: "05" },
          ],
        },
        {
          num: "03",
          label: "// 03",
          title: "TU EQUIPO CREATIVO DEDICADO",
          para: "Detrás de cada solicitud hay un equipo real. Diseñadores gráficos, desarrolladores asistidos por AI, y community managers especializados. Tu project manager coordina todo — tú solo recibes el trabajo terminado en 48 a 72 horas hábiles.",
          list: [
            { name: "Diseño Gráfico", num: "01" },
            { name: "Desarrollo AI-Asistido", num: "02" },
            { name: "Community Management", num: "03" },
            { name: "Project Management", num: "04" },
            { name: "Quality Assurance", num: "05" },
          ],
        },
        {
          num: "04",
          label: "// 04",
          title: "APRUEBA, ITERA, ESCALA",
          para: "Recibe entregas listas para usar. Si necesitas ajustes, pide revisiones ilimitadas. Aprueba a la primera y gana créditos bonus. A medida que tu negocio crece, tu plan crece contigo — más créditos, más velocidad, más servicios.",
          list: [
            { name: "Revisiones Ilimitadas", num: "01" },
            { name: "Bonus Primera Ronda", num: "02" },
            { name: "Packs de Créditos", num: "03" },
            { name: "Upgrades de Plan", num: "04" },
          ],
        },
      ],
    },
    about: {
      title: "Por qué existe N.O.D.E.",
      para: "N.O.D.E. nace de Nouvos Solutions — una empresa de tecnología logística que lleva años construyendo sistemas para la cadena de suministro global. Sabemos lo que significa operar con equipos distribuidos, gestionar entregas con deadlines reales, y escalar operaciones sin perder calidad. Aplicamos exactamente esa mentalidad a los servicios creativos: procesos claros, entregas predecibles, tecnología que amplifica al talento humano.",
    },
    quote: "En un mundo lleno de ruido genérico, ayudamos a negocios a construir su presencia digital con un equipo real, procesos probados, y tecnología que acelera todo.",
    pricing: {
      title: "Precios Simples",
      subtitle: "Una cuota mensual. Solicitudes ilimitadas.",
      plans: [
        { name: "Member", price: "$299", period: "/mes", features: ["5 solicitudes por mes", "Entrega 48-72h", "Revisiones ilimitadas", "Diseño y web básico"], featured: false },
        { name: "Growth", price: "$599", period: "/mes", features: ["15 solicitudes por mes", "Entrega prioritaria 24-48h", "Revisiones ilimitadas", "Diseño y dev avanzado", "SEO incluido"], featured: true },
        { name: "Pro", price: "$999", period: "/mes", features: ["Solicitudes ilimitadas", "Entrega mismo día", "PM dedicado", "Marketing full stack", "Integraciones custom"], featured: false },
      ],
    },
    waitlist: {
      title: "Sé de los primeros",
      subtitle: "Únete a la lista de espera para acceso temprano y precios exclusivos.",
      cta: "Unirse a Waitlist",
      placeholder: "Ingresa tu email",
      sending: "Enviando...",
      success: "¡Estás en la lista! Te contactaremos pronto.",
      duplicate: "Este email ya está registrado.",
      error: "Algo salió mal. Intenta de nuevo.",
    },
    footer: {
      rights: "© 2026 Nouvos Solutions LLC",
    },
  },
};

export default function Home() {
  const [lang, setLang] = useState<"en" | "es">("en");
  const [scrolled, setScrolled] = useState(false);
  const [filter, setFilter] = useState("All");
  const [wlEmail, setWlEmail] = useState("");
  const [wlStatus, setWlStatus] = useState<"idle" | "loading" | "success" | "error" | "duplicate">("idle");
  const t = content[lang];

  // Scroll reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Nav scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getCategory = (cat: string) => {
    if (lang === "es") {
      const map: Record<string, string> = {
        "Design": "Diseño",
        "Web": "Web",
        "Marketing": "Marketing",
        "All": "Todos",
      };
      return map[cat] || cat;
    }
    return cat;
  };

  const filteredServices = filter === "All" || filter === "Todos"
    ? t.services.items
    : t.services.items.filter(item => item.category === getCategory(filter));

  // Waitlist submit → POST /api/waitlist
  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wlEmail) return;
    setWlStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: wlEmail, language: lang }),
      });
      if (res.status === 409) { setWlStatus("duplicate"); return; }
      if (!res.ok) throw new Error();
      setWlStatus("success");
    } catch {
      setWlStatus("error");
    }
  };

  return (
    <main className="min-h-screen bg-[#130A06]">
      {/* Language Selector */}
      <div className="fixed top-6 right-6 z-50 flex gap-3">
        <button
          onClick={() => setLang("en")}
          className={`lang-flag text-2xl ${lang === "en" ? "active" : ""}`}
        >
          🇺🇸
        </button>
        <button
          onClick={() => setLang("es")}
          className={`lang-flag text-2xl ${lang === "es" ? "active" : ""}`}
        >
          🇲🇽
        </button>
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-40 px-6 md:px-12 py-6 flex justify-between items-center transition-all duration-500 ${scrolled ? "nav-blur" : "bg-transparent"}`}>
        <div className="font-[family-name:var(--font-lexend)] font-black text-xl tracking-tight text-[#F5F6FC]">
          N.O.D.E.
        </div>
        <div className="flex items-center gap-6">
          <button className="hidden md:block font-[family-name:var(--font-lexend)] font-bold text-sm uppercase tracking-widest border border-[#F5F6FC] px-6 py-3 hover:bg-[#F5F6FC] hover:text-[#130A06] transition-all">
            {t.nav.join}
          </button>
          <button className="font-[family-name:var(--font-lexend)] text-[#F5F6FC]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </nav>

      {/* HERO - Brandin Style */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image Placeholder */}
        <div className="absolute inset-0 img-placeholder opacity-30">
          Hero visual — creative/tech imagery, dark mood
        </div>

        <div className="absolute inset-0 bg-[#130A06]/80" />

        <div className="relative z-10 text-center px-6">
          <p
            className="font-[family-name:var(--font-lexend)] font-bold text-[0.7rem] md:text-[0.8rem] uppercase tracking-[0.3em] text-[#FFC919] mb-6 reveal"
            style={{ transitionDelay: "0.2s" }}
          >
            {t.hero.label}
          </p>

          <h1
            className="font-[family-name:var(--font-lexend)] font-black text-[clamp(4rem,15vw,12rem)] leading-[0.85] text-[#F5F6FC] reveal"
            style={{ transitionDelay: "0.4s" }}
          >
            N.O.D.E.
          </h1>
        </div>

        {/* Bottom Info Bar - Brandin Style */}
        <div className="absolute bottom-8 left-0 right-0 px-6 md:px-12 flex justify-between items-end text-[0.75rem] font-[family-name:var(--font-lexend)] uppercase tracking-widest text-[rgba(245,246,252,0.6)]">
          <span className="reveal" style={{ transitionDelay: "0.8s" }}>{t.hero.powered}</span>
          <span className="reveal hidden md:block" style={{ transitionDelay: "1s" }}>{t.hero.services}</span>
          <span className="reveal" style={{ transitionDelay: "1.2s" }}>{t.hero.est}</span>
        </div>
      </section>

      {/* SERVICES - Brandin Portfolio Grid Style */}
      <section className="py-32 px-6 md:px-12 bg-[#130A06]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16 reveal">
            <div>
              <h2 className="font-[family-name:var(--font-lexend)] font-bold text-4xl md:text-5xl text-[#F5F6FC] mb-4">
                {t.services.title}
              </h2>
              <p className="font-[family-name:var(--font-atkinson)] text-lg text-[rgba(245,246,252,0.6)]">
                {t.services.subtitle}
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-8 mt-8 md:mt-0 font-[family-name:var(--font-lexend)] text-sm uppercase tracking-widest">
              {t.services.filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`filter-tab ${filter === f ? "active" : ""}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service, idx) => (
              <div
                key={service.name}
                className="service-card reveal"
                style={{ transitionDelay: `${idx * 0.1}s` }}
              >
                <div className="img-placeholder aspect-video mb-0">
                  {service.name}
                </div>
                <div className="overlay">
                  <p className="font-[family-name:var(--font-atkinson)] text-sm text-[rgba(245,246,252,0.8)] mb-2">
                    {service.desc}
                  </p>
                  <p className="font-[family-name:var(--font-lexend)] font-bold text-[#FFC919] text-sm">
                    {service.price}
                  </p>
                </div>
                <div className="py-4 border-b border-[rgba(245,246,252,0.1)]">
                  <h3 className="font-[family-name:var(--font-lexend)] font-bold text-lg text-[#F5F6FC]">
                    {service.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS - Brandin Expertise Style (4 Full Blocks) */}
      <section className="bg-[#130A06]">
        {t.process.blocks.map((block, idx) => (
          <div key={block.num} className="min-h-[90vh] flex items-center relative">
            <div className="w-full px-6 md:px-12 py-24">
              <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-24 items-end">

                {/* Left: Giant Number */}
                <div className="lg:w-[40%] flex items-end reveal">
                  <span className="font-[family-name:var(--font-lexend)] font-black text-[clamp(8rem,20vw,18rem)] leading-[0.8] number-stroke">
                    {block.num}
                  </span>
                </div>

                {/* Right: Content */}
                <div className="lg:w-[60%] reveal" style={{ transitionDelay: "0.2s" }}>
                  <p className="font-[family-name:var(--font-lexend)] font-bold text-[0.8rem] uppercase tracking-[0.3em] text-[#FFC919] mb-4">
                    {block.label}
                  </p>
                  <h3 className="font-[family-name:var(--font-lexend)] font-bold text-3xl md:text-4xl text-[#F5F6FC] uppercase mb-6 leading-tight">
                    {block.title}
                  </h3>
                  <p className="font-[family-name:var(--font-atkinson)] text-lg text-[rgba(245,246,252,0.6)] leading-[1.8] mb-8 max-w-2xl">
                    {block.para}
                  </p>

                  {/* List Items */}
                  <div className="border-t border-[rgba(245,246,252,0.1)]">
                    {block.list.map((item) => (
                      <div key={item.name} className="list-item font-[family-name:var(--font-atkinson)]">
                        <span className="text-[#F5F6FC]">{item.name}</span>
                        <span className="text-[rgba(245,246,252,0.4)] text-sm">{item.num}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Separator */}
            {idx < t.process.blocks.length - 1 && (
              <div className="absolute bottom-0 left-0 right-0 process-separator" />
            )}
          </div>
        ))}
      </section>

      {/* ABOUT - Brandin Experience Style */}
      <section className="py-32 px-6 md:px-12 bg-[#000741]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="reveal">
              <div className="gold-line mb-8" />
              <h2 className="font-[family-name:var(--font-lexend)] font-bold text-4xl md:text-5xl text-[#F5F6FC] mb-8 leading-tight">
                {t.about.title}
              </h2>
              <p className="font-[family-name:var(--font-atkinson)] text-xl text-[rgba(245,246,252,0.8)] leading-[1.8]">
                {t.about.para}
              </p>
            </div>

            <div className="reveal img-placeholder aspect-[4/3]" style={{ transitionDelay: "0.2s" }}>
              Team/tech visual — abstract or workspace
            </div>
          </div>
        </div>
      </section>

      {/* QUOTE - Brandin Quote Block Style */}
      <section className="py-32 px-6 md:px-12 bg-[#130A06] relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative">
          <div className="absolute -left-8 -top-8 quote-mark">&ldquo;</div>

          <div className="relative z-10 border-l-4 border-[#FFC919] pl-8 md:pl-16 reveal">
            <blockquote className="font-[family-name:var(--font-atkinson)] font-bold italic text-2xl md:text-3xl text-[#F5F6FC] leading-[1.6]">
              {t.quote}
            </blockquote>
          </div>

          <div className="absolute -right-4 bottom-0 quote-mark rotate-180">&rdquo;</div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-32 px-6 md:px-12 bg-[#130A06]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 reveal">
            <h2 className="font-[family-name:var(--font-lexend)] font-bold text-4xl md:text-5xl text-[#F5F6FC] mb-4">
              {t.pricing.title}
            </h2>
            <p className="font-[family-name:var(--font-atkinson)] text-lg text-[rgba(245,246,252,0.6)]">
              {t.pricing.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {t.pricing.plans.map((plan, idx) => (
              <div
                key={plan.name}
                className={`pricing-card p-8 reveal ${plan.featured ? "featured" : ""}`}
                style={{ transitionDelay: `${idx * 0.15}s` }}
              >
                <h3 className="font-[family-name:var(--font-lexend)] font-bold text-xl text-[#F5F6FC] uppercase tracking-widest mb-4">
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="font-[family-name:var(--font-lexend)] font-black text-5xl text-[#F5F6FC]">
                    {plan.price}
                  </span>
                  <span className="font-[family-name:var(--font-atkinson)] text-[rgba(245,246,252,0.6)]">
                    {plan.period}
                  </span>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="font-[family-name:var(--font-atkinson)] text-[rgba(245,246,252,0.8)] flex items-start gap-3">
                      <span className="text-[#FFC919] mt-1">→</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button className={`w-full font-[family-name:var(--font-lexend)] font-bold text-sm uppercase tracking-widest py-4 transition-all ${plan.featured ? "bg-[#FFC919] text-[#130A06] hover:bg-[#F5F6FC]" : "border border-[#F5F6FC] text-[#F5F6FC] hover:bg-[#F5F6FC] hover:text-[#130A06]"}`}>
                  {t.nav.join}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WAITLIST / CTA */}
      <section className="py-32 px-6 md:px-12 bg-[#000741]">
        <div className="max-w-3xl mx-auto text-center reveal">
          <h2 className="font-[family-name:var(--font-lexend)] font-bold text-4xl md:text-6xl text-[#F5F6FC] mb-6">
            {t.waitlist.title}
          </h2>
          <p className="font-[family-name:var(--font-atkinson)] text-lg text-[rgba(245,246,252,0.6)] mb-12">
            {t.waitlist.subtitle}
          </p>

          {wlStatus === "success" ? (
            <p className="font-[family-name:var(--font-atkinson)] text-xl text-[#FFC919]">
              {t.waitlist.success}
            </p>
          ) : (
            <>
              <form onSubmit={handleWaitlist} className="flex flex-col md:flex-row gap-4 max-w-xl mx-auto">
                <input
                  type="email"
                  required
                  value={wlEmail}
                  onChange={(e) => setWlEmail(e.target.value)}
                  placeholder={t.waitlist.placeholder}
                  className="form-input flex-1"
                />
                <button
                  type="submit"
                  disabled={wlStatus === "loading"}
                  className="bg-[#FFC919] text-[#130A06] font-[family-name:var(--font-lexend)] font-bold text-sm uppercase tracking-widest px-8 py-4 hover:bg-[#F5F6FC] transition-all disabled:opacity-60"
                >
                  {wlStatus === "loading" ? t.waitlist.sending : t.waitlist.cta}
                </button>
              </form>
              {wlStatus === "duplicate" && (
                <p className="mt-4 text-[#FFC919] text-sm">{t.waitlist.duplicate}</p>
              )}
              {wlStatus === "error" && (
                <p className="mt-4 text-red-400 text-sm">{t.waitlist.error}</p>
              )}
            </>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-16 px-6 md:px-12 bg-[#0a0504] border-t border-[rgba(245,246,252,0.1)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="font-[family-name:var(--font-lexend)] font-black text-2xl text-[#F5F6FC]">
            N.O.D.E. <span className="text-[rgba(245,246,252,0.5)] font-normal text-sm">by Nouvos</span>
          </div>

          <div className="flex gap-8 font-[family-name:var(--font-atkinson)] text-sm text-[rgba(245,246,252,0.6)]">
            <a href="#" className="hover:text-[#FFC919] transition-colors">Twitter</a>
            <a href="#" className="hover:text-[#FFC919] transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-[#FFC919] transition-colors">Instagram</a>
          </div>

          <p className="font-[family-name:var(--font-atkinson)] text-sm text-[rgba(245,246,252,0.4)]">
            {t.footer.rights}
          </p>
        </div>
      </footer>
    </main>
  );
}
