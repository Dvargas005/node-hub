"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Check, ArrowRight, Loader2, Menu, X } from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */

type Locale = "es" | "en";
type L = { es: string; en: string };

/* ═══════════════════════════════════════════════════════════
   TRANSLATIONS
   ═══════════════════════════════════════════════════════════ */

const t = {
  nav: {
    cta: { es: "Únete al Waitlist", en: "Join Waitlist" } as L,
    links: [
      { label: { es: "Servicios", en: "Services" } as L, href: "#services" },
      { label: { es: "Proceso", en: "Process" } as L, href: "#process" },
      { label: { es: "Planes", en: "Plans" } as L, href: "#pricing" },
      { label: { es: "Contacto", en: "Contact" } as L, href: "#waitlist" },
    ],
  },
  hero: {
    label: "NETWORK ORGANIZED DELIVERY ENGINE",
    bottomLeft: "POWERED BY NOUVOS",
    bottomCenter: "DESIGN · WEB · MARKETING",
    bottomRight: "EST. 2026",
  },
  services: {
    title: { es: "Lo que entregamos", en: "What We Deliver" } as L,
    subtitle: {
      es: "Tres líneas de servicio. Entregables reales.",
      en: "Three service lines. Real deliverables.",
    } as L,
    filters: {
      all: { es: "Todos", en: "All" } as L,
      design: { es: "Diseño", en: "Design" } as L,
      web: { es: "Web", en: "Web" } as L,
      marketing: { es: "Marketing", en: "Marketing" } as L,
    },
    items: [
      {
        name: { es: "Brand Starter", en: "Brand Starter" } as L,
        desc: {
          es: "Logo, paleta, tipografía y brand guidelines listos para usar.",
          en: "Logo, palette, typography and brand guidelines ready to use.",
        } as L,
        cat: "design",
        credits: 2,
        img: "Brand identity — logo, colors, guidelines",
      },
      {
        name: { es: "Landing Page", en: "Landing Page" } as L,
        desc: {
          es: "Página web optimizada para conversión, responsive y rápida.",
          en: "Conversion-optimized, responsive, fast web page.",
        } as L,
        cat: "web",
        credits: 5,
        img: "Landing page — modern web design",
      },
      {
        name: { es: "Content Pack", en: "Content Pack" } as L,
        desc: {
          es: "Artículos, email sequences y copy para tu funnel completo.",
          en: "Articles, email sequences and copy for your full funnel.",
        } as L,
        cat: "marketing",
        credits: 3,
        img: "Content creation — articles, emails",
      },
      {
        name: { es: "Social Pack", en: "Social Pack" } as L,
        desc: {
          es: "Templates, posts programados y estrategia de contenido social.",
          en: "Templates, scheduled posts and social content strategy.",
        } as L,
        cat: "design",
        credits: 3,
        img: "Social media — templates, strategy",
      },
      {
        name: { es: "SEO Foundation", en: "SEO Foundation" } as L,
        desc: {
          es: "Auditoría, keywords, meta tags y estructura técnica optimizada.",
          en: "Audit, keywords, meta tags and optimized technical structure.",
        } as L,
        cat: "web",
        credits: 4,
        img: "SEO — analytics, optimization",
      },
      {
        name: { es: "Campaña Promocional", en: "Promo Campaign" } as L,
        desc: {
          es: "Ads creativos, segmentación y setup para Meta, Google o TikTok.",
          en: "Creative ads, targeting and setup for Meta, Google or TikTok.",
        } as L,
        cat: "marketing",
        credits: 4,
        img: "Ad campaign — creative ads, targeting",
      },
    ],
    creditsLabel: { es: "desde", en: "from" } as L,
    creditsUnit: { es: "créditos", en: "credits" } as L,
  },
  process: {
    blocks: [
      {
        num: "01",
        label: "// 01",
        title: {
          es: "ACTÍVATE EN MENOS DE 24 HORAS",
          en: "START IN UNDER 24 HOURS",
        } as L,
        desc: {
          es: "Elige el plan que se ajuste a tu negocio. Sin contratos largos, sin letra chica, sin sorpresas. Tu equipo digital se activa desde el momento en que te suscribes. Un solo pago mensual te da acceso a diseñadores, developers y marketers dedicados.",
          en: "Pick the plan that fits your business. No long contracts, no fine print, no surprises. Your digital team activates the moment you subscribe. One monthly payment gives you access to dedicated designers, developers, and marketers.",
        } as L,
        list: [
          { name: "Plan Member", num: "01" },
          { name: "Plan Growth", num: "02" },
          { name: "Plan Pro", num: "03" },
          {
            name: { es: "Proyectos Custom", en: "Custom Projects" } as L,
            num: "04",
          },
        ],
      },
      {
        num: "02",
        label: "// 02",
        title: {
          es: "SISTEMA DE BRIEFING GUIADO POR AI",
          en: "AI-GUIDED BRIEFING SYSTEM",
        } as L,
        desc: {
          es: "No necesitas saber de diseño ni de tecnología para pedir lo que necesitas. Nuestro asistente inteligente te guía paso a paso para articular tu solicitud. El resultado es un brief profesional que nuestro equipo puede ejecutar sin idas y vueltas.",
          en: "You don't need to know design or tech to request what you need. Our smart assistant guides you step by step to articulate your request. The result is a professional brief your team can execute without back and forth.",
        } as L,
        list: [
          {
            name: { es: "Asistente Inteligente", en: "Smart Wizard" } as L,
            num: "01",
          },
          {
            name: {
              es: "Auto-categorización",
              en: "Auto-categorization",
            } as L,
            num: "02",
          },
          {
            name: { es: "Archivos Adjuntos", en: "File Attachments" } as L,
            num: "03",
          },
          {
            name: {
              es: "Generación de Brief",
              en: "Brief Generation",
            } as L,
            num: "04",
          },
          {
            name: { es: "Escalación a PM", en: "PM Escalation" } as L,
            num: "05",
          },
        ],
      },
      {
        num: "03",
        label: "// 03",
        title: {
          es: "TU EQUIPO CREATIVO DEDICADO",
          en: "YOUR DEDICATED CREATIVE TEAM",
        } as L,
        desc: {
          es: "Detrás de cada solicitud hay un equipo real. Diseñadores gráficos, desarrolladores asistidos por AI, y community managers especializados. Tu project manager coordina todo — tú solo recibes el trabajo terminado en 48 a 72 horas hábiles.",
          en: "Behind every request is a real team. Graphic designers, AI-assisted developers, and specialized community managers. Your project manager coordinates everything — you just receive finished work in 48 to 72 business hours.",
        } as L,
        list: [
          {
            name: { es: "Diseño Gráfico", en: "Graphic Design" } as L,
            num: "01",
          },
          {
            name: {
              es: "Desarrollo Asistido por AI",
              en: "AI-Assisted Development",
            } as L,
            num: "02",
          },
          {
            name: "Community Management",
            num: "03",
          },
          {
            name: "Project Management",
            num: "04",
          },
          {
            name: {
              es: "Control de Calidad",
              en: "Quality Assurance",
            } as L,
            num: "05",
          },
        ],
      },
      {
        num: "04",
        label: "// 04",
        title: {
          es: "APRUEBA, ITERA, ESCALA",
          en: "APPROVE, ITERATE, SCALE",
        } as L,
        desc: {
          es: "Recibe entregas listas para usar. Si necesitas ajustes, pide revisiones ilimitadas. Aprueba a la primera y gana créditos bonus. A medida que tu negocio crece, tu plan crece contigo — más créditos, más velocidad, más servicios.",
          en: "Receive ready-to-use deliverables. Need adjustments? Request unlimited revisions. Approve on first round and earn bonus credits. As your business grows, your plan grows with you — more credits, more speed, more services.",
        } as L,
        list: [
          {
            name: {
              es: "Revisiones Ilimitadas",
              en: "Unlimited Revisions",
            } as L,
            num: "01",
          },
          {
            name: {
              es: "Bonus Primera Ronda",
              en: "First-Round Bonus",
            } as L,
            num: "02",
          },
          {
            name: {
              es: "Packs de Créditos",
              en: "Credit Packs",
            } as L,
            num: "03",
          },
          {
            name: {
              es: "Upgrades de Plan",
              en: "Plan Upgrades",
            } as L,
            num: "04",
          },
        ],
      },
    ],
  },
  about: {
    title: {
      es: "Por qué existe N.O.D.E.",
      en: "Why N.O.D.E. exists",
    } as L,
    body: {
      es: "N.O.D.E. nace de Nouvos Solutions — una empresa de tecnología logística que lleva años construyendo sistemas para la cadena de suministro global. Sabemos lo que significa operar con equipos distribuidos, gestionar entregas con deadlines reales, y escalar operaciones sin perder calidad. Aplicamos exactamente esa mentalidad a los servicios creativos: procesos claros, entregas predecibles, tecnología que amplifica al talento humano.",
      en: "N.O.D.E. is born from Nouvos Solutions — a logistics technology company that has spent years building systems for the global supply chain. We know what it means to operate with distributed teams, manage deliveries with real deadlines, and scale operations without losing quality. We apply exactly that mindset to creative services: clear processes, predictable deliveries, technology that amplifies human talent.",
    } as L,
    imgDesc: "Team/tech visual — abstract or workspace",
  },
  quote: {
    text: {
      es: "En un mundo lleno de ruido genérico, ayudamos a negocios a construir su presencia digital con un equipo real, procesos probados, y tecnología que acelera todo.",
      en: "In a world full of generic noise, we help businesses build their digital presence with a real team, proven processes, and technology that accelerates everything.",
    } as L,
  },
  pricing: {
    title: { es: "Planes", en: "Plans" } as L,
    subtitle: {
      es: "Simple. Predecible. Sin sorpresas.",
      en: "Simple. Predictable. No surprises.",
    } as L,
    popular: { es: "MÁS POPULAR", en: "MOST POPULAR" } as L,
    cta: { es: "Unirme al Waitlist", en: "Join the Waitlist" } as L,
    period: { es: "/mes", en: "/mo" } as L,
    plans: [
      {
        name: "Member",
        price: "$100",
        features: {
          es: ["5 créditos al mes", "1 request activo", "Turnaround 72h", "Diseño + contenido", "Soporte por email"],
          en: ["5 credits per month", "1 active request", "72h turnaround", "Design + content", "Email support"],
        },
        highlighted: false,
      },
      {
        name: "Growth",
        price: "$190",
        features: {
          es: ["12 créditos al mes", "2 requests activos", "Turnaround 48h", "Diseño + web + contenido", "Soporte prioritario", "Brand strategy session"],
          en: ["12 credits per month", "2 active requests", "48h turnaround", "Design + web + content", "Priority support", "Brand strategy session"],
        },
        highlighted: true,
      },
      {
        name: "Pro",
        price: "$330",
        features: {
          es: ["25 créditos al mes", "3 requests activos", "Turnaround 24-48h", "Diseño + web + marketing", "Slack dedicado", "Monthly strategy call", "Rollover de créditos"],
          en: ["25 credits per month", "3 active requests", "24–48h turnaround", "Design + web + marketing", "Dedicated Slack channel", "Monthly strategy call", "Credit rollover"],
        },
        highlighted: false,
      },
    ],
  },
  waitlist: {
    title: { es: "Sé de los primeros", en: "Be among the first" } as L,
    subtitle: {
      es: "Los primeros 100 miembros reciben créditos extra.",
      en: "The first 100 members get bonus credits.",
    } as L,
    successTitle: { es: "¡Estás en la lista!", en: "You're on the list!" } as L,
    successDesc: {
      es: "Te contactaremos pronto con novedades.",
      en: "We'll reach out soon with updates.",
    } as L,
    labelName: { es: "Nombre *", en: "Name *" } as L,
    labelEmail: { es: "Email *", en: "Email *" } as L,
    labelBusiness: { es: "Negocio", en: "Business" } as L,
    labelAlliance: { es: "Código de alianza", en: "Alliance code" } as L,
    labelLanguage: { es: "Idioma preferido", en: "Preferred language" } as L,
    placeholderName: { es: "Tu nombre", en: "Your name" } as L,
    placeholderEmail: { es: "tu@email.com", en: "you@email.com" } as L,
    placeholderBusiness: { es: "Nombre del negocio", en: "Business name" } as L,
    placeholderAlliance: { es: "Ej: LEN-2024", en: "E.g. LEN-2024" } as L,
    errorGeneric: {
      es: "Algo salió mal. Intenta de nuevo.",
      en: "Something went wrong. Please try again.",
    } as L,
    errorDuplicate: {
      es: "Este email ya está registrado.",
      en: "This email is already registered.",
    } as L,
    sending: { es: "Enviando...", en: "Sending..." } as L,
    submit: { es: "Registrarme", en: "Sign me up" } as L,
  },
  footer: {
    rights: {
      es: "Todos los derechos reservados.",
      en: "All rights reserved.",
    } as L,
  },
};

/* helper to read a name that might be a string or L */
function lx(v: string | L, l: Locale): string {
  return typeof v === "string" ? v : v[l];
}

/* ═══════════════════════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════════════════════ */

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("active");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.1 }
    );
    el.querySelectorAll(".reveal").forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, []);
  return ref;
}

function useScrolled(threshold = 40) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > threshold);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, [threshold]);
  return scrolled;
}

/* ═══════════════════════════════════════════════════════════
   IMAGE PLACEHOLDER
   ═══════════════════════════════════════════════════════════ */

function Img({ desc, ratio = "16/9" }: { desc: string; ratio?: string }) {
  return (
    <div
      className="w-full border border-dashed border-white/20 bg-white/[0.05] flex items-center justify-center text-center"
      style={{ aspectRatio: ratio }}
    >
      <span className="text-white/30 text-sm px-6 leading-relaxed">
        Image placeholder — {desc}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   NAV
   ═══════════════════════════════════════════════════════════ */

function Nav({
  l,
  locale,
  setLocale,
}: {
  l: Locale;
  locale: Locale;
  setLocale: (v: Locale) => void;
}) {
  const scrolled = useScrolled();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav
        className={`fixed top-0 w-full z-50 flex items-center justify-between px-[5%] md:px-[8%] py-5 transition-all duration-300 ${
          scrolled
            ? "bg-asphalt-black/80 backdrop-blur-xl"
            : "bg-gradient-to-b from-asphalt-black/70 to-transparent"
        }`}
      >
        <a
          href="#"
          className="font-[family-name:var(--font-lexend)] font-black text-xl tracking-tight"
        >
          N.O.D.E.
        </a>

        <div className="flex items-center gap-4">
          {/* Language toggle */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setLocale("es")}
              className={`text-lg leading-none transition-opacity ${
                locale === "es"
                  ? "opacity-100"
                  : "opacity-40 hover:opacity-70"
              }`}
              aria-label="Español"
            >
              🇲🇽
            </button>
            <button
              onClick={() => setLocale("en")}
              className={`text-lg leading-none transition-opacity ${
                locale === "en"
                  ? "opacity-100"
                  : "opacity-40 hover:opacity-70"
              }`}
              aria-label="English"
            >
              🇺🇸
            </button>
          </div>

          <a
            href="#waitlist"
            className="hidden sm:inline-block border border-white/30 text-sm uppercase tracking-[0.12em] px-5 py-2.5 hover:border-gold-bar hover:text-gold-bar transition-colors"
          >
            {t.nav.cta[l]}
          </a>

          <button
            onClick={() => setMenuOpen(true)}
            className="p-1 text-white/70 hover:text-white transition-colors"
            aria-label="Menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* Full-screen menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] bg-asphalt-black flex flex-col items-center justify-center gap-8">
          <button
            onClick={() => setMenuOpen(false)}
            className="absolute top-5 right-[5%] md:right-[8%] text-white/70 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={28} />
          </button>
          {t.nav.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="font-[family-name:var(--font-lexend)] font-bold text-3xl md:text-5xl text-white/80 hover:text-gold-bar transition-colors"
            >
              {link.label[l]}
            </a>
          ))}
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   1. HERO
   ═══════════════════════════════════════════════════════════ */

function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background image placeholder */}
      <div className="absolute inset-0 opacity-20">
        <Img desc="Hero visual — creative/tech imagery, dark mood" ratio="auto" />
      </div>

      {/* Center content */}
      <div className="relative z-10 text-center px-4">
        <p className="hero-fade text-[0.8rem] uppercase tracking-[0.3em] text-gold-bar mb-6">
          {t.hero.label}
        </p>
        <h1 className="hero-fade-d1 font-[family-name:var(--font-lexend)] font-black text-[clamp(6rem,15vw,12rem)] leading-[0.9] tracking-tight text-white">
          N.O.D.E.
        </h1>
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-[5%] md:px-[8%] pb-8 text-[0.75rem] uppercase tracking-[0.15em] text-white/40">
        <span className="hero-fade-d2">{t.hero.bottomLeft}</span>
        <span className="hero-fade-d2 hidden sm:block">
          {t.hero.bottomCenter}
        </span>
        <span className="hero-fade-d3">{t.hero.bottomRight}</span>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   2. SERVICES
   ═══════════════════════════════════════════════════════════ */

type FilterCat = "all" | "design" | "web" | "marketing";
const filterKeys: FilterCat[] = ["all", "design", "web", "marketing"];

function Services({ l }: { l: Locale }) {
  const ref = useReveal();
  const [active, setActive] = useState<FilterCat>("all");

  const filtered =
    active === "all"
      ? t.services.items
      : t.services.items.filter((s) => s.cat === active);

  return (
    <section ref={ref} id="services" className="py-28 md:py-40">
      <div className="container-w">
        <h2 className="reveal font-[family-name:var(--font-lexend)] font-black text-[clamp(2rem,4vw,3rem)] tracking-tight">
          {t.services.title[l]}
        </h2>
        <p
          className="reveal mt-3 text-[1.1rem] text-white/40 tracking-wide"
          style={{ transitionDelay: "0.15s" }}
        >
          {t.services.subtitle[l]}
        </p>

        {/* Filter tabs */}
        <div
          className="reveal mt-12 flex gap-6 md:gap-8 border-b border-white/10 pb-0"
          style={{ transitionDelay: "0.3s" }}
        >
          {filterKeys.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={`pb-3 text-sm uppercase tracking-[0.15em] transition-all border-b-2 -mb-[2px] ${
                active === f
                  ? "border-gold-bar text-white"
                  : "border-transparent text-white/40 hover:text-white/70"
              }`}
            >
              {t.services.filters[f][l]}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s, i) => (
            <div
              key={s.name.en + i}
              className="reveal group relative overflow-hidden"
              style={{ transitionDelay: `${0.15 * (i + 1)}s` }}
            >
              <Img desc={s.img} />
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-asphalt-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                <p className="text-white/70 text-sm leading-relaxed">
                  {s.desc[l]}
                </p>
              </div>
              {/* Bottom label — always visible */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-asphalt-black/90 to-transparent p-5 pt-10 flex justify-between items-end">
                <span className="font-[family-name:var(--font-lexend)] font-bold text-lg">
                  {s.name[l]}
                </span>
                <span className="text-gold-bar text-xs uppercase tracking-[0.1em]">
                  {t.services.creditsLabel[l]} {s.credits}{" "}
                  {t.services.creditsUnit[l]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   3. HOW IT WORKS (PROCESS) — Brandin Expertise calco
   ═══════════════════════════════════════════════════════════ */

function ProcessBlock({
  block,
  l,
  index,
}: {
  block: (typeof t.process.blocks)[0];
  l: Locale;
  index: number;
}) {
  return (
    <div
      className="reveal border-t border-white/10 py-20 md:py-32 flex flex-col md:flex-row gap-12 md:gap-0"
      style={{ transitionDelay: `${0.15 * index}s` }}
    >
      {/* Left: giant number */}
      <div className="md:w-[40%] flex items-end">
        <span className="text-stroke font-[family-name:var(--font-lexend)] font-black text-[clamp(10rem,20vw,18rem)] leading-[0.8] select-none">
          {block.num}
        </span>
      </div>

      {/* Right: content */}
      <div className="md:w-[60%] md:pl-12 flex flex-col justify-center">
        <span className="text-gold-bar text-[0.8rem] uppercase tracking-[0.25em] mb-4">
          {block.label}
        </span>
        <h3 className="font-[family-name:var(--font-lexend)] font-bold text-[clamp(1.5rem,3vw,2.5rem)] uppercase tracking-wide leading-tight">
          {block.title[l]}
        </h3>
        <p className="mt-6 text-[1.1rem] text-white/50 leading-[1.8] max-w-xl">
          {block.desc[l]}
        </p>

        {/* List */}
        <ul className="mt-10 border-t border-white/10">
          {block.list.map((item) => (
            <li
              key={typeof item.name === "string" ? item.name : item.name.en}
              className="flex justify-between items-center py-4 border-b border-white/[0.06] text-sm"
            >
              <span className="text-white/70 tracking-wide">
                {lx(item.name, l)}
              </span>
              <span className="text-white/30 font-[family-name:var(--font-lexend)] font-bold">
                {item.num}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Process({ l }: { l: Locale }) {
  const ref = useReveal();
  return (
    <section ref={ref} id="process" className="py-20 md:py-32">
      <div className="container-w">
        {t.process.blocks.map((block, i) => (
          <ProcessBlock key={block.num} block={block} l={l} index={i} />
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   4. ABOUT / WHY NOUVOS
   ═══════════════════════════════════════════════════════════ */

function About({ l }: { l: Locale }) {
  const ref = useReveal();
  return (
    <section ref={ref} className="bg-midnight-express py-28 md:py-40">
      <div className="container-w flex flex-col lg:flex-row gap-14 lg:gap-20 items-start">
        <div className="lg:w-[55%]">
          <h2 className="reveal font-[family-name:var(--font-lexend)] font-black text-[clamp(2rem,4vw,3rem)] tracking-tight">
            {t.about.title[l]}
          </h2>
          <p
            className="reveal mt-8 text-[1.2rem] md:text-[1.3rem] text-white/60 leading-[1.9]"
            style={{ transitionDelay: "0.15s" }}
          >
            {t.about.body[l]}
          </p>
        </div>
        <div className="reveal lg:w-[45%]" style={{ transitionDelay: "0.3s" }}>
          <Img desc={t.about.imgDesc} ratio="4/3" />
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   5. QUOTE
   ═══════════════════════════════════════════════════════════ */

function Quote({ l }: { l: Locale }) {
  const ref = useReveal();
  return (
    <section ref={ref} className="py-24 md:py-36">
      <div className="container-w max-w-4xl mx-auto flex gap-8">
        {/* Gold accent bar */}
        <div className="reveal hidden md:block w-1 bg-gold-bar flex-shrink-0" />
        <blockquote className="reveal" style={{ transitionDelay: "0.15s" }}>
          <p className="font-[family-name:var(--font-lexend)] font-bold text-[clamp(1.3rem,2.5vw,2rem)] leading-[1.5] text-white/90 italic">
            &ldquo;{t.quote.text[l]}&rdquo;
          </p>
        </blockquote>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   6. PRICING
   ═══════════════════════════════════════════════════════════ */

function Pricing({ l }: { l: Locale }) {
  const ref = useReveal();
  return (
    <section ref={ref} id="pricing" className="py-28 md:py-40">
      <div className="container-w">
        <h2 className="reveal font-[family-name:var(--font-lexend)] font-black text-[clamp(2rem,4vw,3rem)] tracking-tight text-center">
          {t.pricing.title[l]}
        </h2>
        <p
          className="reveal mt-3 text-[1.1rem] text-white/40 text-center tracking-wide"
          style={{ transitionDelay: "0.15s" }}
        >
          {t.pricing.subtitle[l]}
        </p>

        <div className="mt-16 grid gap-5 md:grid-cols-3 items-start">
          {t.pricing.plans.map((plan, i) => (
            <div
              key={plan.name}
              className={`reveal p-8 md:p-10 flex flex-col backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 ${
                plan.highlighted
                  ? "border-2 border-gold-bar bg-white/[0.05] relative hover:shadow-[0_20px_50px_rgba(255,201,25,0.1)]"
                  : "border border-white/10 bg-white/[0.03] hover:border-white/25"
              }`}
              style={{ transitionDelay: `${0.15 * (i + 1)}s` }}
            >
              {plan.highlighted && (
                <span className="absolute -top-4 left-8 bg-gold-bar text-asphalt-black font-bold text-xs uppercase tracking-[0.1em] px-4 py-1.5">
                  {t.pricing.popular[l]}
                </span>
              )}
              <h3 className="font-[family-name:var(--font-lexend)] font-bold text-xl uppercase tracking-wide">
                {plan.name}
              </h3>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="font-[family-name:var(--font-lexend)] font-black text-[3.5rem] leading-none">
                  {plan.price}
                </span>
                <span className="text-white/30 text-sm">
                  {t.pricing.period[l]}
                </span>
              </div>
              <ul className="mt-8 space-y-3 flex-1">
                {plan.features[l].map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-3 text-white/50 text-[0.95rem]"
                  >
                    <Check
                      size={16}
                      className="mt-1 text-gold-bar flex-shrink-0"
                    />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#waitlist"
                className={`mt-10 block text-center font-bold py-4 text-sm uppercase tracking-[0.1em] transition-all duration-300 ${
                  plan.highlighted
                    ? "bg-gold-bar text-asphalt-black hover:brightness-110"
                    : "border border-white/20 text-white hover:border-gold-bar hover:text-gold-bar"
                }`}
              >
                {t.pricing.cta[l]}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   7. WAITLIST
   ═══════════════════════════════════════════════════════════ */

function WaitlistSection({ l }: { l: Locale }) {
  const ref = useReveal();
  const [form, setForm] = useState({
    name: "",
    email: "",
    businessName: "",
    allianceCode: "",
    language: "es" as Locale,
  });
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error" | "duplicate"
  >("idle");

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setStatus("loading");
      try {
        const res = await fetch("/api/waitlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.status === 409) {
          setStatus("duplicate");
          return;
        }
        if (!res.ok) throw new Error();
        setStatus("success");
      } catch {
        setStatus("error");
      }
    },
    [form]
  );

  const inputCls =
    "w-full bg-transparent border border-white/15 px-5 py-4 text-white placeholder:text-white/25 focus:outline-none focus:border-gold-bar transition-colors";

  return (
    <section
      ref={ref}
      id="waitlist"
      className="bg-midnight-express py-28 md:py-40"
    >
      <div className="container-w max-w-2xl mx-auto">
        <h2 className="reveal font-[family-name:var(--font-lexend)] font-black text-[clamp(2rem,4vw,3rem)] tracking-tight text-center">
          {t.waitlist.title[l]}
        </h2>
        <p
          className="reveal mt-3 text-[1.1rem] text-white/40 text-center tracking-wide"
          style={{ transitionDelay: "0.15s" }}
        >
          {t.waitlist.subtitle[l]}
        </p>

        {status === "success" ? (
          <div className="reveal active mt-14 text-center p-12 border border-gold-bar/20 bg-white/[0.03]">
            <Check size={48} className="mx-auto text-gold-bar" />
            <p className="mt-4 font-[family-name:var(--font-lexend)] font-bold text-2xl">
              {t.waitlist.successTitle[l]}
            </p>
            <p className="mt-2 text-white/50">
              {t.waitlist.successDesc[l]}
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="reveal mt-14 space-y-5"
            style={{ transitionDelay: "0.3s" }}
          >
            <div>
              <label className="block text-xs uppercase tracking-[0.15em] font-bold mb-2 text-white/40">
                {t.waitlist.labelName[l]}
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputCls}
                placeholder={t.waitlist.placeholderName[l]}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-[0.15em] font-bold mb-2 text-white/40">
                {t.waitlist.labelEmail[l]}
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputCls}
                placeholder={t.waitlist.placeholderEmail[l]}
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-xs uppercase tracking-[0.15em] font-bold mb-2 text-white/40">
                  {t.waitlist.labelBusiness[l]}
                </label>
                <input
                  type="text"
                  value={form.businessName}
                  onChange={(e) =>
                    setForm({ ...form, businessName: e.target.value })
                  }
                  className={inputCls}
                  placeholder={t.waitlist.placeholderBusiness[l]}
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-[0.15em] font-bold mb-2 text-white/40">
                  {t.waitlist.labelAlliance[l]}
                </label>
                <input
                  type="text"
                  value={form.allianceCode}
                  onChange={(e) =>
                    setForm({ ...form, allianceCode: e.target.value })
                  }
                  className={inputCls}
                  placeholder={t.waitlist.placeholderAlliance[l]}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-[0.15em] font-bold mb-2 text-white/40">
                {t.waitlist.labelLanguage[l]}
              </label>
              <select
                value={form.language}
                onChange={(e) =>
                  setForm({ ...form, language: e.target.value as Locale })
                }
                className={inputCls}
              >
                <option value="es" className="bg-asphalt-black">
                  Español
                </option>
                <option value="en" className="bg-asphalt-black">
                  English
                </option>
              </select>
            </div>

            {status === "error" && (
              <p className="text-red-400 text-sm">
                {t.waitlist.errorGeneric[l]}
              </p>
            )}
            {status === "duplicate" && (
              <p className="text-gold-bar text-sm">
                {t.waitlist.errorDuplicate[l]}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full bg-gold-bar text-asphalt-black font-bold py-5 text-sm uppercase tracking-[0.1em] hover:brightness-110 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {status === "loading" ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t.waitlist.sending[l]}
                </>
              ) : (
                <>
                  {t.waitlist.submit[l]}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   8. FOOTER
   ═══════════════════════════════════════════════════════════ */

function Footer({ l }: { l: Locale }) {
  return (
    <footer className="border-t border-white/10 px-[5%] md:px-[8%] py-14">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-8 md:flex-row md:justify-between md:items-center">
        <div>
          <p className="font-[family-name:var(--font-lexend)] font-black text-xl">
            N.O.D.E.
          </p>
          <p className="mt-1 text-xs text-white/30 uppercase tracking-[0.15em]">
            by Nouvos
          </p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs uppercase tracking-[0.12em] text-white/40">
          <a href="#services" className="hover:text-gold-bar transition-colors">
            {l === "es" ? "Servicios" : "Services"}
          </a>
          <a href="#process" className="hover:text-gold-bar transition-colors">
            {l === "es" ? "Proceso" : "Process"}
          </a>
          <a href="#pricing" className="hover:text-gold-bar transition-colors">
            {l === "es" ? "Planes" : "Plans"}
          </a>
          <a
            href="mailto:hola@nouvos.one"
            className="hover:text-gold-bar transition-colors"
          >
            hola@nouvos.one
          </a>
        </div>
        <p className="text-xs text-white/25">
          © 2026 Nouvos Solutions LLC. {t.footer.rights[l]}
        </p>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════ */

export default function Home() {
  const [locale, setLocale] = useState<Locale>("es");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("node-locale") as Locale | null;
    if (saved === "en" || saved === "es") setLocale(saved);
  }, []);

  useEffect(() => {
    if (mounted) localStorage.setItem("node-locale", locale);
  }, [locale, mounted]);

  return (
    <main>
      <Nav l={locale} locale={locale} setLocale={setLocale} />
      <Hero />
      <Services l={locale} />
      <Process l={locale} />
      <About l={locale} />
      <Quote l={locale} />
      <Pricing l={locale} />
      <WaitlistSection l={locale} />
      <Footer l={locale} />
    </main>
  );
}
