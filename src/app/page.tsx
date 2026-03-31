"use client";

import { useEffect, useState } from "react";

/* ═══════════════════════════════════════════════════════════
   LANGUAGE CONTENT
   ═══════════════════════════════════════════════════════════ */

const content = {
  en: {
    nav: {
      join: "Join Waitlist",
      links: [
        { label: "Services", href: "#services" },
        { label: "Process", href: "#process" },
        { label: "About", href: "#about" },
        { label: "Plans", href: "#pricing" },
        { label: "Contact", href: "#waitlist" },
      ],
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
        { name: "Brand Starter", category: "Design", price: "from 2 credits", desc: "Complete brand identity package for new businesses" },
        { name: "Landing Page", category: "Web", price: "from 5 credits", desc: "High-converting single page with AI-assisted copy" },
        { name: "Content Pack", category: "Marketing", price: "from 3 credits", desc: "Blog posts, newsletters, and social content" },
        { name: "Social Pack", category: "Design", price: "from 3 credits", desc: "30 days of branded social media graphics" },
        { name: "SEO Foundation", category: "Web", price: "from 4 credits", desc: "Technical SEO setup and content optimization" },
        { name: "Promo Campaign", category: "Marketing", price: "from 4 credits", desc: "End-to-end promotional campaign management" },
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
    quote:
      "In a world full of generic noise, we help businesses build their digital presence with a real team, proven processes, and technology that accelerates everything.",
    pricing: {
      title: "Simple Pricing",
      subtitle: "One monthly fee. Real deliverables.",
      plans: [
        {
          name: "Member",
          price: "$100",
          period: "/mo",
          features: ["5 credits per month", "1 active request", "72h turnaround", "Design + content", "Email support"],
          featured: false,
        },
        {
          name: "Growth",
          price: "$190",
          period: "/mo",
          features: ["12 credits per month", "2 active requests", "48h turnaround", "Design + web + content", "Priority support", "Brand strategy session"],
          featured: true,
        },
        {
          name: "Pro",
          price: "$330",
          period: "/mo",
          features: ["25 credits per month", "3 active requests", "24–48h turnaround", "Design + web + marketing", "Dedicated Slack", "Monthly strategy call", "Credit rollover"],
          featured: false,
        },
      ],
    },
    waitlist: {
      title: "Be among the first",
      subtitle: "The first 100 members get bonus credits.",
      cta: "Join Waitlist",
      placeholder: "Enter your email",
      success: "You're on the list! We'll be in touch.",
      duplicate: "This email is already registered.",
      error: "Something went wrong. Try again.",
      sending: "Sending...",
    },
    footer: {
      rights: "© 2026 Nouvos Solutions LLC. All rights reserved.",
    },
  },
  es: {
    nav: {
      join: "Unirse a Waitlist",
      links: [
        { label: "Servicios", href: "#services" },
        { label: "Proceso", href: "#process" },
        { label: "Nosotros", href: "#about" },
        { label: "Planes", href: "#pricing" },
        { label: "Contacto", href: "#waitlist" },
      ],
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
        { name: "Brand Starter", category: "Diseño", price: "desde 2 créditos", desc: "Paquete completo de identidad de marca para nuevos negocios" },
        { name: "Landing Page", category: "Web", price: "desde 5 créditos", desc: "Página de alta conversión con copy asistido por AI" },
        { name: "Content Pack", category: "Marketing", price: "desde 3 créditos", desc: "Posts de blog, newsletters y contenido social" },
        { name: "Social Pack", category: "Diseño", price: "desde 3 créditos", desc: "30 días de gráficos de redes sociales con marca" },
        { name: "SEO Foundation", category: "Web", price: "desde 4 créditos", desc: "Configuración técnica SEO y optimización de contenido" },
        { name: "Promo Campaign", category: "Marketing", price: "desde 4 créditos", desc: "Gestión integral de campañas promocionales" },
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
    quote:
      "En un mundo lleno de ruido genérico, ayudamos a negocios a construir su presencia digital con un equipo real, procesos probados, y tecnología que acelera todo.",
    pricing: {
      title: "Precios Simples",
      subtitle: "Una cuota mensual. Entregables reales.",
      plans: [
        {
          name: "Member",
          price: "$100",
          period: "/mes",
          features: ["5 créditos al mes", "1 request activo", "Turnaround 72h", "Diseño + contenido", "Soporte por email"],
          featured: false,
        },
        {
          name: "Growth",
          price: "$190",
          period: "/mes",
          features: ["12 créditos al mes", "2 requests activos", "Turnaround 48h", "Diseño + web + contenido", "Soporte prioritario", "Brand strategy session"],
          featured: true,
        },
        {
          name: "Pro",
          price: "$330",
          period: "/mes",
          features: ["25 créditos al mes", "3 requests activos", "Turnaround 24-48h", "Diseño + web + marketing", "Slack dedicado", "Monthly strategy call", "Rollover de créditos"],
          featured: false,
        },
      ],
    },
    waitlist: {
      title: "Sé de los primeros",
      subtitle: "Los primeros 100 miembros reciben créditos extra.",
      cta: "Unirse a Waitlist",
      placeholder: "Ingresa tu email",
      success: "¡Estás en la lista! Te contactaremos pronto.",
      duplicate: "Este email ya está registrado.",
      error: "Algo salió mal. Intenta de nuevo.",
      sending: "Enviando...",
    },
    footer: {
      rights: "© 2026 Nouvos Solutions LLC. Todos los derechos reservados.",
    },
  },
};

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */

const catMap: Record<string, string> = { Diseño: "Design", Todos: "All" };
const normCat = (c: string) => catMap[c] || c;

/* ═══════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════ */

export default function Home() {
  const [lang, setLang] = useState<"en" | "es">("es");
  const [scrolled, setScrolled] = useState(false);
  const [filter, setFilter] = useState("All");
  const [menuOpen, setMenuOpen] = useState(false);

  const [wlEmail, setWlEmail] = useState("");
  const [wlStatus, setWlStatus] = useState<
    "idle" | "loading" | "success" | "error" | "duplicate"
  >("idle");

  const t = content[lang];

  /* ── LocalStorage language ── */
  useEffect(() => {
    const saved = localStorage.getItem("node-locale");
    if (saved === "en" || saved === "es") setLang(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("node-locale", lang);
  }, [lang]);

  /* ── Scroll reveal (re-runs on filter to catch new elements) ── */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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

    const timeout = setTimeout(() => {
      document
        .querySelectorAll(".reveal:not(.active)")
        .forEach((el) => observer.observe(el));
    }, 60);

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [filter]);

  /* ── Nav scroll ── */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  /* ── Filtered services ── */
  const filteredServices =
    filter === "All"
      ? t.services.items
      : t.services.items.filter((s) => normCat(s.category) === filter);

  /* ── Waitlist submit ── */
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
      if (res.status === 409) {
        setWlStatus("duplicate");
        return;
      }
      if (!res.ok) throw new Error();
      setWlStatus("success");
    } catch {
      setWlStatus("error");
    }
  };

  return (
    <main className="min-h-screen bg-[#130A06]">
      {/* ── Language Selector ── */}
      <div className="fixed top-6 right-6 z-50 flex gap-3">
        <button
          onClick={() => setLang("es")}
          className={`lang-flag text-2xl ${lang === "es" ? "active" : ""}`}
        >
          🇲🇽
        </button>
        <button
          onClick={() => setLang("en")}
          className={`lang-flag text-2xl ${lang === "en" ? "active" : ""}`}
        >
          🇺🇸
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-40 px-6 md:px-12 py-6 flex justify-between items-center transition-all duration-500 ${
          scrolled ? "nav-blur" : "bg-transparent"
        }`}
      >
        <a
          href="#"
          className="font-[family-name:var(--font-lexend)] font-black text-xl tracking-tight text-[#F5F6FC]"
        >
          N.O.D.E.
        </a>
        <div className="flex items-center gap-6">
          <a
            href="#waitlist"
            className="hidden md:block font-[family-name:var(--font-lexend)] font-bold text-sm uppercase tracking-widest border border-[#F5F6FC] px-6 py-3 hover:bg-[#F5F6FC] hover:text-[#130A06] transition-all"
          >
            {t.nav.join}
          </a>
          <button
            onClick={() => setMenuOpen(true)}
            className="text-[#F5F6FC]"
            aria-label="Menu"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </nav>

      {/* ── Full-screen menu overlay ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] bg-[#130A06] flex flex-col items-center justify-center gap-8">
          <button
            onClick={() => setMenuOpen(false)}
            className="absolute top-6 right-6 text-[#F5F6FC]/70 hover:text-[#F5F6FC] transition-colors"
            aria-label="Close"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          {t.nav.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="font-[family-name:var(--font-lexend)] font-bold text-3xl md:text-5xl text-[#F5F6FC]/80 hover:text-[#FFC919] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════
         HERO
         ══════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
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

        <div className="absolute bottom-8 left-0 right-0 px-6 md:px-12 flex justify-between items-end text-[0.75rem] font-[family-name:var(--font-lexend)] uppercase tracking-widest text-[rgba(245,246,252,0.6)]">
          <span className="reveal" style={{ transitionDelay: "0.8s" }}>
            {t.hero.powered}
          </span>
          <span
            className="reveal hidden md:block"
            style={{ transitionDelay: "1s" }}
          >
            {t.hero.services}
          </span>
          <span className="reveal" style={{ transitionDelay: "1.2s" }}>
            {t.hero.est}
          </span>
        </div>
      </section>

      {/* ══════════════════════════════════════════
         SERVICES
         ══════════════════════════════════════════ */}
      <section id="services" className="py-32 px-6 md:px-12 bg-[#130A06]">
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

            <div className="flex gap-8 mt-8 md:mt-0 font-[family-name:var(--font-lexend)] text-sm uppercase tracking-widest">
              {t.services.filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(normCat(f))}
                  className={`filter-tab ${
                    filter === normCat(f) ? "active" : ""
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service, idx) => (
              <div
                key={service.name}
                className="service-card reveal"
                style={{ transitionDelay: `${idx * 0.1}s` }}
              >
                <div className="img-placeholder aspect-video">
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

      {/* ══════════════════════════════════════════
         PROCESS
         ══════════════════════════════════════════ */}
      <section id="process" className="bg-[#130A06]">
        {t.process.blocks.map((block, idx) => (
          <div
            key={block.num}
            className="min-h-[90vh] flex items-center relative"
          >
            <div className="w-full px-6 md:px-12 py-24">
              <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-24 items-end">
                <div className="lg:w-[40%] flex items-end reveal">
                  <span className="font-[family-name:var(--font-lexend)] font-black text-[clamp(8rem,20vw,18rem)] leading-[0.8] number-stroke">
                    {block.num}
                  </span>
                </div>

                <div
                  className="lg:w-[60%] reveal"
                  style={{ transitionDelay: "0.2s" }}
                >
                  <p className="font-[family-name:var(--font-lexend)] font-bold text-[0.8rem] uppercase tracking-[0.3em] text-[#FFC919] mb-4">
                    {block.label}
                  </p>
                  <h3 className="font-[family-name:var(--font-lexend)] font-bold text-3xl md:text-4xl text-[#F5F6FC] uppercase mb-6 leading-tight">
                    {block.title}
                  </h3>
                  <p className="font-[family-name:var(--font-atkinson)] text-lg text-[rgba(245,246,252,0.6)] leading-[1.8] mb-8 max-w-2xl">
                    {block.para}
                  </p>

                  <div className="border-t border-[rgba(245,246,252,0.1)]">
                    {block.list.map((item) => (
                      <div
                        key={item.name}
                        className="list-item font-[family-name:var(--font-atkinson)]"
                      >
                        <span className="text-[#F5F6FC]">{item.name}</span>
                        <span className="text-[rgba(245,246,252,0.4)] text-sm">
                          {item.num}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {idx < t.process.blocks.length - 1 && (
              <div className="absolute bottom-0 left-0 right-0 process-separator" />
            )}
          </div>
        ))}
      </section>

      {/* ══════════════════════════════════════════
         ABOUT
         ══════════════════════════════════════════ */}
      <section id="about" className="py-32 px-6 md:px-12 bg-[#000741]">
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

            <div
              className="reveal img-placeholder aspect-[4/3]"
              style={{ transitionDelay: "0.2s" }}
            >
              Team/tech visual — abstract or workspace
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
         QUOTE
         ══════════════════════════════════════════ */}
      <section className="py-32 px-6 md:px-12 bg-[#130A06] relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative">
          <div className="absolute -left-8 -top-8 quote-mark" aria-hidden="true">
            &ldquo;
          </div>

          <div className="relative z-10 border-l-4 border-[#FFC919] pl-8 md:pl-16 reveal">
            <blockquote className="font-[family-name:var(--font-atkinson)] font-bold italic text-2xl md:text-3xl text-[#F5F6FC] leading-[1.6]">
              {t.quote}
            </blockquote>
          </div>

          <div
            className="absolute -right-4 bottom-0 quote-mark rotate-180"
            aria-hidden="true"
          >
            &rdquo;
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
         PRICING
         ══════════════════════════════════════════ */}
      <section id="pricing" className="py-32 px-6 md:px-12 bg-[#130A06]">
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
                className={`pricing-card p-8 reveal ${
                  plan.featured ? "featured" : ""
                }`}
                style={{ transitionDelay: `${idx * 0.15}s` }}
              >
                {plan.featured && (
                  <span className="inline-block bg-[#FFC919] text-[#130A06] font-[family-name:var(--font-lexend)] font-bold text-xs uppercase tracking-widest px-4 py-1.5 mb-6">
                    {lang === "es" ? "MÁS POPULAR" : "MOST POPULAR"}
                  </span>
                )}
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
                    <li
                      key={feature}
                      className="font-[family-name:var(--font-atkinson)] text-[rgba(245,246,252,0.8)] flex items-start gap-3"
                    >
                      <span className="text-[#FFC919] mt-0.5">→</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <a
                  href="#waitlist"
                  className={`block w-full text-center font-[family-name:var(--font-lexend)] font-bold text-sm uppercase tracking-widest py-4 transition-all ${
                    plan.featured
                      ? "bg-[#FFC919] text-[#130A06] hover:bg-[#F5F6FC]"
                      : "border border-[#F5F6FC] text-[#F5F6FC] hover:bg-[#F5F6FC] hover:text-[#130A06]"
                  }`}
                >
                  {t.nav.join}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
         WAITLIST
         ══════════════════════════════════════════ */}
      <section id="waitlist" className="py-32 px-6 md:px-12 bg-[#000741]">
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
              <form
                onSubmit={handleWaitlist}
                className="flex flex-col md:flex-row gap-4 max-w-xl mx-auto"
              >
                <input
                  type="email"
                  required
                  value={wlEmail}
                  onChange={(e) => setWlEmail(e.target.value)}
                  placeholder={t.waitlist.placeholder}
                  className="form-input flex-1 font-[family-name:var(--font-atkinson)]"
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
                <p className="mt-4 text-[#FFC919] text-sm">
                  {t.waitlist.duplicate}
                </p>
              )}
              {wlStatus === "error" && (
                <p className="mt-4 text-red-400 text-sm">
                  {t.waitlist.error}
                </p>
              )}
            </>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════
         FOOTER
         ══════════════════════════════════════════ */}
      <footer className="py-16 px-6 md:px-12 bg-[#0a0504] border-t border-[rgba(245,246,252,0.1)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="font-[family-name:var(--font-lexend)] font-black text-2xl text-[#F5F6FC]">
            N.O.D.E.{" "}
            <span className="text-[rgba(245,246,252,0.5)] font-normal text-sm">
              by Nouvos
            </span>
          </div>

          <div className="flex gap-8 font-[family-name:var(--font-atkinson)] text-sm text-[rgba(245,246,252,0.6)]">
            <a
              href="#services"
              className="hover:text-[#FFC919] transition-colors"
            >
              {lang === "es" ? "Servicios" : "Services"}
            </a>
            <a
              href="#pricing"
              className="hover:text-[#FFC919] transition-colors"
            >
              {lang === "es" ? "Planes" : "Plans"}
            </a>
            <a
              href="mailto:hola@nouvos.one"
              className="hover:text-[#FFC919] transition-colors"
            >
              hola@nouvos.one
            </a>
          </div>

          <p className="font-[family-name:var(--font-atkinson)] text-sm text-[rgba(245,246,252,0.4)]">
            {t.footer.rights}
          </p>
        </div>
      </footer>
    </main>
  );
}
