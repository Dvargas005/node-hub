"use client";

import { useEffect, useState, useRef } from "react";
import SmoothScroll from "@/components/SmoothScroll";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import Image from "next/image";
import { MixIcon, CodeIcon, RocketIcon, PlusIcon, MinusIcon } from "@radix-ui/react-icons";

/* ═══════════════════════════════════════════
   CUSTOM CURSOR
   ═══════════════════════════════════════════ */

function CustomCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const [hovering, setHovering] = useState(false);
  const sx = useSpring(x, { damping: 25, stiffness: 250 });
  const sy = useSpring(y, { damping: 25, stiffness: 250 });

  useEffect(() => {
    const move = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); };
    const over = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("a,button,.acc-trigger,.list-row,.price-row,.lang-flag")) setHovering(true);
    };
    const out = () => setHovering(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    window.addEventListener("mouseout", out);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseover", over); window.removeEventListener("mouseout", out); };
  }, [x, y]);

  return (
    <motion.div
      className="fixed top-0 left-0 z-[9999] pointer-events-none rounded-full bg-[#FFC919] mix-blend-difference"
      style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%" }}
      animate={{ width: hovering ? 40 : 20, height: hovering ? 40 : 20 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
    />
  );
}

/* ═══════════════════════════════════════════
   MOTION HELPERS
   ═══════════════════════════════════════════ */

const ease = [0.23, 1, 0.32, 1] as const;

function RevealLine({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <div className="reveal-line">
      <motion.div initial={{ y: "100%" }} whileInView={{ y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.8, ease, delay }}>
        {children}
      </motion.div>
    </div>
  );
}

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.9, ease, delay }} className={className}>
      {children}
    </motion.div>
  );
}

function Stagger({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={{ visible: { transition: { staggerChildren: 0.05 } } }} className={className}>
      {children}
    </motion.div>
  );
}

const staggerChild = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

/* Parallax wrapper for decorative elements */
function ParaEl({ children, speed = 0.1, className = "" }: { children: React.ReactNode; speed?: number; className?: string }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`${speed * -100}%`, `${speed * 100}%`]);
  return <motion.div ref={ref} style={{ y }} className={className}>{children}</motion.div>;
}

/* ═══════════════════════════════════════════
   IMAGE PLACEHOLDER
   ═══════════════════════════════════════════ */

function Img({ desc, ratio = "16/9" }: { desc: string; ratio?: string }) {
  return <div className="img-placeholder w-full" style={{ aspectRatio: ratio }}>Image placeholder — {desc}</div>;
}

/* ═══════════════════════════════════════════
   CONTENT / TRANSLATIONS
   ═══════════════════════════════════════════ */

const C = {
  en: {
    nav: { join: "Get Started" },
    hero: { label: "NETWORK ORGANIZED DELIVERY ENGINE", tagline: "Your Ally on Digital Development", lines: ["Increase your business revenue.", "Regain time in your day.", "Grow as you've wanted."], blPre: "SYSTEM_STATUS: OPERATIONAL // LATENCY: ", bc: "NETWORK ORGANIZED DELIVERY ENGINE — V2.0.26", br: "HQ EVANSTON_IL // 42.0478781 -87.6842666" },
    banner: ["E-commerce", "Social Media", "Web Development", "Integrations", "Digital Maintenance"],
    whatIs: { title: "What is N.O.D.E.?", para: "We're your digital creation and maintenance partner. That's why we focus on monthly plans instead of high one-time tickets. Better results, lower cost, stronger protection for your business." },
    svc: {
      label: "WHAT WE DELIVER",
      title: "Three service lines. Real deliverables.",
      para: "Design, web development, and digital marketing — all under one subscription. Every deliverable produced by a real team of specialists.",
      accordions: [
        { name: "Design & Branding", items: [["Brand Starter", "from $200 credits"], ["Social Pack", "from $60 credits"], ["Flyer / Poster", "from $40 credits"], ["Business Kit", "from $75 credits"]] },
        { name: "Web Development", items: [["Landing Page", "from $200 credits"], ["SEO Foundation", "from $45 credits"], ["Google Business", "from $60 credits"], ["Contact Form", "from $75 credits"]] },
        { name: "Digital Marketing", items: [["Content Pack (4 posts)", "from $80 credits"], ["Content Pack (8 posts)", "from $140 credits"], ["Promo Campaign", "from $100 credits"], ["WhatsApp Business", "from $70 credits"]] },
      ],
    },
    proc: [
      { num: "01", label: "// 01", title: "START IN UNDER 24 HOURS", para: "Pick the plan that fits your business. No long contracts, no fine print, no surprises. Your digital team activates the moment you subscribe. One monthly payment gives you access to dedicated designers, developers, and marketers.", list: [["Plan Member", "01"], ["Plan Growth", "02"], ["Plan Pro", "03"], ["Custom Projects", "04"]] },
      { num: "02", label: "// 02", title: "AI-GUIDED BRIEFING SYSTEM", para: "You don't need to know design or tech to request what you need. Our smart assistant guides you step by step to articulate your request. The result is a professional brief your team can execute without back and forth.", list: [["Smart Wizard", "01"], ["Auto-categorization", "02"], ["File Attachments", "03"], ["Brief Generation", "04"], ["PM Escalation", "05"]] },
      { num: "03", label: "// 03", title: "YOUR DEDICATED CREATIVE TEAM", para: "Behind every request is a real team. Graphic designers, AI-assisted developers, and specialized community managers. Your project manager coordinates everything — you just receive finished work in 48 to 72 business hours.", list: [["Graphic Design", "01"], ["AI-Assisted Development", "02"], ["Community Management", "03"], ["Project Management", "04"], ["Quality Assurance", "05"]] },
      { num: "04", label: "// 04", title: "APPROVE, ITERATE, SCALE", para: "Receive ready-to-use deliverables. Need adjustments? Request unlimited revisions. Approve on first round and earn bonus credits. As your business grows, your plan grows with you — more credits, more speed, more services.", list: [["Unlimited Revisions", "01"], ["First-Round Bonus", "02"], ["Credit Packs", "03"], ["Plan Upgrades", "04"]] },
    ],
    about: { title: "Why N.O.D.E. exists", para: "N.O.D.E. is born from Nouvos Solutions — a logistics technology company that has spent years building systems for the global supply chain. We know what it means to operate with distributed teams, manage deliveries with real deadlines, and scale operations without losing quality. We apply exactly that mindset to creative services: clear processes, predictable deliveries, technology that amplifies human talent." },
    manifesto: {
      lines: [
        "WE RUN CREATIVE",
        "LIKE WE RUN LOGISTICS.",
        "CLEAR PROCESSES.",
        "REAL DEADLINES.",
        "ZERO EXCUSES.",
        "",
        "NOT EVERY BUSINESS",
        "CAN AFFORD THIS.",
        "UNTIL NOW",
      ],
      lastWordPre: "NOW",
      lastWordFade: "UNTIL",
      reveal: "N.O.D.E.",
    },
    pricing: {
      lenBtn: "LEN Members",
      lenPara: ["We proudly support the ", "Latino Entrepreneurial Network", " with exclusive pricing for their members."],
      lenLabel: "LEN Member Exclusive Rate",
      setup: "Setup",
      oneTime: "one-time",
      plans: [
        { name: "Member", front: 130, setup: 260, real: 100, realSetup: 200, per: "/mo", desc: "Your digital starter kit. Design and content essentials.", ft: false },
        { name: "Growth", front: 247, setup: 910, real: 190, realSetup: 700, per: "/mo", desc: "Full creative power. Design, web, and content with priority.", ft: true },
        { name: "Pro", front: 429, setup: 1300, real: 330, realSetup: 1000, per: "/mo", desc: "Unlimited scale. All services, dedicated PM, fastest turnaround.", ft: false },
      ],
    },
    wl: { title: "Ready to start?", sub: "Sign up today and get 10 free credits to explore the platform.", cta: "Start for free", login: "Already have an account?" },
    footer: "© 2026 Nouvos Solutions LLC",
  },
  es: {
    nav: { join: "Comenzar" },
    hero: { label: "NETWORK ORGANIZED DELIVERY ENGINE", tagline: "Tu Aliado en Desarrollo Digital", lines: ["Aumenta los ingresos de tu negocio.", "Recupera tiempo en tu día.", "Crece como siempre quisiste."], blPre: "ESTADO_SISTEMA: OPERATIVO // LATENCIA: ", bc: "NETWORK ORGANIZED DELIVERY ENGINE — V2.0.26", br: "HQ EVANSTON_IL // 42.0478781 -87.6842666" },
    banner: ["E-commerce", "Social Media", "Web Development", "Integrations", "Digital Maintenance"],
    whatIs: { title: "¿Qué es N.O.D.E.?", para: "Somos tu aliado de creación y mantenimiento digital. Por eso nos enfocamos en planes mensuales en vez de altos tickets de una vez. Mayor resultado, menos costo, mejor protección para tu negocio." },
    svc: {
      label: "LO QUE ENTREGAMOS",
      title: "Tres líneas de servicio. Entregables reales.",
      para: "Diseño, desarrollo web y marketing digital — todo bajo una sola suscripción. Cada entregable producido por un equipo real de especialistas.",
      accordions: [
        { name: "Diseño & Branding", items: [["Brand Starter", "desde $200 créditos"], ["Social Pack", "desde $60 créditos"], ["Flyer / Poster", "desde $40 créditos"], ["Business Kit", "desde $75 créditos"]] },
        { name: "Desarrollo Web", items: [["Landing Page", "desde $200 créditos"], ["SEO Foundation", "desde $45 créditos"], ["Google Business", "desde $60 créditos"], ["Formulario de Contacto", "desde $75 créditos"]] },
        { name: "Marketing Digital", items: [["Content Pack (4 posts)", "desde $80 créditos"], ["Content Pack (8 posts)", "desde $140 créditos"], ["Campaña Promocional", "desde $100 créditos"], ["WhatsApp Business", "desde $70 créditos"]] },
      ],
    },
    proc: [
      { num: "01", label: "// 01", title: "ACTÍVATE EN MENOS DE 24 HORAS", para: "Elige el plan que se ajuste a tu negocio. Sin contratos largos, sin letra chica, sin sorpresas. Tu equipo digital se activa desde el momento en que te suscribes. Un solo pago mensual te da acceso a diseñadores, developers y marketers dedicados.", list: [["Plan Member", "01"], ["Plan Growth", "02"], ["Plan Pro", "03"], ["Proyectos Custom", "04"]] },
      { num: "02", label: "// 02", title: "SISTEMA DE BRIEFING GUIADO POR AI", para: "No necesitas saber de diseño ni de tecnología para pedir lo que necesitas. Nuestro asistente inteligente te guía paso a paso para articular tu solicitud. El resultado es un brief profesional que nuestro equipo puede ejecutar sin idas y vueltas.", list: [["Smart Wizard", "01"], ["Auto-categorización", "02"], ["Adjuntos de Archivos", "03"], ["Generación de Brief", "04"], ["Escalación a PM", "05"]] },
      { num: "03", label: "// 03", title: "TU EQUIPO CREATIVO DEDICADO", para: "Detrás de cada solicitud hay un equipo real. Diseñadores gráficos, desarrolladores asistidos por AI, y community managers especializados. Tu project manager coordina todo — tú solo recibes el trabajo terminado en 48 a 72 horas hábiles.", list: [["Diseño Gráfico", "01"], ["Desarrollo AI-Asistido", "02"], ["Community Management", "03"], ["Project Management", "04"], ["Quality Assurance", "05"]] },
      { num: "04", label: "// 04", title: "APRUEBA, ITERA, ESCALA", para: "Recibe entregas listas para usar. Si necesitas ajustes, pide revisiones ilimitadas. Aprueba a la primera y gana créditos bonus. A medida que tu negocio crece, tu plan crece contigo — más créditos, más velocidad, más servicios.", list: [["Revisiones Ilimitadas", "01"], ["Bonus Primera Ronda", "02"], ["Packs de Créditos", "03"], ["Upgrades de Plan", "04"]] },
    ],
    about: { title: "Por qué existe N.O.D.E.", para: "N.O.D.E. nace de Nouvos Solutions — una empresa de tecnología logística que lleva años construyendo sistemas para la cadena de suministro global. Sabemos lo que significa operar con equipos distribuidos, gestionar entregas con deadlines reales, y escalar operaciones sin perder calidad. Aplicamos exactamente esa mentalidad a los servicios creativos: procesos claros, entregas predecibles, tecnología que amplifica al talento humano." },
    manifesto: {
      lines: [
        "OPERAMOS LO CREATIVO",
        "COMO OPERAMOS LA LOGÍSTICA.",
        "PROCESOS CLAROS.",
        "DEADLINES REALES.",
        "CERO EXCUSAS.",
        "",
        "NO TODOS LOS NEGOCIOS",
        "PUEDEN PAGARLO.",
        "HASTA AHORA",
      ],
      lastWordPre: "AHORA",
      lastWordFade: "HASTA",
      reveal: "N.O.D.E.",
    },
    pricing: {
      lenBtn: "Miembros LEN",
      lenPara: ["Apoyamos con orgullo a la ", "Latino Entrepreneurial Network", " con precios exclusivos para sus miembros."],
      lenLabel: "Tarifa Exclusiva Miembros LEN",
      setup: "Configuración",
      oneTime: "única vez",
      plans: [
        { name: "Member", front: 130, setup: 260, real: 100, realSetup: 200, per: "/mes", desc: "Tu kit digital inicial. Diseño y contenido esencial.", ft: false },
        { name: "Growth", front: 247, setup: 910, real: 190, realSetup: 700, per: "/mes", desc: "Poder creativo completo. Diseño, web y contenido con prioridad.", ft: true },
        { name: "Pro", front: 429, setup: 1300, real: 330, realSetup: 1000, per: "/mes", desc: "Escala ilimitada. Todos los servicios, PM dedicado, turnaround más rápido.", ft: false },
      ],
    },
    wl: { title: "Listo para empezar?", sub: "Regístrate hoy y recibe 10 créditos gratis para explorar la plataforma.", cta: "Comenzar gratis", login: "¿Ya tienes cuenta?" },
    footer: "© 2026 Nouvos Solutions LLC",
  },
};

/* ═══════════════════════════════════════════
   PARALLAX HERO IMAGE
   ═══════════════════════════════════════════ */

function ParallaxBg({ desc }: { desc: string }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  return (
    <motion.div ref={ref} style={{ y }} className="absolute inset-0 opacity-30">
      <Img desc={desc} ratio="auto" />
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   PARALLAX PROCESS NUMBER (FIX 3)
   ═══════════════════════════════════════════ */

function ParallaxNum({ num }: { num: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-30%", "30%"]);
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setFilled(true); },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="lg:w-[40%] flex items-end">
      <motion.span style={{ y }} className={`font-[family-name:var(--font-lexend)] font-black text-[clamp(8rem,20vw,18rem)] leading-[0.8] number-stroke select-none ${filled ? "number-filled" : ""}`}>
        {num}
      </motion.span>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SERVICE ACCORDION (FIX 2)
   ═══════════════════════════════════════════ */

const accIcons = [MixIcon, CodeIcon, RocketIcon];

function ServiceAccordion({ acc, idx }: { acc: { name: string; items: string[][] }; idx: number }) {
  const [open, setOpen] = useState(false);
  const Icon = accIcons[idx];

  return (
    <div className="border-t border-[#F5F6FC]/10">
      <button onClick={() => setOpen(!open)} className="acc-trigger w-full flex items-center justify-between py-6 text-left">
        <div className="flex items-center gap-4">
          <Icon className="w-6 h-6 text-[#FFC919]" />
          <span className="font-[family-name:var(--font-lexend)] font-bold text-[1.4rem] text-[#F5F6FC]">{acc.name}</span>
        </div>
        {open ? <MinusIcon className="w-5 h-5 text-[#F5F6FC]/50" /> : <PlusIcon className="w-5 h-5 text-[#F5F6FC]/50" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease }}
            className="overflow-hidden"
          >
            <div className="pb-6">
              {acc.items.map(([name, price]) => (
                <div key={name} className="list-row font-[family-name:var(--font-atkinson)] text-[0.95rem]">
                  <span className="text-[#F5F6FC]/80">{name}</span>
                  <span className="text-[#FFC919] text-sm font-[family-name:var(--font-lexend)] font-bold">{price}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════ */

/* ═══════════════════════════════════════════
   MANIFESTO — Scroll Fill + Glitch Reveal
   ═══════════════════════════════════════════ */

function ScrollWord({ word, progress, start, end, gold }: { word: string; progress: ReturnType<typeof useScroll>["scrollYProgress"]; start: number; end: number; gold: boolean }) {
  const opacity = useTransform(progress, [start, end], [0.12, 1]);
  const color = gold ? "#FFC919" : "#F5F6FC";
  return (
    <motion.span style={{ opacity, color }} className="inline-block mr-[0.3em]">
      {word}
    </motion.span>
  );
}

function ManifestoSection({ lang }: { lang: "en" | "es" }) {
  const m = C[lang].manifesto;
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start 0.8", "end 0.2"] });
  const [phase, setPhase] = useState<"scroll" | "glitch" | "reveal">("scroll");

  // Build flat word list with metadata
  const wordMeta: { word: string; isLastLine: boolean; isFadePart: boolean; isGlitchPart: boolean; gold: boolean }[] = [];
  m.lines.forEach((line, li) => {
    if (line === "") return;
    const isLastLine = li === m.lines.length - 1;
    line.split(" ").forEach((w) => {
      const isFadePart = isLastLine && w === m.lastWordFade;
      const isGlitchPart = isLastLine && w === m.lastWordPre;
      wordMeta.push({ word: w, isLastLine, isFadePart, isGlitchPart, gold: isLastLine });
    });
  });

  const total = wordMeta.length;

  // Phase transitions
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v > 0.92 && phase === "scroll") setPhase("glitch");
    if (v < 0.88 && phase !== "scroll") setPhase("scroll");
  });

  useEffect(() => {
    if (phase === "glitch") {
      const timer = setTimeout(() => setPhase("reveal"), 800);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Render lines
  let wordIdx = 0;

  return (
    <section ref={containerRef} className="relative min-h-[250vh] bg-[#0a0a0a]">
      {/* Grain overlay */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize: "256px 256px" }} />

      <div className="sticky top-0 min-h-screen flex items-center justify-center px-6 md:px-12">
        <div className="text-center max-w-5xl mx-auto font-[family-name:var(--font-lexend)] font-black uppercase text-[clamp(2.5rem,5.5vw,5rem)] leading-[1.15] tracking-[-0.02em]">
          {m.lines.map((line, li) => {
            if (line === "") return <div key={li} className="h-[0.6em]" />;
            const isLastLine = li === m.lines.length - 1;
            const words = line.split(" ");

            return (
              <div key={li}>
                {words.map((w) => {
                  const idx = wordIdx++;
                  const start = idx / total;
                  const end = (idx + 1) / total;

                  // Last line special handling
                  if (isLastLine) {
                    const isFade = w === m.lastWordFade;
                    const isGlitch = w === m.lastWordPre;

                    if (isFade) {
                      /* "UNTIL" stays visible — never fades. Result reads "UNTIL N.O.D.E." */
                      return (
                        <ScrollWord key={`${li}-${w}`} word={w} progress={scrollYProgress} start={start} end={end} gold />
                      );
                    }

                    if (isGlitch) {
                      return (
                        <span key={`${li}-${w}`} className="inline-block mr-[0.3em] relative">
                          <AnimatePresence mode="wait">
                            {phase === "reveal" ? (
                              <motion.span
                                key="node"
                                initial={{ opacity: 0, scale: 1.2 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.6, ease }}
                                className="inline-block text-[#FFC919] text-[1.2em]"
                                style={{ textShadow: "0 0 40px rgba(255,201,25,0.3)" }}
                              >
                                {m.reveal}
                              </motion.span>
                            ) : (
                              <motion.span
                                key="word"
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.3 }}
                                className={`inline-block ${phase === "glitch" ? "glitch-active" : ""}`}
                                data-text={w}
                              >
                                <ScrollWord word={w} progress={scrollYProgress} start={start} end={end} gold />
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </span>
                      );
                    }
                  }

                  return <ScrollWord key={`${li}-${w}-${idx}`} word={w} progress={scrollYProgress} start={start} end={end} gold={isLastLine} />;
                })}
              </div>
            );
          })}
        </div>
      </div>
      {/* Extra scroll space so N.O.D.E. reveal stays visible */}
      <div className="min-h-[40vh]" />
    </section>
  );
}

/* ═══════════════════════════════════════════
   ANIMATED PRICE (counter up/down)
   ═══════════════════════════════════════════ */

function AnimatedPrice({ value, className }: { value: number; className?: string }) {
  const spring = useSpring(value, { damping: 30, stiffness: 120 });
  const display = useTransform(spring, (v) => `$${Math.round(v)}`);
  useEffect(() => { spring.set(value); }, [value, spring]);
  return <motion.span className={className}>{display}</motion.span>;
}

function AnimatedSetup({ value, className }: { value: number; className?: string }) {
  const spring = useSpring(value, { damping: 30, stiffness: 120 });
  const display = useTransform(spring, (v) => `$${Math.round(v).toLocaleString()}`);
  useEffect(() => { spring.set(value); }, [value, spring]);
  return <motion.span className={className}>{display}</motion.span>;
}

export default function Home() {
  const [lang, setLang] = useState<"en" | "es">("en");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [wlEmail, setWlEmail] = useState("");
  const [wlSt, setWlSt] = useState<"idle" | "loading" | "ok" | "dup" | "err">("idle");
  const [latency, setLatency] = useState<number | null>(null);
  const [alliance, setAlliance] = useState<string | null>(null);
  const discount = alliance === "LEN" ? 0.7 : 1;
  const t = C[lang];

  useEffect(() => { const s = localStorage.getItem("node-locale"); if (s === "en" || s === "es") setLang(s); }, []);
  useEffect(() => { localStorage.setItem("node-locale", lang); }, [lang]);
  useEffect(() => { const fn = () => setScrolled(window.scrollY > 50); fn(); window.addEventListener("scroll", fn, { passive: true }); return () => window.removeEventListener("scroll", fn); }, []);
  useEffect(() => {
    const measure = async () => {
      const start = performance.now();
      try { await fetch("/api/ping"); setLatency(Math.round(performance.now() - start)); } catch { setLatency(null); }
    };
    measure();
    const iv = setInterval(measure, 10000);
    return () => clearInterval(iv);
  }, []);

  const handleWl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wlEmail) return;
    setWlSt("loading");
    try {
      const r = await fetch("/api/waitlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: wlEmail, language: lang }) });
      if (r.status === 409) { setWlSt("dup"); return; }
      if (!r.ok) throw new Error();
      setWlSt("ok");
    } catch { setWlSt("err"); }
  };

  return (
    <SmoothScroll>
    <main className="grain landing-cursor-none">
      <CustomCursor />

      {/* ── Nav (FIX 1: flags inside nav) ── */}
      <nav className={`fixed top-0 left-0 right-0 z-40 px-6 md:px-12 py-5 flex justify-between items-center transition-all duration-500 ${scrolled ? "nav-blur" : ""}`}>
        <div className="flex items-center gap-3">
          <a href="#" className="font-[family-name:var(--font-lexend)] font-black text-xl tracking-tight">N.O.D.E.</a>
          <a
            href="https://nouvos.one"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="NOUVOS.ONE"
            className="hidden sm:flex items-center gap-2 group"
          >
            <span className="font-[family-name:var(--font-atkinson)] text-[0.7rem] text-[#F5F6FC]/40 group-hover:text-[#F5F6FC]/70 transition-colors">by</span>
            <Image
              src="/logos/NOUVOS.ONE_white.svg"
              alt="NOUVOS.ONE"
              width={95}
              height={16}
              className="opacity-60 group-hover:opacity-90 transition-opacity"
              style={{ height: 16, width: "auto" }}
            />
          </a>
        </div>
        <div className="flex items-center gap-4">
          {/* Lang flags — desktop only, inside nav */}
          <div className="hidden md:flex items-center gap-1.5">
            <button onClick={() => setLang("en")} className={`lang-flag text-lg ${lang === "en" ? "active" : ""}`}>🇺🇸</button>
            <button onClick={() => setLang("es")} className={`lang-flag text-lg ${lang === "es" ? "active" : ""}`}>🇲🇽</button>
          </div>
          <a href="/register" className="hidden md:block font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.2em] border border-[#F5F6FC]/30 px-5 py-2.5 hover:bg-[#F5F6FC] hover:text-[#130A06] transition-all">{t.nav.join}</a>
          <button onClick={() => setMenuOpen(true)} aria-label="Menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          </button>
        </div>
      </nav>

      {/* ── Menu Overlay (FIX 1: flags inside mobile menu) ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[55] bg-[#130A06] flex flex-col items-center justify-center gap-8">
            <button onClick={() => setMenuOpen(false)} className="absolute top-6 right-6" aria-label="Close">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
            {[[lang === "es" ? "Servicios" : "Services", "#services"], [lang === "es" ? "Proceso" : "Process", "#process"], [lang === "es" ? "Planes" : "Plans", "#pricing"], [lang === "es" ? "Registrarse" : "Sign Up", "/register"]].map(([label, href]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)} className="font-[family-name:var(--font-lexend)] font-bold text-4xl md:text-5xl text-[#F5F6FC]/80 hover:text-[#FFC919] transition-colors">{label}</a>
            ))}
            {/* Lang flags in mobile menu */}
            <div className="flex gap-4 mt-4">
              <button onClick={() => { setLang("en"); setMenuOpen(false); }} className={`lang-flag text-3xl ${lang === "en" ? "active" : ""}`}>🇺🇸</button>
              <button onClick={() => { setLang("es"); setMenuOpen(false); }} className={`lang-flag text-3xl ${lang === "es" ? "active" : ""}`}>🇲🇽</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ 1. HERO ═══ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(255,201,25,0.08) 0%, rgba(255,140,0,0.04) 30%, #130A06 70%)" }}>
        {/* Layer 1: Hero background image */}
        <Image src="/img/hero.png" alt="" fill priority className="object-cover opacity-25 pointer-events-none z-[1]" />
        {/* Layer 2: Noise/grain overlay — ABOVE image */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay z-[2]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize: "256px 256px" }} />
        {/* Layer 3: Radial gradient darken — ABOVE noise */}
        <div className="absolute inset-0 pointer-events-none z-[3]" style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 0%, rgba(19,10,6,0.4) 50%, rgba(19,10,6,0.8) 100%)" }} />
        <div className="relative z-10 text-center px-6">
          <RevealLine delay={0.2}><p className="font-[family-name:var(--font-lexend)] font-bold text-[0.7rem] md:text-[0.75rem] uppercase tracking-[0.3em] text-[#FFC919] mb-6">{t.hero.label}</p></RevealLine>
          <RevealLine delay={0.4}>
            <motion.h1
              style={{ y: useTransform(useScroll().scrollY, [0, 500], [0, -30]) }}
              className="font-[family-name:var(--font-lexend)] font-black text-[clamp(6rem,15vw,12rem)] leading-[0.85] tracking-[-0.03em] text-[#F5F6FC]"
            >
              N.O.D.E.
            </motion.h1>
          </RevealLine>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.9 }}
            className="font-[family-name:var(--font-atkinson)] mt-6"
            style={{ fontSize: "1.2rem", color: "rgba(245,246,252,0.7)" }}
          >
            {t.hero.tagline}
          </motion.p>
          <div className="mt-10 flex flex-col gap-2">
            {t.hero.lines.map((line, i) => (
              <motion.p
                key={line}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease, delay: 1.2 + i * 0.3 }}
                className="font-[family-name:var(--font-lexend)] font-bold text-[#F5F6FC]"
                style={{ fontSize: "1.3rem" }}
              >
                {line}
              </motion.p>
            ))}
          </div>
        </div>
        {/* HUD bottom bar */}
        <div className="absolute bottom-8 left-0 right-0 px-6 md:px-8 flex justify-between font-[family-name:var(--font-atkinson)] text-[10px] uppercase tracking-[0.2em] text-[rgba(245,246,252,0.35)]" style={{ fontVariantNumeric: "tabular-nums" }}>
          <FadeUp delay={0.8}><span>{t.hero.blPre}{latency ?? "---"}MS</span></FadeUp>
          <FadeUp delay={1.0} className="hidden md:block"><span>{t.hero.bc}</span></FadeUp>
          <FadeUp delay={1.2}><span>{t.hero.br}</span></FadeUp>
        </div>
      </section>

      {/* ═══ 1.5 SERVICES BANNER ═══ */}
      <div
        className="overflow-hidden py-5"
        style={{
          background: "rgba(255,201,25,0.06)",
          borderTop: "1px solid rgba(255,201,25,0.15)",
          borderBottom: "1px solid rgba(255,201,25,0.15)",
        }}
      >
        <div className="flex justify-center items-center gap-3 md:gap-6 px-6 flex-wrap font-[family-name:var(--font-lexend)] font-bold text-[0.8rem] uppercase tracking-[0.18em] text-[#FFC919]">
          {t.banner.map((s, i) => (
            <span key={s} className="flex items-center gap-3 md:gap-6">
              {i > 0 && <span className="text-[#FFC919]/40">|</span>}
              <span>{s}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ═══ 1.6 WHAT IS N.O.D.E. ═══ */}
      <section className="py-24 px-6 md:px-12 bg-[#1B1B1B]">
        <div className="max-w-[800px] mx-auto text-center">
          <FadeUp>
            <h2 className="font-[family-name:var(--font-lexend)] font-bold text-[clamp(1.6rem,3vw,2.2rem)] uppercase text-[#F5F6FC] mb-6">{t.whatIs.title}</h2>
          </FadeUp>
          <FadeUp delay={0.15}>
            <p className="font-[family-name:var(--font-atkinson)]" style={{ fontSize: "1.2rem", color: "rgba(245,246,252,0.7)", lineHeight: 1.8 }}>
              {t.whatIs.para}
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ═══ 2. SERVICES — Two columns + accordions (FIX 2) ═══ */}
      <section id="services" className="py-32 px-6 md:px-12 bg-[#130A06]">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24">
          {/* Left column */}
          <FadeUp className="lg:w-[40%]">
            <p className="font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.2em] text-[#FFC919] mb-4">{t.svc.label}</p>
            <h2 className="font-[family-name:var(--font-lexend)] font-bold text-[clamp(1.8rem,3vw,2.5rem)] uppercase leading-tight">{t.svc.title}</h2>
            <p className="mt-6 font-[family-name:var(--font-atkinson)] text-[1.05rem] text-[#F5F6FC]/50 leading-[1.8]">{t.svc.para}</p>
            <a href="/register" className="inline-block mt-8 font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.2em] border border-[#F5F6FC]/30 px-6 py-3 hover:bg-[#F5F6FC] hover:text-[#130A06] transition-all">{t.nav.join}</a>
          </FadeUp>
          {/* Right column — accordions */}
          <FadeUp delay={0.15} className="lg:w-[60%]">
            {t.svc.accordions.map((acc, i) => (
              <ServiceAccordion key={acc.name} acc={acc} idx={i} />
            ))}
            <div className="border-t border-[#F5F6FC]/10" />
          </FadeUp>
        </div>
      </section>

      {/* ═══ 3. PROCESS — parallax numbers (FIX 3) ═══ */}
      <section id="process" className="bg-[#130A06]">
        {t.proc.map((b) => (
          <div key={b.num} className="min-h-[90vh] flex items-center relative border-t border-[#F5F6FC]/10">
            <div className="w-full px-6 md:px-12 py-24">
              <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-24 items-end">
                <ParallaxNum num={b.num} />
                <div className="lg:w-[60%]">
                  <FadeUp delay={0.1}><p className="font-[family-name:var(--font-lexend)] font-bold text-[0.8rem] uppercase tracking-[0.3em] text-[#FFC919] mb-4">{b.label}</p></FadeUp>
                  <RevealLine delay={0.15}><h3 className="font-[family-name:var(--font-lexend)] font-bold text-[clamp(1.5rem,3vw,2.5rem)] uppercase leading-tight">{b.title}</h3></RevealLine>
                  <FadeUp delay={0.2}><p className="mt-6 font-[family-name:var(--font-atkinson)] text-[1.1rem] text-[#F5F6FC]/50 leading-[1.8] max-w-2xl">{b.para}</p></FadeUp>
                  <Stagger className="mt-8">
                    {b.list.map(([name, num]) => (
                      <motion.div key={name} variants={staggerChild} className="list-row font-[family-name:var(--font-atkinson)]">
                        <span className="text-[#F5F6FC]">{name}</span>
                        <span className="text-[#F5F6FC]/30 text-sm">{num}</span>
                      </motion.div>
                    ))}
                  </Stagger>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ═══ 4. ABOUT — parallax on image + gold line (FIX 4) ═══ */}
      <section className="py-32 px-6 md:px-12 bg-[#000741]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <FadeUp><ParaEl speed={0.05}><div className="gold-line mb-8" /></ParaEl></FadeUp>
            <RevealLine delay={0.1}><h2 className="font-[family-name:var(--font-lexend)] font-black text-[clamp(2rem,4vw,3rem)] leading-tight">{t.about.title}</h2></RevealLine>
            <FadeUp delay={0.2}><p className="mt-8 font-[family-name:var(--font-atkinson)] text-[1.2rem] text-[#F5F6FC]/70 leading-[1.8]">{t.about.para}</p></FadeUp>
          </div>
          <FadeUp delay={0.3}><ParaEl speed={0.1}><div className="relative aspect-[4/3] w-full"><Image src="/img/about.png" alt="N.O.D.E. team workspace" fill className="object-cover" /></div></ParaEl></FadeUp>
        </div>
      </section>

      {/* ═══ 5. MANIFESTO — Scroll Fill + Glitch Reveal ═══ */}
      <ManifestoSection lang={lang} />

      {/* ═══ 6. PRICING — Gold Bar stats rows + LEN filter ═══ */}
      <section id="pricing" className="relative bg-[#FFC919] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.12] mix-blend-multiply pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize: "256px 256px" }} />
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-12 md:pt-16">
          {/* Alliance filter + LEN paragraph */}
          <FadeUp>
            <div className="flex flex-col md:flex-row md:items-center gap-4 pb-10">
              <button
                onClick={() => setAlliance(alliance === "LEN" ? null : "LEN")}
                className={`shrink-0 font-[family-name:var(--font-lexend)] font-bold text-[0.8rem] uppercase tracking-[0.12em] px-5 py-2.5 transition-all ${alliance === "LEN" ? "bg-[#130A06] text-[#FFC919] border border-[#130A06]" : "bg-transparent text-[#130A06] border border-[#130A06]/30 hover:border-[#130A06]"}`}
              >
                {t.pricing.lenBtn}
              </button>
              <p className="font-[family-name:var(--font-atkinson)] text-[0.85rem] text-[#130A06]/60">
                {t.pricing.lenPara[0]}
                <a href="https://latinoentrepreneurialnetwork.org" target="_blank" rel="noopener noreferrer" className="text-[#130A06] underline decoration-[#130A06]/30 hover:decoration-[#130A06] transition-all font-bold">{t.pricing.lenPara[1]}</a>
                {t.pricing.lenPara[2]}
              </p>
            </div>
          </FadeUp>

          {t.pricing.plans.map((pl, i) => {
            const price = Math.round(pl.front * discount);
            const setup = Math.round(pl.setup * discount);

            return (
              <FadeUp key={pl.name} delay={i * 0.1}>
                <div className={`price-row flex flex-col md:flex-row md:items-center gap-6 md:gap-16 py-12 md:py-16 ${i < t.pricing.plans.length - 1 ? "border-b border-[#130A06]/15" : ""}`}>
                  <div className="md:w-[45%]">
                    <div className="flex items-baseline gap-1">
                      <AnimatedPrice value={price} className="font-[family-name:var(--font-lexend)] font-black text-[clamp(5rem,12vw,9rem)] leading-none text-[#130A06]" />
                      <span className="font-[family-name:var(--font-lexend)] font-black text-[clamp(1.5rem,3vw,2.7rem)] text-[#130A06] align-super">+</span>
                      <span className="font-[family-name:var(--font-atkinson)] text-[#130A06]/50 text-lg ml-1">{pl.per}</span>
                    </div>
                    <p className="mt-1 font-[family-name:var(--font-atkinson)] text-[0.75rem] text-[#130A06]/50">
                      {t.pricing.setup}: <AnimatedSetup value={setup} className="inline" /> {t.pricing.oneTime}
                    </p>
                    {alliance === "LEN" && (
                      <p className="mt-1 font-[family-name:var(--font-lexend)] font-bold text-[0.7rem] text-[#130A06]/70">{t.pricing.lenLabel}</p>
                    )}
                  </div>
                  <div className="md:w-[55%]">
                    <h3 className="font-[family-name:var(--font-lexend)] font-bold text-[1.4rem] uppercase tracking-[0.1em] text-[#130A06]">{pl.name}</h3>
                    <p className="mt-1 font-[family-name:var(--font-atkinson)] text-[1rem] text-[#130A06]/60">{pl.desc}</p>
                  </div>
                </div>
              </FadeUp>
            );
          })}
        </div>
      </section>

      {/* ═══ 7. CTA ═══ */}
      <section id="register" className="py-32 px-6 md:px-12 bg-[#000741]">
        <div className="max-w-3xl mx-auto text-center">
          <RevealLine><h2 className="font-[family-name:var(--font-lexend)] font-black text-[clamp(2rem,5vw,3.5rem)]">{t.wl.title}</h2></RevealLine>
          <FadeUp delay={0.15}><p className="mt-4 font-[family-name:var(--font-atkinson)] text-lg text-[#F5F6FC]/50">{t.wl.sub}</p></FadeUp>
          <FadeUp delay={0.3}>
            <div className="mt-12 flex flex-col items-center gap-4">
              <a href="/register" className="bg-[#FFC919] text-[#130A06] font-[family-name:var(--font-lexend)] font-bold text-[0.85rem] uppercase tracking-[0.15em] px-10 py-4 hover:bg-[#F5F6FC] transition-all inline-block">{t.wl.cta} →</a>
              <a href="/login" className="font-[family-name:var(--font-atkinson)] text-sm text-[#F5F6FC]/40 hover:text-[#FFC919] transition-colors">{t.wl.login}</a>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ═══ 8. FOOTER ═══ */}
      <footer className="py-16 px-6 md:px-12 bg-[#0a0504] border-t border-[#F5F6FC]/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="font-[family-name:var(--font-lexend)] font-black text-2xl flex items-center gap-2">
            N.O.D.E.
            <a
              href="https://nouvos.one"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="NOUVOS.ONE"
              className="flex items-center gap-2 group ml-1"
            >
              <span className="font-[family-name:var(--font-atkinson)] font-normal text-[0.7rem] text-[#F5F6FC]/40 group-hover:text-[#F5F6FC]/70 transition-colors">by</span>
              <Image
                src="/logos/NOUVOS.ONE_white.svg"
                alt="NOUVOS.ONE"
                width={95}
                height={16}
                className="opacity-60 group-hover:opacity-90 transition-opacity"
                style={{ height: 16, width: "auto" }}
              />
            </a>
          </div>
          <div className="flex gap-8 font-[family-name:var(--font-atkinson)] text-sm text-[#F5F6FC]/40">
            <a href="#" className="hover:text-[#FFC919] transition-colors">Twitter</a>
            <a href="#" className="hover:text-[#FFC919] transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-[#FFC919] transition-colors">Instagram</a>
          </div>
          <p className="font-[family-name:var(--font-atkinson)] text-sm text-[#F5F6FC]/30">{t.footer}</p>
        </div>
        <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-[#F5F6FC]/5 flex justify-center items-center gap-3">
          <span className="font-[family-name:var(--font-atkinson)] text-xs text-[#F5F6FC]/40 uppercase tracking-[0.2em]">Powered by</span>
          <a
            href="https://nouvos.one"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="NOUVOS.ONE"
            className="group inline-flex"
          >
            <Image
              src="/logos/NOUVOS.ONE_white.svg"
              alt="NOUVOS.ONE"
              width={95}
              height={16}
              className="opacity-60 group-hover:opacity-90 transition-opacity"
              style={{ height: 16, width: "auto" }}
            />
          </a>
        </div>
      </footer>
    </main>
    </SmoothScroll>
  );
}
