"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  DollarSign,
  Users,
  Globe,
  Palette,
  Code2,
  Megaphone,
  ClipboardList,
  MessageSquare,
  Hammer,
  PackageCheck,
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
    cards: [
      {
        title: { es: "Costos impredecibles", en: "Unpredictable costs" },
        desc: {
          es: "Freelancers que cobran por hora, agencias con cotizaciones infladas. Nunca sabes cuánto vas a gastar.",
          en: "A logo costs $300–800. A landing page up to $1,500. You never know what you'll pay.",
        },
      },
      {
        title: { es: "Sin acceso a talento", en: "No access to talent" },
        desc: {
          es: "Encontrar diseñadores, devs y marketers confiables es un trabajo de tiempo completo.",
          en: "Most micro-businesses have no digital team. Finding reliable talent is a full-time job.",
        },
      },
      {
        title: { es: "Barrera de idioma", en: "Language barriers" },
        desc: {
          es: "Las mejores herramientas y equipos operan en inglés. Tu negocio necesita comunicación clara.",
          en: "Bilingual support is rare and expensive. Your business needs clear communication.",
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
          es: [
            "Identidad visual",
            "UI/UX para web y mobile",
            "Social media assets",
            "Presentaciones",
            "Brand guidelines",
          ],
          en: [
            "Visual identity",
            "UI/UX for web & mobile",
            "Social media assets",
            "Presentations",
            "Brand guidelines",
          ],
        },
      },
      {
        title: { es: "Web", en: "Web Development" },
        items: {
          es: [
            "Landing pages",
            "Sitios corporativos",
            "E-commerce",
            "Web apps",
            "Mantenimiento y hosting",
          ],
          en: [
            "Landing pages",
            "Corporate websites",
            "E-commerce",
            "Web apps",
            "Maintenance & hosting",
          ],
        },
      },
      {
        title: { es: "Marketing", en: "Digital Marketing" },
        items: {
          es: [
            "SEO y contenido",
            "Email marketing",
            "Gestión de redes sociales",
            "Paid ads",
            "Estrategia digital",
          ],
          en: [
            "SEO & content",
            "Email marketing",
            "Social media management",
            "Paid ads",
            "Digital strategy",
          ],
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
          es: "Elige el plan que se adapte a tu negocio. Sin contratos, cancela cuando quieras.",
          en: "Pick your plan and get started in 24 hours. No contracts, cancel anytime.",
        },
      },
      {
        title: { es: "Describe", en: "Describe what you need" },
        desc: {
          es: "Envía tus requests: diseños, páginas, campañas. Todo desde un solo canal.",
          en: "Our AI assistant guides you through it. Designs, pages, campaigns — all from one channel.",
        },
      },
      {
        title: { es: "Nosotros hacemos", en: "We deliver" },
        desc: {
          es: "Nuestro equipo trabaja en tus requests con turnaround de 48-72h.",
          en: "Our team works on your requests with a 48–72h turnaround.",
        },
      },
      {
        title: { es: "Recibe", en: "Receive" },
        desc: {
          es: "Entregas listas para usar. Revisiones ilimitadas hasta que estés satisfecho.",
          en: "Ready-to-use deliverables. Unlimited revisions until you're satisfied.",
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
          es: [
            "5 créditos al mes",
            "1 request activo a la vez",
            "Turnaround 72h",
            "Diseño + contenido",
            "Soporte por email",
          ],
          en: [
            "5 credits per month",
            "1 active request at a time",
            "72h turnaround",
            "Design + content",
            "Email support",
          ],
        },
        highlighted: false,
      },
      {
        name: "Growth",
        price: "$190",
        features: {
          es: [
            "12 créditos al mes",
            "2 requests activos",
            "Turnaround 48h",
            "Diseño + web + contenido",
            "Soporte prioritario",
            "Brand strategy session",
          ],
          en: [
            "12 credits per month",
            "2 active requests",
            "48h turnaround",
            "Design + web + content",
            "Priority support",
            "Brand strategy session",
          ],
        },
        highlighted: true,
      },
      {
        name: "Pro",
        price: "$330",
        features: {
          es: [
            "25 créditos al mes",
            "3 requests activos",
            "Turnaround 24-48h",
            "Diseño + web + marketing",
            "Slack dedicado",
            "Monthly strategy call",
            "Rollover de créditos",
          ],
          en: [
            "25 credits per month",
            "3 active requests",
            "24–48h turnaround",
            "Design + web + marketing",
            "Dedicated Slack channel",
            "Monthly strategy call",
            "Credit rollover",
          ],
        },
        highlighted: false,
      },
    ],
  },
  waitlist: {
    title: { es: "Únete al Waitlist", en: "Join the Waitlist" },
    subtitle: {
      es: "Sé de los primeros en acceder cuando lancemos.",
      en: "Be among the first to get access when we launch.",
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
   SCROLL REVEAL HOOK
   ═══════════════════════════════════════════ */

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

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

    const children = el.querySelectorAll(".reveal");
    children.forEach((child) => observer.observe(child));

    return () => observer.disconnect();
  }, []);

  return ref;
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
   SVG Hero Graphic
   ═══════════════════════════════════════════ */

function NodeGraphic() {
  const nodes = [
    { cx: 80, cy: 60, r: 6 },
    { cx: 200, cy: 30, r: 5 },
    { cx: 320, cy: 70, r: 7 },
    { cx: 150, cy: 140, r: 5 },
    { cx: 270, cy: 130, r: 6 },
    { cx: 380, cy: 50, r: 4 },
    { cx: 50, cy: 150, r: 4 },
    { cx: 350, cy: 160, r: 5 },
    { cx: 120, cy: 90, r: 4 },
    { cx: 240, cy: 90, r: 5 },
  ];

  const edges = [
    [0, 1], [1, 2], [0, 3], [1, 4], [2, 5], [3, 4],
    [6, 0], [6, 3], [4, 7], [2, 7], [0, 8], [8, 3],
    [8, 9], [9, 4], [1, 9], [5, 7],
  ];

  return (
    <svg
      viewBox="0 0 420 190"
      fill="none"
      className="w-full max-w-md opacity-80"
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
          strokeWidth="1"
          strokeOpacity="0.4"
        />
      ))}
      {nodes.map((n, i) => (
        <circle key={i} cx={n.cx} cy={n.cy} r={n.r} fill="#FFC919" />
      ))}
    </svg>
  );
}

/* ═══════════════════════════════════════════
   1. HERO
   ═══════════════════════════════════════════ */

function Hero({ l }: { l: Locale }) {
  const ref = useReveal();

  return (
    <section
      ref={ref}
      className="relative bg-asphalt-black text-ice-white section-padding overflow-hidden"
    >
      <div className="container-narrow flex flex-col items-start gap-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl reveal">
          <h1 className="font-[family-name:var(--font-lexend)] font-black text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.05] tracking-tight">
            {t.hero.title1[l]}
            <br />
            <span className="text-gold-bar">{t.hero.title2[l]}</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-ice-white/70 max-w-lg leading-relaxed">
            {t.hero.subtitle[l]}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#waitlist"
              className="inline-flex items-center gap-2 bg-gold-bar text-asphalt-black font-bold px-8 py-4 text-lg hover:brightness-110 transition-all"
            >
              {t.hero.cta1[l]}
              <ArrowRight size={20} />
            </a>
            <a
              href="#planes"
              className="inline-flex items-center gap-2 border-2 border-ice-white/30 text-ice-white px-8 py-4 text-lg hover:border-ice-white/60 transition-all"
            >
              {t.hero.cta2[l]}
            </a>
          </div>
        </div>
        <div className="hidden lg:block flex-shrink-0 reveal" style={{ transitionDelay: "0.2s" }}>
          <NodeGraphic />
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   2. EL PROBLEMA
   ═══════════════════════════════════════════ */

const problemIcons = [DollarSign, Users, Globe];

function ElProblema({ l }: { l: Locale }) {
  const ref = useReveal();

  return (
    <section ref={ref} className="bg-ice-white section-padding">
      <div className="container-narrow">
        <h2 className="reveal font-[family-name:var(--font-lexend)] font-bold text-3xl md:text-5xl tracking-tight text-midnight-express">
          {t.problema.title[l]}
        </h2>
        <p className="reveal mt-4 text-lg text-asphalt-black/60 max-w-xl" style={{ transitionDelay: "0.1s" }}>
          {t.problema.subtitle[l]}
        </p>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {t.problema.cards.map((card, i) => {
            const Icon = problemIcons[i];
            return (
              <div
                key={i}
                className="reveal border border-asphalt-black/10 p-8 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1.5 hover:border-gold-bar hover:shadow-[0_10px_30px_rgba(0,0,0,0.1)]"
                style={{ transitionDelay: `${0.1 * (i + 1)}s` }}
              >
                <Icon size={32} className="text-gold-bar" strokeWidth={1.5} />
                <h3 className="font-[family-name:var(--font-lexend)] font-bold text-xl">
                  {card.title[l]}
                </h3>
                <p className="text-asphalt-black/60 leading-relaxed">
                  {card.desc[l]}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   3. LA SOLUCIÓN
   ═══════════════════════════════════════════ */

const serviceIcons = [Palette, Code2, Megaphone];

function LaSolucion({ l }: { l: Locale }) {
  const ref = useReveal();

  return (
    <section ref={ref} className="bg-midnight-express text-ice-white section-padding">
      <div className="container-narrow">
        <h2 className="reveal font-[family-name:var(--font-lexend)] font-bold text-3xl md:text-5xl tracking-tight">
          {t.solucion.title[l]}
        </h2>
        <p className="reveal mt-4 text-lg text-ice-white/50 max-w-xl" style={{ transitionDelay: "0.1s" }}>
          {t.solucion.subtitle[l]}
        </p>
        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {t.solucion.services.map((s, i) => {
            const Icon = serviceIcons[i];
            return (
              <div
                key={i}
                className="reveal border border-ice-white/10 p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-gold-bar hover:shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
                style={{ transitionDelay: `${0.1 * (i + 1)}s` }}
              >
                <Icon size={36} className="text-gold-bar" strokeWidth={1.5} />
                <h3 className="mt-4 font-[family-name:var(--font-lexend)] font-bold text-2xl">
                  {s.title[l]}
                </h3>
                <ul className="mt-6 space-y-3">
                  {s.items[l].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-ice-white/70"
                    >
                      <Check
                        size={18}
                        className="mt-0.5 text-gold-bar flex-shrink-0"
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
   4. CÓMO FUNCIONA — Editorial Numbers
   ═══════════════════════════════════════════ */

const stepIcons = [ClipboardList, MessageSquare, Hammer, PackageCheck];
const stepNumbers = ["01", "02", "03", "04"];

function ComoFunciona({ l }: { l: Locale }) {
  const ref = useReveal();

  return (
    <section ref={ref} className="bg-ice-white section-padding">
      <div className="container-narrow">
        <h2 className="reveal font-[family-name:var(--font-lexend)] font-bold text-3xl md:text-5xl tracking-tight text-midnight-express">
          {t.funciona.title[l]}
        </h2>
        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {t.funciona.steps.map((step, i) => {
            const Icon = stepIcons[i];
            return (
              <div
                key={i}
                className="reveal relative overflow-hidden border border-asphalt-black/10 p-8 md:p-10 min-h-[200px] flex flex-col justify-end transition-all duration-300 hover:-translate-y-1.5 hover:border-gold-bar hover:shadow-[0_10px_30px_rgba(0,0,0,0.1)]"
                style={{ transitionDelay: `${0.1 * (i + 1)}s` }}
              >
                <span
                  className="absolute top-2 right-4 font-[family-name:var(--font-lexend)] font-black text-[8rem] leading-none text-gold-bar/[0.12] select-none pointer-events-none"
                  aria-hidden="true"
                >
                  {stepNumbers[i]}
                </span>
                <div className="relative z-10">
                  <Icon
                    size={28}
                    className="text-gold-bar mb-3"
                    strokeWidth={1.5}
                  />
                  <h3 className="font-[family-name:var(--font-lexend)] font-bold text-xl md:text-2xl">
                    {step.title[l]}
                  </h3>
                  <p className="mt-2 text-asphalt-black/60 leading-relaxed max-w-md">
                    {step.desc[l]}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   5. PLANES
   ═══════════════════════════════════════════ */

function Planes({ l }: { l: Locale }) {
  const ref = useReveal();

  return (
    <section ref={ref} id="planes" className="bg-midnight-express text-ice-white section-padding">
      <div className="container-narrow">
        <h2 className="reveal font-[family-name:var(--font-lexend)] font-bold text-3xl md:text-5xl tracking-tight text-center">
          {t.planes.title[l]}
        </h2>
        <p className="reveal mt-4 text-lg text-ice-white/50 text-center max-w-xl mx-auto" style={{ transitionDelay: "0.1s" }}>
          {t.planes.subtitle[l]}
        </p>
        <div className="mt-14 grid gap-8 md:grid-cols-3 items-start">
          {t.planes.plans.map((plan, i) => (
            <div
              key={plan.name}
              className={`reveal p-8 flex flex-col transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.25)] ${
                plan.highlighted
                  ? "border-2 border-gold-bar bg-midnight-express relative hover:shadow-[0_10px_40px_rgba(255,201,25,0.15)]"
                  : "border border-ice-white/10 bg-midnight-express/50 hover:border-gold-bar"
              }`}
              style={{ transitionDelay: `${0.1 * (i + 1)}s` }}
            >
              {plan.highlighted && (
                <span className="absolute -top-4 left-8 bg-gold-bar text-asphalt-black font-bold text-sm px-4 py-1">
                  {t.planes.popular[l]}
                </span>
              )}
              <h3 className="font-[family-name:var(--font-lexend)] font-bold text-2xl">
                {plan.name}
              </h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-[family-name:var(--font-lexend)] font-black text-5xl">
                  {plan.price}
                </span>
                <span className="text-ice-white/50 text-lg">
                  {t.planes.period[l]}
                </span>
              </div>
              <ul className="mt-8 space-y-3 flex-1">
                {plan.features[l].map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-3 text-ice-white/70"
                  >
                    <Check
                      size={18}
                      className="mt-0.5 text-gold-bar flex-shrink-0"
                    />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#waitlist"
                className={`mt-8 block text-center font-bold py-4 transition-all duration-300 ${
                  plan.highlighted
                    ? "bg-gold-bar text-asphalt-black hover:brightness-110"
                    : "border border-ice-white/30 text-ice-white hover:border-ice-white/60"
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
   6. WAITLIST
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

  return (
    <section
      ref={ref}
      id="waitlist"
      className="bg-midnight-express text-ice-white section-padding"
    >
      <div className="container-narrow max-w-2xl">
        <h2 className="reveal font-[family-name:var(--font-lexend)] font-bold text-3xl md:text-5xl tracking-tight text-center">
          {t.waitlist.title[l]}
        </h2>
        <p className="reveal mt-4 text-lg text-ice-white/50 text-center" style={{ transitionDelay: "0.1s" }}>
          {t.waitlist.subtitle[l]}
        </p>

        {status === "success" ? (
          <div className="reveal active mt-14 text-center p-10 border border-gold-bar/30">
            <Check size={48} className="mx-auto text-gold-bar" />
            <p className="mt-4 font-[family-name:var(--font-lexend)] font-bold text-2xl">
              {t.waitlist.successTitle[l]}
            </p>
            <p className="mt-2 text-ice-white/60">
              {t.waitlist.successDesc[l]}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="reveal mt-14 space-y-6" style={{ transitionDelay: "0.2s" }}>
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-bold mb-2 text-ice-white/70"
              >
                {t.waitlist.labelName[l]}
              </label>
              <input
                id="name"
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-transparent border border-ice-white/20 px-5 py-4 text-ice-white placeholder:text-ice-white/30 focus:outline-none focus:border-gold-bar transition-colors"
                placeholder={t.waitlist.placeholderName[l]}
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-bold mb-2 text-ice-white/70"
              >
                {t.waitlist.labelEmail[l]}
              </label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-transparent border border-ice-white/20 px-5 py-4 text-ice-white placeholder:text-ice-white/30 focus:outline-none focus:border-gold-bar transition-colors"
                placeholder={t.waitlist.placeholderEmail[l]}
              />
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="business"
                  className="block text-sm font-bold mb-2 text-ice-white/70"
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
                  className="w-full bg-transparent border border-ice-white/20 px-5 py-4 text-ice-white placeholder:text-ice-white/30 focus:outline-none focus:border-gold-bar transition-colors"
                  placeholder={t.waitlist.placeholderBusiness[l]}
                />
              </div>
              <div>
                <label
                  htmlFor="alliance"
                  className="block text-sm font-bold mb-2 text-ice-white/70"
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
                  className="w-full bg-transparent border border-ice-white/20 px-5 py-4 text-ice-white placeholder:text-ice-white/30 focus:outline-none focus:border-gold-bar transition-colors"
                  placeholder={t.waitlist.placeholderAlliance[l]}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="language"
                className="block text-sm font-bold mb-2 text-ice-white/70"
              >
                {t.waitlist.labelLanguage[l]}
              </label>
              <select
                id="language"
                value={form.language}
                onChange={(e) =>
                  setForm({
                    ...form,
                    language: e.target.value as Locale,
                  })
                }
                className="w-full bg-transparent border border-ice-white/20 px-5 py-4 text-ice-white focus:outline-none focus:border-gold-bar transition-colors"
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
              className="w-full bg-gold-bar text-asphalt-black font-bold py-4 text-lg hover:brightness-110 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
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
    <footer className="bg-asphalt-black text-ice-white/50 px-6 py-12 md:px-12">
      <div className="container-narrow flex flex-col gap-8 md:flex-row md:justify-between md:items-center">
        <div>
          <p className="font-[family-name:var(--font-lexend)] font-black text-2xl text-ice-white">
            N.O.D.E.
          </p>
          <p className="mt-1 text-sm">by Nouvos</p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <a
            href="#waitlist"
            className="hover:text-ice-white transition-colors"
          >
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
    if (saved === "en" || saved === "es") {
      setLocale(saved);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("node-locale", locale);
    }
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
