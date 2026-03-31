"use client";

import { useEffect, useState, useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  AnimatePresence,
} from "framer-motion";

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
    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    const over = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("a,button,.svc-card,.filter-tab,.list-row,.price-card,.lang-flag"))
        setHovering(true);
    };
    const out = () => setHovering(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    window.addEventListener("mouseout", out);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      window.removeEventListener("mouseout", out);
    };
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
      <motion.div
        initial={{ y: "100%" }}
        whileInView={{ y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, ease, delay }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.9, ease, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Stagger({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const staggerChild = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

/* ═══════════════════════════════════════════
   IMAGE PLACEHOLDER
   ═══════════════════════════════════════════ */

function Img({ desc, ratio = "16/9" }: { desc: string; ratio?: string }) {
  return (
    <div className="img-placeholder w-full" style={{ aspectRatio: ratio }}>
      Image placeholder — {desc}
    </div>
  );
}

/* ═══════════════════════════════════════════
   CONTENT / TRANSLATIONS
   ═══════════════════════════════════════════ */

const C = {
  en: {
    nav: { join: "Join Waitlist" },
    hero: {
      label: "NETWORK ORGANIZED DELIVERY ENGINE",
      bl: "POWERED BY NOUVOS",
      bc: "DESIGN · WEB · MARKETING",
      br: "EST. 2026",
    },
    svc: {
      title: "What We Deliver",
      sub: "Three service lines. Real deliverables.",
      filters: ["All", "Design", "Web", "Marketing"],
      items: [
        { n: "Brand Starter", cat: "Design", p: "from $200 credits", d: "Complete brand identity package for new businesses" },
        { n: "Landing Page", cat: "Web", p: "from $200 credits", d: "High-converting page with AI-assisted copy" },
        { n: "Content Pack", cat: "Marketing", p: "from $80 credits", d: "Blog posts, newsletters, and social content" },
        { n: "Social Pack", cat: "Design", p: "from $60 credits", d: "30 days of branded social media graphics" },
        { n: "SEO Foundation", cat: "Web", p: "from $45 credits", d: "Technical SEO setup and content optimization" },
        { n: "Promo Campaign", cat: "Marketing", p: "from $100 credits", d: "End-to-end promotional campaign management" },
      ],
    },
    proc: [
      {
        num: "01", label: "// 01",
        title: "START IN UNDER 24 HOURS",
        para: "Pick the plan that fits your business. No long contracts, no fine print, no surprises. Your digital team activates the moment you subscribe. One monthly payment gives you access to dedicated designers, developers, and marketers.",
        list: [["Plan Member", "01"], ["Plan Growth", "02"], ["Plan Pro", "03"], ["Custom Projects", "04"]],
      },
      {
        num: "02", label: "// 02",
        title: "AI-GUIDED BRIEFING SYSTEM",
        para: "You don't need to know design or tech to request what you need. Our smart assistant guides you step by step to articulate your request. The result is a professional brief your team can execute without back and forth.",
        list: [["Smart Wizard", "01"], ["Auto-categorization", "02"], ["File Attachments", "03"], ["Brief Generation", "04"], ["PM Escalation", "05"]],
      },
      {
        num: "03", label: "// 03",
        title: "YOUR DEDICATED CREATIVE TEAM",
        para: "Behind every request is a real team. Graphic designers, AI-assisted developers, and specialized community managers. Your project manager coordinates everything — you just receive finished work in 48 to 72 business hours.",
        list: [["Graphic Design", "01"], ["AI-Assisted Development", "02"], ["Community Management", "03"], ["Project Management", "04"], ["Quality Assurance", "05"]],
      },
      {
        num: "04", label: "// 04",
        title: "APPROVE, ITERATE, SCALE",
        para: "Receive ready-to-use deliverables. Need adjustments? Request unlimited revisions. Approve on first round and earn bonus credits. As your business grows, your plan grows with you — more credits, more speed, more services.",
        list: [["Unlimited Revisions", "01"], ["First-Round Bonus", "02"], ["Credit Packs", "03"], ["Plan Upgrades", "04"]],
      },
    ],
    about: {
      title: "Why N.O.D.E. exists",
      para: "N.O.D.E. is born from Nouvos Solutions — a logistics technology company that has spent years building systems for the global supply chain. We know what it means to operate with distributed teams, manage deliveries with real deadlines, and scale operations without losing quality. We apply exactly that mindset to creative services: clear processes, predictable deliveries, technology that amplifies human talent.",
    },
    quote: "In a world full of generic noise, we help businesses build their digital presence with a real team, proven processes, and technology that accelerates everything.",
    pricing: {
      title: "Plans",
      sub: "One monthly fee. Real deliverables.",
      badge: "MOST POPULAR",
      plans: [
        { name: "Member", price: "$100", per: "/mo", feat: ["$140 credits", "1 active request", "5-day turnaround", "Design + content", "Email support"], ft: false },
        { name: "Growth", price: "$190", per: "/mo", feat: ["$350 credits", "2 active requests", "3-day turnaround", "Design + web + content", "Priority support", "Brand strategy session"], ft: true },
        { name: "Pro", price: "$330", per: "/mo", feat: ["$650 credits", "Unlimited queue", "24-48h turnaround", "All services", "Dedicated Slack", "Monthly strategy call", "Credit rollover"], ft: false },
      ],
    },
    wl: { title: "Be among the first", sub: "The first 100 members get bonus credits.", cta: "Join Waitlist", ph: "Enter your email", sending: "Sending...", ok: "You're on the list!", dup: "Already registered.", err: "Something went wrong." },
    footer: "© 2026 Nouvos Solutions LLC",
  },
  es: {
    nav: { join: "Unirse a Waitlist" },
    hero: {
      label: "NETWORK ORGANIZED DELIVERY ENGINE",
      bl: "POWERED BY NOUVOS",
      bc: "DISEÑO · WEB · MARKETING",
      br: "EST. 2026",
    },
    svc: {
      title: "Lo que entregamos",
      sub: "Tres líneas de servicio. Entregables reales.",
      filters: ["Todos", "Diseño", "Web", "Marketing"],
      items: [
        { n: "Brand Starter", cat: "Diseño", p: "desde $200 créditos", d: "Paquete completo de identidad de marca" },
        { n: "Landing Page", cat: "Web", p: "desde $200 créditos", d: "Página de alta conversión con copy asistido por AI" },
        { n: "Content Pack", cat: "Marketing", p: "desde $80 créditos", d: "Posts de blog, newsletters y contenido social" },
        { n: "Social Pack", cat: "Diseño", p: "desde $60 créditos", d: "30 días de gráficos sociales con marca" },
        { n: "SEO Foundation", cat: "Web", p: "desde $45 créditos", d: "Configuración técnica SEO y optimización" },
        { n: "Promo Campaign", cat: "Marketing", p: "desde $100 créditos", d: "Gestión integral de campañas promocionales" },
      ],
    },
    proc: [
      {
        num: "01", label: "// 01",
        title: "ACTÍVATE EN MENOS DE 24 HORAS",
        para: "Elige el plan que se ajuste a tu negocio. Sin contratos largos, sin letra chica, sin sorpresas. Tu equipo digital se activa desde el momento en que te suscribes. Un solo pago mensual te da acceso a diseñadores, developers y marketers dedicados.",
        list: [["Plan Member", "01"], ["Plan Growth", "02"], ["Plan Pro", "03"], ["Proyectos Custom", "04"]],
      },
      {
        num: "02", label: "// 02",
        title: "SISTEMA DE BRIEFING GUIADO POR AI",
        para: "No necesitas saber de diseño ni de tecnología para pedir lo que necesitas. Nuestro asistente inteligente te guía paso a paso para articular tu solicitud. El resultado es un brief profesional que nuestro equipo puede ejecutar sin idas y vueltas.",
        list: [["Smart Wizard", "01"], ["Auto-categorización", "02"], ["Adjuntos de Archivos", "03"], ["Generación de Brief", "04"], ["Escalación a PM", "05"]],
      },
      {
        num: "03", label: "// 03",
        title: "TU EQUIPO CREATIVO DEDICADO",
        para: "Detrás de cada solicitud hay un equipo real. Diseñadores gráficos, desarrolladores asistidos por AI, y community managers especializados. Tu project manager coordina todo — tú solo recibes el trabajo terminado en 48 a 72 horas hábiles.",
        list: [["Diseño Gráfico", "01"], ["Desarrollo AI-Asistido", "02"], ["Community Management", "03"], ["Project Management", "04"], ["Quality Assurance", "05"]],
      },
      {
        num: "04", label: "// 04",
        title: "APRUEBA, ITERA, ESCALA",
        para: "Recibe entregas listas para usar. Si necesitas ajustes, pide revisiones ilimitadas. Aprueba a la primera y gana créditos bonus. A medida que tu negocio crece, tu plan crece contigo — más créditos, más velocidad, más servicios.",
        list: [["Revisiones Ilimitadas", "01"], ["Bonus Primera Ronda", "02"], ["Packs de Créditos", "03"], ["Upgrades de Plan", "04"]],
      },
    ],
    about: {
      title: "Por qué existe N.O.D.E.",
      para: "N.O.D.E. nace de Nouvos Solutions — una empresa de tecnología logística que lleva años construyendo sistemas para la cadena de suministro global. Sabemos lo que significa operar con equipos distribuidos, gestionar entregas con deadlines reales, y escalar operaciones sin perder calidad. Aplicamos exactamente esa mentalidad a los servicios creativos: procesos claros, entregas predecibles, tecnología que amplifica al talento humano.",
    },
    quote: "En un mundo lleno de ruido genérico, ayudamos a negocios a construir su presencia digital con un equipo real, procesos probados, y tecnología que acelera todo.",
    pricing: {
      title: "Planes",
      sub: "Una cuota mensual. Entregables reales.",
      badge: "MÁS POPULAR",
      plans: [
        { name: "Member", price: "$100", per: "/mes", feat: ["$140 créditos", "1 request activo", "Turnaround 5 días", "Diseño + contenido", "Soporte por email"], ft: false },
        { name: "Growth", price: "$190", per: "/mes", feat: ["$350 créditos", "2 requests activos", "Turnaround 3 días", "Diseño + web + contenido", "Soporte prioritario", "Brand strategy session"], ft: true },
        { name: "Pro", price: "$330", per: "/mes", feat: ["$650 créditos", "Cola ilimitada", "Turnaround 24-48h", "Todos los servicios", "Slack dedicado", "Monthly strategy call", "Rollover de créditos"], ft: false },
      ],
    },
    wl: { title: "Sé de los primeros", sub: "Los primeros 100 miembros reciben créditos extra.", cta: "Unirse a Waitlist", ph: "Ingresa tu email", sending: "Enviando...", ok: "¡Estás en la lista!", dup: "Email ya registrado.", err: "Algo salió mal." },
    footer: "© 2026 Nouvos Solutions LLC",
  },
};

const catMap: Record<string, string> = { "Diseño": "Design", "Todos": "All" };
const norm = (c: string) => catMap[c] || c;

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
   PAGE
   ═══════════════════════════════════════════ */

export default function Home() {
  const [lang, setLang] = useState<"en" | "es">("en");
  const [scrolled, setScrolled] = useState(false);
  const [filter, setFilter] = useState("All");
  const [menuOpen, setMenuOpen] = useState(false);
  const [wlEmail, setWlEmail] = useState("");
  const [wlSt, setWlSt] = useState<"idle" | "loading" | "ok" | "dup" | "err">("idle");
  const t = C[lang];

  useEffect(() => {
    const s = localStorage.getItem("node-locale");
    if (s === "en" || s === "es") setLang(s);
  }, []);
  useEffect(() => { localStorage.setItem("node-locale", lang); }, [lang]);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const filtered = filter === "All"
    ? t.svc.items
    : t.svc.items.filter((s) => norm(s.cat) === filter);

  const handleWl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wlEmail) return;
    setWlSt("loading");
    try {
      const r = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: wlEmail, language: lang }),
      });
      if (r.status === 409) { setWlSt("dup"); return; }
      if (!r.ok) throw new Error();
      setWlSt("ok");
    } catch { setWlSt("err"); }
  };

  return (
    <main className="grain">
      <CustomCursor />

      {/* ── Lang Flags ── */}
      <div className="fixed top-6 right-6 z-50 flex gap-2">
        <button onClick={() => setLang("en")} className={`lang-flag text-xl ${lang === "en" ? "active" : ""}`}>🇺🇸</button>
        <button onClick={() => setLang("es")} className={`lang-flag text-xl ${lang === "es" ? "active" : ""}`}>🇲🇽</button>
      </div>

      {/* ── Nav ── */}
      <nav className={`fixed top-0 left-0 right-0 z-40 px-6 md:px-12 py-5 flex justify-between items-center transition-all duration-500 ${scrolled ? "nav-blur" : ""}`}>
        <a href="#" className="font-[family-name:var(--font-lexend)] font-black text-xl tracking-tight">N.O.D.E.</a>
        <div className="flex items-center gap-5">
          <a href="#waitlist" className="hidden md:block font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.2em] border border-[#F5F6FC]/30 px-5 py-2.5 hover:bg-[#F5F6FC] hover:text-[#130A06] transition-all">{t.nav.join}</a>
          <button onClick={() => setMenuOpen(true)} aria-label="Menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          </button>
        </div>
      </nav>

      {/* ── Menu Overlay ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[55] bg-[#130A06] flex flex-col items-center justify-center gap-8"
          >
            <button onClick={() => setMenuOpen(false)} className="absolute top-6 right-6" aria-label="Close">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
            {[
              [lang === "es" ? "Servicios" : "Services", "#services"],
              [lang === "es" ? "Proceso" : "Process", "#process"],
              [lang === "es" ? "Planes" : "Plans", "#pricing"],
              [lang === "es" ? "Contacto" : "Contact", "#waitlist"],
            ].map(([label, href]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)} className="font-[family-name:var(--font-lexend)] font-bold text-4xl md:text-5xl text-[#F5F6FC]/80 hover:text-[#FFC919] transition-colors">{label}</a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════
         1. HERO
         ═══════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <ParallaxBg desc="Hero visual — futuristic/tech dark mood" />
        <div className="absolute inset-0 bg-[#130A06]/75" />
        <div className="relative z-10 text-center px-6">
          <RevealLine delay={0.2}>
            <p className="font-[family-name:var(--font-lexend)] font-bold text-[0.7rem] md:text-[0.75rem] uppercase tracking-[0.3em] text-[#FFC919] mb-6">{t.hero.label}</p>
          </RevealLine>
          <RevealLine delay={0.4}>
            <h1 className="font-[family-name:var(--font-lexend)] font-black text-[clamp(6rem,15vw,12rem)] leading-[0.85] tracking-[-0.03em] text-[#F5F6FC]">N.O.D.E.</h1>
          </RevealLine>
        </div>
        <div className="absolute bottom-8 left-0 right-0 px-6 md:px-12 flex justify-between text-[0.75rem] font-[family-name:var(--font-lexend)] uppercase tracking-[0.2em] text-[rgba(245,246,252,0.5)]">
          <FadeUp delay={0.8}><span>{t.hero.bl}</span></FadeUp>
          <FadeUp delay={1.0} className="hidden md:block"><span>{t.hero.bc}</span></FadeUp>
          <FadeUp delay={1.2}><span>{t.hero.br}</span></FadeUp>
        </div>
      </section>

      {/* ═══════════════════════════════
         2. SERVICES
         ═══════════════════════════════ */}
      <section id="services" className="py-32 px-6 md:px-12 bg-[#130A06]">
        <div className="max-w-7xl mx-auto">
          <FadeUp>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16">
              <div>
                <h2 className="font-[family-name:var(--font-lexend)] font-black text-[clamp(2rem,4vw,3rem)]">{t.svc.title}</h2>
                <p className="mt-2 font-[family-name:var(--font-atkinson)] text-lg text-[#F5F6FC]/50">{t.svc.sub}</p>
              </div>
              <div className="flex gap-6 mt-8 md:mt-0 font-[family-name:var(--font-lexend)] text-[0.75rem] uppercase tracking-[0.2em]">
                {t.svc.filters.map((f) => (
                  <button key={f} onClick={() => setFilter(norm(f))} className={`filter-tab ${filter === norm(f) ? "active" : ""}`}>{f}</button>
                ))}
              </div>
            </div>
          </FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((s, i) => (
              <FadeUp key={s.n} delay={i * 0.08}>
                <div className="svc-card">
                  <Img desc={s.n} />
                  <div className="svc-overlay">
                    <p className="font-[family-name:var(--font-atkinson)] text-sm text-[#F5F6FC]/80 mb-2">{s.d}</p>
                    <p className="font-[family-name:var(--font-lexend)] font-bold text-[#FFC919] text-sm">{s.p}</p>
                  </div>
                  <div className="py-4 border-b border-[#F5F6FC]/10">
                    <h3 className="font-[family-name:var(--font-lexend)] font-bold text-lg">{s.n}</h3>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════
         3. PROCESS
         ═══════════════════════════════ */}
      <section id="process" className="bg-[#130A06]">
        {t.proc.map((b, idx) => (
          <div key={b.num} className="min-h-[90vh] flex items-center relative border-t border-[#F5F6FC]/10">
            <div className="w-full px-6 md:px-12 py-24">
              <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-24 items-end">
                <FadeUp className="lg:w-[40%] flex items-end">
                  <span className="font-[family-name:var(--font-lexend)] font-black text-[clamp(8rem,20vw,18rem)] leading-[0.8] number-stroke select-none">{b.num}</span>
                </FadeUp>
                <div className="lg:w-[60%]">
                  <FadeUp delay={0.1}>
                    <p className="font-[family-name:var(--font-lexend)] font-bold text-[0.8rem] uppercase tracking-[0.3em] text-[#FFC919] mb-4">{b.label}</p>
                  </FadeUp>
                  <RevealLine delay={0.15}>
                    <h3 className="font-[family-name:var(--font-lexend)] font-bold text-[clamp(1.5rem,3vw,2.5rem)] uppercase leading-tight">{b.title}</h3>
                  </RevealLine>
                  <FadeUp delay={0.2}>
                    <p className="mt-6 font-[family-name:var(--font-atkinson)] text-[1.1rem] text-[#F5F6FC]/50 leading-[1.8] max-w-2xl">{b.para}</p>
                  </FadeUp>
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

      {/* ═══════════════════════════════
         4. ABOUT
         ═══════════════════════════════ */}
      <section className="py-32 px-6 md:px-12 bg-[#000741]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <FadeUp><div className="gold-line mb-8" /></FadeUp>
            <RevealLine delay={0.1}>
              <h2 className="font-[family-name:var(--font-lexend)] font-black text-[clamp(2rem,4vw,3rem)] leading-tight">{t.about.title}</h2>
            </RevealLine>
            <FadeUp delay={0.2}>
              <p className="mt-8 font-[family-name:var(--font-atkinson)] text-[1.2rem] text-[#F5F6FC]/70 leading-[1.8]">{t.about.para}</p>
            </FadeUp>
          </div>
          <FadeUp delay={0.3}><Img desc="Team/workspace visual" ratio="4/3" /></FadeUp>
        </div>
      </section>

      {/* ═══════════════════════════════
         5. QUOTE
         ═══════════════════════════════ */}
      <section className="py-32 px-6 md:px-12 bg-[#130A06] relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative">
          <div className="absolute -left-6 -top-6 quote-mark select-none" aria-hidden="true">&ldquo;</div>
          <FadeUp>
            <blockquote className="relative z-10 border-l-4 border-[#FFC919] pl-8 md:pl-16 font-[family-name:var(--font-atkinson)] font-bold italic text-[clamp(1.3rem,2.5vw,2rem)] text-[#F5F6FC] leading-[1.6]">
              {t.quote}
            </blockquote>
          </FadeUp>
          <div className="absolute -right-4 bottom-0 quote-mark rotate-180 select-none" aria-hidden="true">&rdquo;</div>
        </div>
      </section>

      {/* ═══════════════════════════════
         6. PRICING
         ═══════════════════════════════ */}
      <section id="pricing" className="py-32 px-6 md:px-12 bg-[#130A06]">
        <div className="max-w-7xl mx-auto">
          <FadeUp className="text-center mb-16">
            <h2 className="font-[family-name:var(--font-lexend)] font-black text-[clamp(2rem,4vw,3rem)]">{t.pricing.title}</h2>
            <p className="mt-2 font-[family-name:var(--font-atkinson)] text-lg text-[#F5F6FC]/50">{t.pricing.sub}</p>
          </FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {t.pricing.plans.map((pl, i) => (
              <FadeUp key={pl.name} delay={i * 0.12}>
                <div className={`price-card p-8 ${pl.ft ? "featured" : ""}`}>
                  {pl.ft && <span className="inline-block bg-[#FFC919] text-[#130A06] font-[family-name:var(--font-lexend)] font-bold text-[0.65rem] uppercase tracking-[0.15em] px-3 py-1 mb-5">{t.pricing.badge}</span>}
                  <h3 className="font-[family-name:var(--font-lexend)] font-bold text-xl uppercase tracking-[0.15em] mb-4">{pl.name}</h3>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="font-[family-name:var(--font-lexend)] font-black text-[3.5rem] leading-none">{pl.price}</span>
                    <span className="text-[#F5F6FC]/40 text-sm">{pl.per}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {pl.feat.map((f) => (
                      <li key={f} className="font-[family-name:var(--font-atkinson)] text-[#F5F6FC]/70 flex items-start gap-3 text-[0.95rem]">
                        <span className="text-[#FFC919] mt-0.5">→</span>{f}
                      </li>
                    ))}
                  </ul>
                  <a href="#waitlist" className={`block w-full text-center font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.15em] py-4 transition-all ${pl.ft ? "bg-[#FFC919] text-[#130A06] hover:bg-[#F5F6FC]" : "border border-[#F5F6FC]/30 hover:bg-[#F5F6FC] hover:text-[#130A06]"}`}>{t.nav.join}</a>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════
         7. WAITLIST
         ═══════════════════════════════ */}
      <section id="waitlist" className="py-32 px-6 md:px-12 bg-[#000741]">
        <div className="max-w-3xl mx-auto text-center">
          <RevealLine><h2 className="font-[family-name:var(--font-lexend)] font-black text-[clamp(2rem,5vw,3.5rem)]">{t.wl.title}</h2></RevealLine>
          <FadeUp delay={0.15}><p className="mt-4 font-[family-name:var(--font-atkinson)] text-lg text-[#F5F6FC]/50">{t.wl.sub}</p></FadeUp>
          <FadeUp delay={0.3}>
            {wlSt === "ok" ? (
              <p className="mt-12 font-[family-name:var(--font-atkinson)] text-xl text-[#FFC919]">{t.wl.ok}</p>
            ) : (
              <>
                <form onSubmit={handleWl} className="mt-12 flex flex-col md:flex-row gap-4 max-w-xl mx-auto">
                  <input type="email" required value={wlEmail} onChange={(e) => setWlEmail(e.target.value)} placeholder={t.wl.ph} className="form-input flex-1 font-[family-name:var(--font-atkinson)]" />
                  <button type="submit" disabled={wlSt === "loading"} className="bg-[#FFC919] text-[#130A06] font-[family-name:var(--font-lexend)] font-bold text-[0.75rem] uppercase tracking-[0.15em] px-8 py-4 hover:bg-[#F5F6FC] transition-all disabled:opacity-50">{wlSt === "loading" ? t.wl.sending : t.wl.cta}</button>
                </form>
                {wlSt === "dup" && <p className="mt-4 text-[#FFC919] text-sm">{t.wl.dup}</p>}
                {wlSt === "err" && <p className="mt-4 text-red-400 text-sm">{t.wl.err}</p>}
              </>
            )}
          </FadeUp>
        </div>
      </section>

      {/* ═══════════════════════════════
         8. FOOTER
         ═══════════════════════════════ */}
      <footer className="py-16 px-6 md:px-12 bg-[#0a0504] border-t border-[#F5F6FC]/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="font-[family-name:var(--font-lexend)] font-black text-2xl">N.O.D.E. <span className="text-[#F5F6FC]/40 font-normal text-sm">by Nouvos</span></div>
          <div className="flex gap-8 font-[family-name:var(--font-atkinson)] text-sm text-[#F5F6FC]/40">
            <a href="#" className="hover:text-[#FFC919] transition-colors">Twitter</a>
            <a href="#" className="hover:text-[#FFC919] transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-[#FFC919] transition-colors">Instagram</a>
          </div>
          <p className="font-[family-name:var(--font-atkinson)] text-sm text-[#F5F6FC]/30">{t.footer}</p>
        </div>
      </footer>
    </main>
  );
}
