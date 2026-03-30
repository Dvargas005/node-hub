"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Palette,
  Code2,
  Megaphone,
  Check,
  ArrowRight,
  Loader2,
} from "lucide-react";

/* ═══════════════════════════════════════════
   TRANSLATIONS
   ═══════════════════════════════════════════ */

type Locale = "es" | "en";

const t = {
  hero: {
    title1: { es: "Tu equipo digital.", en: "Your digital team." },
    title2: { es: "Una suscripción.", en: "One subscription." },
    subtitle: {
      es: "Diseño, desarrollo y marketing — todo lo que tu negocio necesita para crecer online, sin contratos largos ni sorpresas.",
      en: "Design, web & marketing for your business. No contracts. No surprises.",
    },
    cta1: { es: "Unirme al Waitlist", en: "Join the Waitlist" },
    cta2: { es: "Ver Planes", en: "See Plans" },
  },
  problema: {
    title: { es: "El problema", en: "Digital talent is out of reach" },
    subtitle: {
      es: "Crecer en digital no debería ser tan complicado.",
      en: "Growing digitally shouldn't be this complicated.",
    },
    blocks: [
      {
        title: { es: "Costos impredecibles", en: "Unpredictable costs" },
        desc: {
          es: "Contratar freelancers o agencias es una lotería. Un logo puede costar entre $300 y $800. Una landing page hasta $1,500. Y eso sin contar revisiones, idas y vueltas, ni el tiempo que pierdes buscando opciones.",
          en: "Hiring freelancers or agencies is a gamble. A logo can cost between $300 and $800. A landing page up to $1,500. And that's before revisions, back and forth, and the time you lose shopping around.",
        },
      },
      {
        title: { es: "Sin acceso a talento", en: "No access to talent" },
        desc: {
          es: "La mayoría de los micro-negocios no tienen equipo digital. Diseñadores, desarrolladores y marketers están fuera del presupuesto. Terminas haciéndolo tú mismo o simplemente no se hace.",
          en: "Most micro-businesses have no digital team. Designers, developers, and marketers are out of budget. You end up doing it yourself — or it simply doesn't get done.",
        },
      },
      {
        title: { es: "Barrera de idioma", en: "Language barriers" },
        desc: {
          es: "Si tu negocio opera en español, encontrar soporte bilingüe es raro y costoso. La mayoría de los servicios disponibles son solo en inglés. Tu negocio necesita comunicación clara en tu idioma.",
          en: "If your business operates in Spanish, finding bilingual support is rare and expensive. Most services are English-only. Your business needs clear communication in your language.",
        },
      },
    ],
  },
  solucion: {
    title: { es: "La solución", en: "One subscription. Three service lines." },
    subtitle: {
      es: "Un equipo completo bajo una sola suscripción mensual.",
      en: "A complete team under one monthly subscription.",
    },
    services: [
      {
        title: { es: "Diseño", en: "Design & Branding" },
        items: {
          es: ["Identidad visual", "UI/UX para web y mobile", "Social media assets", "Presentaciones", "Brand guidelines"],
          en: ["Visual identity", "UI/UX for web & mobile", "Social media assets", "Presentations", "Brand guidelines"],
        },
      },
      {
        title: { es: "Web", en: "Web Development" },
        items: {
          es: ["Landing pages", "Sitios corporativos", "E-commerce", "Web apps", "Mantenimiento y hosting"],
          en: ["Landing pages", "Corporate websites", "E-commerce", "Web apps", "Maintenance & hosting"],
        },
      },
      {
        title: { es: "Marketing", en: "Digital Marketing" },
        items: {
          es: ["SEO y contenido", "Email marketing", "Gestión de redes sociales", "Paid ads", "Estrategia digital"],
          en: ["SEO & content", "Email marketing", "Social media management", "Paid ads", "Digital strategy"],
        },
      },
    ],
  },
  funciona: {
    title: { es: "Cómo funciona", en: "Four steps. Fully managed." },
    steps: [
      {
        title: { es: "Suscríbete", en: "Subscribe" },
        desc: {
          es: "Elige el plan que se adapte a tu negocio. Sin contratos largos, sin letra chica. Tu equipo digital se activa en menos de 24 horas desde tu primera suscripción.",
          en: "Pick the plan that fits your business. No long contracts, no fine print. Your digital team activates in under 24 hours from your first subscription.",
        },
      },
      {
        title: { es: "Describe", en: "Describe what you need" },
        desc: {
          es: "Abre tus requests: diseños, páginas, campañas, todo desde un solo canal. Nuestro asistente inteligente te guía para que el brief quede perfecto a la primera.",
          en: "Submit your requests: designs, pages, campaigns — all from one channel. Our smart assistant guides you so the brief is perfect from the start.",
        },
      },
      {
        title: { es: "Nosotros hacemos", en: "We deliver" },
        desc: {
          es: "Tu equipo creativo asignado trabaja en tus requests con tiempos de entrega de 48 a 72 horas hábiles. Diseñadores, developers y marketers — sin que tengas que coordinar nada.",
          en: "Your assigned creative team works on your requests with 48–72 business hour turnarounds. Designers, developers, and marketers — without you having to coordinate a thing.",
        },
      },
      {
        title: { es: "Recibe", en: "Receive" },
        desc: {
          es: "Entrega lista para usar. Revisiones ilimitadas hasta que estés satisfecho. Tus archivos, tus diseños, listos para publicar o imprimir.",
          en: "Ready-to-use deliverables. Unlimited revisions until you're satisfied. Your files, your designs, ready to publish or print.",
        },
      },
    ],
  },
  planes: {
    title: { es: "Planes", en: "Plans" },
    subtitle: {
      es: "Simple. Predecible. Sin sorpresas.",
      en: "Simple. Predictable. No surprises.",
    },
    popular: { es: "MÁS POPULAR", en: "MOST POPULAR" },
    cta: { es: "Unirme al Waitlist", en: "Join the Waitlist" },
    period: { es: "/mes", en: "/mo" },
    plans: [
      {
        name: "Member",
        price: "$100",
        features: {
          es: ["5 créditos al mes", "1 request activo a la vez", "Turnaround 72h", "Diseño + contenido", "Soporte por email"],
          en: ["5 credits per month", "1 active request at a time", "72h turnaround", "Design + content", "Email support"],
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
    title: { es: "Sé de los primeros", en: "Be among the first" },
    subtitle: {
      es: "Los primeros 100 miembros reciben créditos extra.",
      en: "The first 100 members get bonus credits.",
    },
    successTitle: { es: "¡Estás en la lista!", en: "You're on the list!" },
    successDesc: {
      es: "Te contactaremos pronto con novedades.",
      en: "We'll reach out soon with updates.",
    },
    labelName: { es: "Nombre *", en: "Name *" },
    labelEmail: { es: "Email *", en: "Email *" },
    labelBusiness: { es: "Negocio", en: "Business" },
    labelAlliance: { es: "Código de alianza", en: "Alliance code" },
    labelLanguage: { es: "Idioma preferido", en: "Preferred language" },
    placeholderName: { es: "Tu nombre", en: "Your name" },
    placeholderEmail: { es: "tu@email.com", en: "you@email.com" },
    placeholderBusiness: { es: "Nombre del negocio", en: "Business name" },
    placeholderAlliance: { es: "Ej: LEN-2024", en: "E.g. LEN-2024" },
    errorGeneric: {
      es: "Algo salió mal. Intenta de nuevo.",
      en: "Something went wrong. Please try again.",
    },
    errorDuplicate: {
      es: "Este email ya está registrado. ¡Ya estás en la lista!",
      en: "This email is already registered. You're already on the list!",
    },
    sending: { es: "Enviando...", en: "Sending..." },
    submit: { es: "Registrarme", en: "Sign me up" },
  },
  footer: {
    rights: {
      es: "Todos los derechos reservados.",
      en: "All rights reserved.",
    },
  },
};

/* ═══════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════ */

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const children = el.querySelectorAll(".reveal, .reveal-scale");
    children.forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, []);

  return ref;
}

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasRun.current) {
          hasRun.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return { ref, value };
}

/* ═══════════════════════════════════════════
   LANGUAGE TOGGLE
   ═══════════════════════════════════════════ */

function LanguageToggle({
  locale,
  setLocale,
}: {
  locale: Locale;
  setLocale: (l: Locale) => void;
}) {
  return (
    <div className="fixed top-5 right-5 z-50 flex items-center gap-1 bg-asphalt-black/80 backdrop-blur-sm border border-ice-white/10 rounded-full px-2 py-1.5">
      <button
        onClick={() => setLocale("es")}
        className={`text-xl leading-none px-1.5 py-0.5 rounded-full transition-opacity ${
          locale === "es" ? "opacity-100" : "opacity-40 hover:opacity-70"
        }`}
        aria-label="Español"
      >
        🇲🇽
      </button>
      <button
        onClick={() => setLocale("en")}
        className={`text-xl leading-none px-1.5 py-0.5 rounded-full transition-opacity ${
          locale === "en" ? "opacity-100" : "opacity-40 hover:opacity-70"
        }`}
        aria-label="English"
      >
        🇺🇸
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ANIMATED SVG — Hero Background
   ═══════════════════════════════════════════ */

function HeroSVG() {
  const nodes = [
    { cx: 50, cy: 40, r: 5 },
    { cx: 180, cy: 20, r: 4 },
    { cx: 320, cy: 55, r: 6 },
    { cx: 130, cy: 110, r: 4 },
    { cx: 260, cy: 100, r: 5 },
    { cx: 400, cy: 35, r: 3 },
    { cx: 30, cy: 130, r: 3 },
    { cx: 370, cy: 125, r: 4 },
    { cx: 100, cy: 70, r: 3 },
    { cx: 220, cy: 65, r: 4 },
    { cx: 470, cy: 70, r: 5 },
    { cx: 500, cy: 120, r: 3 },
    { cx: 440, cy: 140, r: 4 },
    { cx: 150, cy: 150, r: 3 },
    { cx: 300, cy: 145, r: 4 },
  ];

  const edges = [
    [0, 1], [1, 2], [0, 3], [1, 4], [2, 5], [3, 4],
    [6, 0], [6, 3], [4, 7], [2, 7], [0, 8], [8, 3],
    [8, 9], [9, 4], [1, 9], [5, 10], [10, 11], [11, 12],
    [7, 12], [2, 10], [3, 13], [13, 14], [14, 7], [4, 14],
    [6, 13], [5, 7],
  ];

  return (
    <svg
      viewBox="0 0 540 170"
      fill="none"
      className="absolute inset-0 w-full h-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].cx}
          y1={nodes[a].cy}
          x2={nodes[b].cx}
          y2={nodes[b].cy}
          stroke="#FFC919"
          strokeWidth="0.8"
          strokeOpacity="0.25"
          className="hero-line"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
      {nodes.map((n, i) => (
        <circle
          key={i}
          cx={n.cx}
          cy={n.cy}
          r={n.r}
          fill="#FFC919"
          opacity="0.6"
          className="hero-node"
          style={
            {
              animationDelay: `${i * 0.3}s`,
              "--base-r": `${n.r}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </svg>
  );
}

/* ═══════════════════════════════════════════
   1. HERO — Layered: SVG → Giant N.O.D.E. → Content
   ═══════════════════════════════════════════ */

function Hero({ l }: { l: Locale }) {
  return (
    <section className="relative bg-asphalt-black text-ice-white section-padding overflow-hidden min-h-[80vh] flex items-center">
      {/* Layer 1: Animated SVG network */}
      <div className="absolute inset-0 opacity-40">
        <HeroSVG />
      </div>

      {/* Layer 2: Giant N.O.D.E. text */}
      <span
        className="absolute inset-0 flex items-center justify-center font-[family-name:var(--font-lexend)] font-black text-[clamp(8rem,20vw,15rem)] text-gold-bar/[0.06] select-none pointer-events-none leading-none"
        aria-hidden="true"
      >
        N.O.D.E.
      </span>

      {/* Layer 3: Actual content */}
      <div className="container-narrow relative z-10">
        <h1 className="hero-fade font-[family-name:var(--font-lexend)] font-black text-[clamp(3rem,6vw,5rem)] leading-[1.05] tracking-tight max-w-3xl">
          {t.hero.title1[l]}
          <br />
          <span className="text-gold-bar">{t.hero.title2[l]}</span>
        </h1>
        <p className="hero-fade-delay-1 mt-6 text-lg md:text-xl text-ice-white/60 max-w-lg leading-relaxed tracking-wide">
          {t.hero.subtitle[l]}
        </p>
        <div className="hero-fade-delay-2 mt-10 flex flex-wrap gap-4">
          <a
            href="#waitlist"
            className="inline-flex items-center gap-2 bg-gold-bar text-asphalt-black font-bold px-8 py-4 text-lg hover:brightness-110 transition-all"
          >
            {t.hero.cta1[l]}
            <ArrowRight size={20} />
          </a>
          <a
            href="#planes"
            className="inline-flex items-center gap-2 border-2 border-ice-white/20 text-ice-white px-8 py-4 text-lg hover:border-ice-white/50 transition-all"
          >
            {t.hero.cta2[l]}
          </a>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   2. EL PROBLEMA — Editorial Blocks
   ═══════════════════════════════════════════ */

const problemNumbers = ["01", "02", "03"];

function ElProblema({ l }: { l: Locale }) {
  const ref = useReveal();

  return (
    <section ref={ref} className="bg-ice-white section-padding">
      <div className="container-narrow">
        <h2 className="reveal font-[family-name:var(--font-lexend)] font-black text-[clamp(2rem,4vw,3rem)] tracking-tight text-midnight-express">
          {t.problema.title[l]}
        </h2>
        <p
          className="reveal mt-4 text-[1.1rem] text-asphalt-black/50 max-w-xl tracking-wide leading-relaxed"
          style={{ transitionDelay: "0.15s" }}
        >
          {t.problema.subtitle[l]}
        </p>
        <div className="mt-16 divide-y divide-asphalt-black/10">
          {t.problema.blocks.map((block, i) => (
            <div
              key={i}
              className="reveal editorial-block py-12 md:py-16 pl-4 md:pl-8 flex flex-col md:flex-row md:items-start gap-6 md:gap-16"
              style={{ transitionDelay: `${0.15 * (i + 1)}s` }}
            >
              <span
                className="editorial-number font-[family-name:var(--font-lexend)] font-black text-[5rem] md:text-[6rem] leading-none text-gold-bar/10 select-none shrink-0 md:w-48"
                aria-hidden="true"
              >
                // {problemNumbers[i]}
              </span>
              <div className="max-w-2xl">
                <h3 className="font-[family-name:var(--font-lexend)] font-bold text-xl md:text-2xl text-asphalt-black">
                  {block.title[l]}
                </h3>
                <p className="mt-3 text-[1.1rem] text-asphalt-black/55 leading-[1.8]">
                  {block.desc[l]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   3. LA SOLUCIÓN — More Breathing Room
   ═══════════════════════════════════════════ */

const serviceIcons = [Palette, Code2, Megaphone];

function LaSolucion({ l }: { l: Locale }) {
  const ref = useReveal();

  return (
    <section ref={ref} className="bg-midnight-express text-ice-white px-6 py-28 md:px-12 md:py-36 lg:px-20 lg:py-44">
      <div className="container-narrow">
        <h2 className="reveal font-[family-name:var(--font-lexend)] font-black text-[clamp(2rem,4vw,3rem)] tracking-tight">
          {t.solucion.title[l]}
        </h2>
        <p
          className="reveal mt-4 text-[1.1rem] text-ice-white/40 max-w-xl tracking-wide"
          style={{ transitionDelay: "0.15s" }}
        >
          {t.solucion.subtitle[l]}
        </p>
        <div className="mt-16 grid md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-ice-white/10">
          {t.solucion.services.map((s, i) => {
            const Icon = serviceIcons[i];
            return (
              <div
                key={i}
                className="reveal py-10 md:py-0 md:px-10 first:md:pl-0 last:md:pr-0"
                style={{ transitionDelay: `${0.15 * (i + 1)}s` }}
              >
                <Icon size={36} className="text-gold-bar" strokeWidth={1.5} />
                <h3 className="mt-5 font-[family-name:var(--font-lexend)] font-bold text-2xl md:text-[1.75rem]">
                  {s.title[l]}
                </h3>
                <ul className="mt-6 space-y-3">
                  {s.items[l].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-ice-white/60 text-[1.05rem]"
                    >
                      <Check
                        size={18}
                        className="mt-1 text-gold-bar flex-shrink-0"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   4. CÓMO FUNCIONA — Editorial Blocks + Counter
   ═══════════════════════════════════════════ */

const stepTargets = [1, 2, 3, 4];

function StepBlock({
  step,
  index,
  l,
}: {
  step: (typeof t.funciona.steps)[0];
  index: number;
  l: Locale;
}) {
  const counter = useCountUp(stepTargets[index]);
  const display = String(counter.value).padStart(2, "0");

  return (
    <div
      className="reveal editorial-block relative overflow-hidden p-8 md:p-10 min-h-[240px] flex flex-col justify-end border border-asphalt-black/[0.06]"
      style={{ transitionDelay: `${0.15 * (index + 1)}s` }}
    >
      <span
        ref={counter.ref}
        className="editorial-number absolute top-0 right-4 font-[family-name:var(--font-lexend)] font-black text-[6rem] md:text-[10rem] leading-none text-gold-bar/[0.08] select-none pointer-events-none"
        aria-hidden="true"
      >
        <span className="text-[0.4em] opacity-30 font-sans">// </span>
        {display}
      </span>
      <div className="relative z-10">
        <h3 className="font-[family-name:var(--font-lexend)] font-bold text-xl md:text-2xl text-asphalt-black">
          {step.title[l]}
        </h3>
        <p className="mt-3 text-[1.05rem] text-asphalt-black/55 leading-[1.8] max-w-md">
          {step.desc[l]}
        </p>
      </div>
    </div>
  );
}

function ComoFunciona({ l }: { l: Locale }) {
  const ref = useReveal();

  return (
    <section ref={ref} className="bg-ice-white section-padding">
      <div className="container-narrow">
        <h2 className="reveal font-[family-name:var(--font-lexend)] font-black text-[clamp(2rem,4vw,3rem)] tracking-tight text-midnight-express">
          {t.funciona.title[l]}
        </h2>
        <div className="mt-16 grid gap-4 sm:grid-cols-2">
          {t.funciona.steps.map((step, i) => (
            <StepBlock key={i} step={step} index={i} l={l} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   5. PLANES — Premium Glassmorphism
   ═══════════════════════════════════════════ */

function Planes({ l }: { l: Locale }) {
  const ref = useReveal();

  return (
    <section
      ref={ref}
      id="planes"
      className="bg-midnight-express text-ice-white section-padding"
    >
      <div className="container-narrow">
        <h2 className="reveal font-[family-name:var(--font-lexend)] font-black text-[clamp(2rem,4vw,3rem)] tracking-tight text-center">
          {t.planes.title[l]}
        </h2>
        <p
          className="reveal mt-4 text-[1.1rem] text-ice-white/40 text-center max-w-xl mx-auto tracking-wide"
          style={{ transitionDelay: "0.15s" }}
        >
          {t.planes.subtitle[l]}
        </p>
        <div className="mt-16 grid gap-6 md:grid-cols-3 items-start">
          {t.planes.plans.map((plan, i) => (
            <div
              key={plan.name}
              className={`reveal-scale p-8 md:p-10 flex flex-col backdrop-blur-sm transition-all duration-500 ${
                plan.highlighted
                  ? "border-2 border-gold-bar bg-white/[0.07] relative hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(255,201,25,0.12)]"
                  : "border border-ice-white/10 bg-white/[0.04] hover:-translate-y-2 hover:border-gold-bar/50 hover:shadow-[0_20px_50px_rgba(255,201,25,0.08)]"
              }`}
              style={{ transitionDelay: `${0.15 * (i + 1)}s` }}
            >
              {plan.highlighted && (
                <span className="absolute -top-4 left-8 bg-gold-bar text-asphalt-black font-bold text-sm px-4 py-1.5 tracking-wide">
                  {t.planes.popular[l]}
                </span>
              )}
              <h3 className="font-[family-name:var(--font-lexend)] font-bold text-2xl">
                {plan.name}
              </h3>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="font-[family-name:var(--font-lexend)] font-black text-[3.5rem] leading-none">
                  {plan.price}
                </span>
                <span className="text-ice-white/40 text-base">
                  {t.planes.period[l]}
                </span>
              </div>
              <ul className="mt-8 space-y-3.5 flex-1">
                {plan.features[l].map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-3 text-ice-white/60 text-[1.05rem]"
                  >
                    <Check
                      size={18}
                      className="mt-1 text-gold-bar flex-shrink-0"
                    />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#waitlist"
                className={`mt-10 block text-center font-bold py-4 text-lg transition-all duration-300 ${
                  plan.highlighted
                    ? "bg-gold-bar text-asphalt-black hover:brightness-110"
                    : "border border-ice-white/20 text-ice-white hover:border-ice-white/50"
                }`}
              >
                {t.planes.cta[l]}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   6. WAITLIST — Dark Midnight
   ═══════════════════════════════════════════ */

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

  const inputClass =
    "w-full bg-transparent border border-ice-white/15 px-5 py-4 text-ice-white placeholder:text-ice-white/25 focus:outline-none focus:border-gold-bar transition-colors text-[1.05rem]";

  return (
    <section
      ref={ref}
      id="waitlist"
      className="bg-[#000932] text-ice-white section-padding"
    >
      <div className="container-narrow max-w-2xl">
        <h2 className="reveal font-[family-name:var(--font-lexend)] font-black text-[clamp(2rem,4vw,3rem)] tracking-tight text-center">
          {t.waitlist.title[l]}
        </h2>
        <p
          className="reveal mt-4 text-[1.1rem] text-ice-white/40 text-center tracking-wide"
          style={{ transitionDelay: "0.15s" }}
        >
          {t.waitlist.subtitle[l]}
        </p>

        {status === "success" ? (
          <div className="reveal active mt-16 text-center p-12 border border-gold-bar/20 bg-white/[0.03]">
            <Check size={48} className="mx-auto text-gold-bar" />
            <p className="mt-4 font-[family-name:var(--font-lexend)] font-bold text-2xl">
              {t.waitlist.successTitle[l]}
            </p>
            <p className="mt-2 text-ice-white/50">
              {t.waitlist.successDesc[l]}
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="reveal mt-16 space-y-6"
            style={{ transitionDelay: "0.3s" }}
          >
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-bold mb-2 text-ice-white/50 tracking-wide"
              >
                {t.waitlist.labelName[l]}
              </label>
              <input
                id="name"
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
                placeholder={t.waitlist.placeholderName[l]}
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-bold mb-2 text-ice-white/50 tracking-wide"
              >
                {t.waitlist.labelEmail[l]}
              </label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClass}
                placeholder={t.waitlist.placeholderEmail[l]}
              />
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="business"
                  className="block text-sm font-bold mb-2 text-ice-white/50 tracking-wide"
                >
                  {t.waitlist.labelBusiness[l]}
                </label>
                <input
                  id="business"
                  type="text"
                  value={form.businessName}
                  onChange={(e) =>
                    setForm({ ...form, businessName: e.target.value })
                  }
                  className={inputClass}
                  placeholder={t.waitlist.placeholderBusiness[l]}
                />
              </div>
              <div>
                <label
                  htmlFor="alliance"
                  className="block text-sm font-bold mb-2 text-ice-white/50 tracking-wide"
                >
                  {t.waitlist.labelAlliance[l]}
                </label>
                <input
                  id="alliance"
                  type="text"
                  value={form.allianceCode}
                  onChange={(e) =>
                    setForm({ ...form, allianceCode: e.target.value })
                  }
                  className={inputClass}
                  placeholder={t.waitlist.placeholderAlliance[l]}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="language"
                className="block text-sm font-bold mb-2 text-ice-white/50 tracking-wide"
              >
                {t.waitlist.labelLanguage[l]}
              </label>
              <select
                id="language"
                value={form.language}
                onChange={(e) =>
                  setForm({ ...form, language: e.target.value as Locale })
                }
                className={inputClass}
              >
                <option value="es" className="bg-midnight-express">
                  Español
                </option>
                <option value="en" className="bg-midnight-express">
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
              className="w-full bg-gold-bar text-asphalt-black font-bold py-5 text-lg hover:brightness-110 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {status === "loading" ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  {t.waitlist.sending[l]}
                </>
              ) : (
                <>
                  {t.waitlist.submit[l]}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   7. FOOTER
   ═══════════════════════════════════════════ */

function Footer({ l }: { l: Locale }) {
  return (
    <footer className="bg-asphalt-black text-ice-white/40 px-6 py-14 md:px-12">
      <div className="container-narrow flex flex-col gap-8 md:flex-row md:justify-between md:items-center">
        <div>
          <p className="font-[family-name:var(--font-lexend)] font-black text-2xl text-ice-white">
            N.O.D.E.
          </p>
          <p className="mt-1 text-sm">by Nouvos</p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <a href="#waitlist" className="hover:text-ice-white transition-colors">
            Waitlist
          </a>
          <a href="#planes" className="hover:text-ice-white transition-colors">
            {l === "es" ? "Planes" : "Plans"}
          </a>
          <a
            href="mailto:hola@nouvos.one"
            className="hover:text-ice-white transition-colors"
          >
            hola@nouvos.one
          </a>
        </div>
        <p className="text-xs">
          © {new Date().getFullYear()} Nouvos. {t.footer.rights[l]}
        </p>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════ */

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
      <LanguageToggle locale={locale} setLocale={setLocale} />
      <Hero l={locale} />
      <ElProblema l={locale} />
      <LaSolucion l={locale} />
      <ComoFunciona l={locale} />
      <Planes l={locale} />
      <WaitlistSection l={locale} />
      <Footer l={locale} />
    </main>
  );
}
