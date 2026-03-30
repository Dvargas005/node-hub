"use client";

import { useState } from "react";
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

/* ─── SVG Hero Graphic: Connected Nodes ─── */
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

/* ─── 1. HERO ─── */
function Hero() {
  return (
    <section className="relative bg-asphalt-black text-ice-white section-padding overflow-hidden">
      <div className="container-narrow flex flex-col items-start gap-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-[family-name:var(--font-lexend)] font-black text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.05] tracking-tight">
            Tu equipo digital.
            <br />
            <span className="text-gold-bar">Una suscripción.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-ice-white/70 max-w-lg leading-relaxed">
            Diseño, desarrollo y marketing — todo lo que tu negocio necesita
            para crecer online, sin contratos largos ni sorpresas.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#waitlist"
              className="inline-flex items-center gap-2 bg-gold-bar text-asphalt-black font-bold px-8 py-4 text-lg hover:brightness-110 transition-all"
            >
              Unirme al Waitlist
              <ArrowRight size={20} />
            </a>
            <a
              href="#planes"
              className="inline-flex items-center gap-2 border-2 border-ice-white/30 text-ice-white px-8 py-4 text-lg hover:border-ice-white/60 transition-all"
            >
              Ver Planes
            </a>
          </div>
        </div>
        <div className="hidden lg:block flex-shrink-0">
          <NodeGraphic />
        </div>
      </div>
    </section>
  );
}

/* ─── 2. EL PROBLEMA ─── */
function ElProblema() {
  const problems = [
    {
      icon: DollarSign,
      title: "Costos impredecibles",
      description:
        "Freelancers que cobran por hora, agencias con cotizaciones infladas. Nunca sabes cuánto vas a gastar.",
    },
    {
      icon: Users,
      title: "Sin acceso a talento",
      description:
        "Encontrar diseñadores, devs y marketers confiables es un trabajo de tiempo completo.",
    },
    {
      icon: Globe,
      title: "Barrera de idioma",
      description:
        "Las mejores herramientas y equipos operan en inglés. Tu negocio necesita comunicación clara.",
    },
  ];

  return (
    <section className="bg-ice-white section-padding">
      <div className="container-narrow">
        <h2 className="font-[family-name:var(--font-lexend)] font-bold text-3xl md:text-5xl tracking-tight text-midnight-express">
          El problema
        </h2>
        <p className="mt-4 text-lg text-asphalt-black/60 max-w-xl">
          Crecer en digital no debería ser tan complicado.
        </p>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {problems.map((p) => (
            <div
              key={p.title}
              className="border border-asphalt-black/10 p-8 flex flex-col gap-4"
            >
              <p.icon size={32} className="text-gold-bar" strokeWidth={1.5} />
              <h3 className="font-[family-name:var(--font-lexend)] font-bold text-xl">
                {p.title}
              </h3>
              <p className="text-asphalt-black/60 leading-relaxed">
                {p.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── 3. LA SOLUCIÓN ─── */
function LaSolucion() {
  const services = [
    {
      icon: Palette,
      title: "Diseño",
      items: [
        "Identidad visual",
        "UI/UX para web y mobile",
        "Social media assets",
        "Presentaciones",
        "Brand guidelines",
      ],
    },
    {
      icon: Code2,
      title: "Web",
      items: [
        "Landing pages",
        "Sitios corporativos",
        "E-commerce",
        "Web apps",
        "Mantenimiento y hosting",
      ],
    },
    {
      icon: Megaphone,
      title: "Marketing",
      items: [
        "SEO y contenido",
        "Email marketing",
        "Gestión de redes sociales",
        "Paid ads",
        "Estrategia digital",
      ],
    },
  ];

  return (
    <section className="bg-midnight-express text-ice-white section-padding">
      <div className="container-narrow">
        <h2 className="font-[family-name:var(--font-lexend)] font-bold text-3xl md:text-5xl tracking-tight">
          La solución
        </h2>
        <p className="mt-4 text-lg text-ice-white/50 max-w-xl">
          Un equipo completo bajo una sola suscripción mensual.
        </p>
        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {services.map((s) => (
            <div key={s.title}>
              <s.icon size={36} className="text-gold-bar" strokeWidth={1.5} />
              <h3 className="mt-4 font-[family-name:var(--font-lexend)] font-bold text-2xl">
                {s.title}
              </h3>
              <ul className="mt-6 space-y-3">
                {s.items.map((item) => (
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
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── 4. CÓMO FUNCIONA ─── */
function ComoFunciona() {
  const steps = [
    {
      icon: ClipboardList,
      step: "01",
      title: "Suscríbete",
      description: "Elige el plan que se adapte a tu negocio. Sin contratos, cancela cuando quieras.",
    },
    {
      icon: MessageSquare,
      step: "02",
      title: "Describe",
      description: "Envía tus requests: diseños, páginas, campañas. Todo desde un solo canal.",
    },
    {
      icon: Hammer,
      step: "03",
      title: "Nosotros hacemos",
      description: "Nuestro equipo trabaja en tus requests con turnaround de 48-72h.",
    },
    {
      icon: PackageCheck,
      step: "04",
      title: "Recibe",
      description: "Entregas listas para usar. Revisiones ilimitadas hasta que estés satisfecho.",
    },
  ];

  return (
    <section className="bg-ice-white section-padding">
      <div className="container-narrow">
        <h2 className="font-[family-name:var(--font-lexend)] font-bold text-3xl md:text-5xl tracking-tight text-midnight-express">
          Cómo funciona
        </h2>
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.step} className="flex flex-col gap-4">
              <span className="font-[family-name:var(--font-lexend)] font-black text-6xl text-asphalt-black/10">
                {s.step}
              </span>
              <s.icon size={28} className="text-gold-bar" strokeWidth={1.5} />
              <h3 className="font-[family-name:var(--font-lexend)] font-bold text-xl">
                {s.title}
              </h3>
              <p className="text-asphalt-black/60 leading-relaxed">
                {s.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── 5. PLANES ─── */
function Planes() {
  const plans = [
    {
      name: "Member",
      price: "$100",
      period: "/mes",
      features: [
        "5 créditos al mes",
        "1 request activo a la vez",
        "Turnaround 72h",
        "Diseño + contenido",
        "Soporte por email",
      ],
      highlighted: false,
    },
    {
      name: "Growth",
      price: "$190",
      period: "/mes",
      features: [
        "12 créditos al mes",
        "2 requests activos",
        "Turnaround 48h",
        "Diseño + web + contenido",
        "Soporte prioritario",
        "Brand strategy session",
      ],
      highlighted: true,
    },
    {
      name: "Pro",
      price: "$330",
      period: "/mes",
      features: [
        "25 créditos al mes",
        "3 requests activos",
        "Turnaround 24-48h",
        "Diseño + web + marketing",
        "Slack dedicado",
        "Monthly strategy call",
        "Rollover de créditos",
      ],
      highlighted: false,
    },
  ];

  return (
    <section id="planes" className="bg-midnight-express text-ice-white section-padding">
      <div className="container-narrow">
        <h2 className="font-[family-name:var(--font-lexend)] font-bold text-3xl md:text-5xl tracking-tight text-center">
          Planes
        </h2>
        <p className="mt-4 text-lg text-ice-white/50 text-center max-w-xl mx-auto">
          Simple. Predecible. Sin sorpresas.
        </p>
        <div className="mt-14 grid gap-8 md:grid-cols-3 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`p-8 flex flex-col ${
                plan.highlighted
                  ? "border-2 border-gold-bar bg-midnight-express relative"
                  : "border border-ice-white/10 bg-midnight-express/50"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-4 left-8 bg-gold-bar text-asphalt-black font-bold text-sm px-4 py-1">
                  MÁS POPULAR
                </span>
              )}
              <h3 className="font-[family-name:var(--font-lexend)] font-bold text-2xl">
                {plan.name}
              </h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-[family-name:var(--font-lexend)] font-black text-5xl">
                  {plan.price}
                </span>
                <span className="text-ice-white/50 text-lg">{plan.period}</span>
              </div>
              <ul className="mt-8 space-y-3 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-ice-white/70">
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
                className={`mt-8 block text-center font-bold py-4 transition-all ${
                  plan.highlighted
                    ? "bg-gold-bar text-asphalt-black hover:brightness-110"
                    : "border border-ice-white/30 text-ice-white hover:border-ice-white/60"
                }`}
              >
                Unirme al Waitlist
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── 6. WAITLIST ─── */
function Waitlist() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    businessName: "",
    allianceCode: "",
    language: "es" as "es" | "en",
  });
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error" | "duplicate"
  >("idle");

  async function handleSubmit(e: React.FormEvent) {
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
  }

  return (
    <section
      id="waitlist"
      className="bg-midnight-express text-ice-white section-padding"
    >
      <div className="container-narrow max-w-2xl">
        <h2 className="font-[family-name:var(--font-lexend)] font-bold text-3xl md:text-5xl tracking-tight text-center">
          Únete al Waitlist
        </h2>
        <p className="mt-4 text-lg text-ice-white/50 text-center">
          Sé de los primeros en acceder cuando lancemos.
        </p>

        {status === "success" ? (
          <div className="mt-14 text-center p-10 border border-gold-bar/30">
            <Check size={48} className="mx-auto text-gold-bar" />
            <p className="mt-4 font-[family-name:var(--font-lexend)] font-bold text-2xl">
              ¡Estás en la lista!
            </p>
            <p className="mt-2 text-ice-white/60">
              Te contactaremos pronto con novedades.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-14 space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-bold mb-2 text-ice-white/70">
                Nombre *
              </label>
              <input
                id="name"
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-transparent border border-ice-white/20 px-5 py-4 text-ice-white placeholder:text-ice-white/30 focus:outline-none focus:border-gold-bar transition-colors"
                placeholder="Tu nombre"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-bold mb-2 text-ice-white/70">
                Email *
              </label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-transparent border border-ice-white/20 px-5 py-4 text-ice-white placeholder:text-ice-white/30 focus:outline-none focus:border-gold-bar transition-colors"
                placeholder="tu@email.com"
              />
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="business" className="block text-sm font-bold mb-2 text-ice-white/70">
                  Negocio
                </label>
                <input
                  id="business"
                  type="text"
                  value={form.businessName}
                  onChange={(e) =>
                    setForm({ ...form, businessName: e.target.value })
                  }
                  className="w-full bg-transparent border border-ice-white/20 px-5 py-4 text-ice-white placeholder:text-ice-white/30 focus:outline-none focus:border-gold-bar transition-colors"
                  placeholder="Nombre del negocio"
                />
              </div>
              <div>
                <label htmlFor="alliance" className="block text-sm font-bold mb-2 text-ice-white/70">
                  Código de alianza
                </label>
                <input
                  id="alliance"
                  type="text"
                  value={form.allianceCode}
                  onChange={(e) =>
                    setForm({ ...form, allianceCode: e.target.value })
                  }
                  className="w-full bg-transparent border border-ice-white/20 px-5 py-4 text-ice-white placeholder:text-ice-white/30 focus:outline-none focus:border-gold-bar transition-colors"
                  placeholder="Ej: LEN-2024"
                />
              </div>
            </div>
            <div>
              <label htmlFor="language" className="block text-sm font-bold mb-2 text-ice-white/70">
                Idioma preferido
              </label>
              <select
                id="language"
                value={form.language}
                onChange={(e) =>
                  setForm({
                    ...form,
                    language: e.target.value as "es" | "en",
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
                Algo salió mal. Intenta de nuevo.
              </p>
            )}
            {status === "duplicate" && (
              <p className="text-gold-bar text-sm">
                Este email ya está registrado. ¡Ya estás en la lista!
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
                  Enviando...
                </>
              ) : (
                <>
                  Registrarme
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

/* ─── 7. FOOTER ─── */
function Footer() {
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
          <a href="#waitlist" className="hover:text-ice-white transition-colors">
            Waitlist
          </a>
          <a href="#planes" className="hover:text-ice-white transition-colors">
            Planes
          </a>
          <a
            href="mailto:hola@nouvos.one"
            className="hover:text-ice-white transition-colors"
          >
            hola@nouvos.one
          </a>
        </div>
        <p className="text-xs">
          © {new Date().getFullYear()} Nouvos. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}

/* ─── PAGE ─── */
export default function Home() {
  return (
    <main>
      <Hero />
      <ElProblema />
      <LaSolucion />
      <ComoFunciona />
      <Planes />
      <Waitlist />
      <Footer />
    </main>
  );
}
