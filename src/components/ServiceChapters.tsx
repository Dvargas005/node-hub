"use client";

/**
 * ServiceChapters — a numbered "chapter" arc carousel of the work we do.
 * Inspired by the chapter/services arc on marcfriedmanportfolio.com: the
 * services sit on a vertical arc you can drag-to-spin or step with the
 * arrows; the active chapter (01 / N) reveals its title, description and
 * tags on the left with a sequential cross-fade. Self-contained + bilingual.
 */

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Chapter = { label: string; title: string; desc: string; tags: string[] };

const CHAPTERS: Record<"en" | "es", Chapter[]> = {
  en: [
    { label: "Web Development", title: "Websites that win customers", desc: "Fast, modern sites built on Next.js & React — designed to turn visitors into buyers.", tags: ["Next.js", "CMS", "Responsive", "Speed"] },
    { label: "Mobile Apps", title: "In your customers' pocket", desc: "Native-feeling iOS & Android apps that keep your business one tap away.", tags: ["iOS", "Android", "PWA"] },
    { label: "Branding & Identity", title: "Look unforgettable", desc: "Logos, palettes and a brand system that makes you instantly recognizable.", tags: ["Logo", "Palette", "Brand Book"] },
    { label: "UX / UI Design", title: "Effortless to use", desc: "Research-driven, accessible interfaces that feel obvious — and convert.", tags: ["Research", "Wireframes", "A11y"] },
    { label: "E-commerce", title: "Sell while you sleep", desc: "Storefronts with payments, inventory and a checkout that just works.", tags: ["Shopify", "Payments", "Catalog"] },
    { label: "Digital Marketing", title: "Get found & chosen", desc: "Content, social and campaigns that bring the right people to your door.", tags: ["Social", "Content", "Ads"] },
    { label: "SEO", title: "Rank where it matters", desc: "Technical + content SEO so customers find you first — not your competitor.", tags: ["Technical", "Keywords", "Local"] },
    { label: "AI & Automation", title: "Automate the busywork", desc: "Chatbots and workflows that handle the repetitive stuff for you.", tags: ["Chatbots", "Workflows", "Integrations"] },
  ],
  es: [
    { label: "Desarrollo Web", title: "Webs que ganan clientes", desc: "Sitios rápidos y modernos en Next.js y React — diseñados para convertir visitas en ventas.", tags: ["Next.js", "CMS", "Responsive", "Velocidad"] },
    { label: "Apps Móviles", title: "En el bolsillo de tus clientes", desc: "Apps iOS y Android que mantienen tu negocio a un toque de distancia.", tags: ["iOS", "Android", "PWA"] },
    { label: "Marca e Identidad", title: "Hazte inolvidable", desc: "Logos, paletas y un sistema de marca que te hace reconocible al instante.", tags: ["Logo", "Paleta", "Manual"] },
    { label: "Diseño UX/UI", title: "Fácil de usar", desc: "Interfaces accesibles y basadas en investigación que se sienten obvias — y convierten.", tags: ["Investigación", "Wireframes", "A11y"] },
    { label: "E-commerce", title: "Vende mientras duermes", desc: "Tiendas con pagos, inventario y un checkout que simplemente funciona.", tags: ["Shopify", "Pagos", "Catálogo"] },
    { label: "Marketing Digital", title: "Que te encuentren y elijan", desc: "Contenido, redes y campañas que traen a las personas correctas a tu puerta.", tags: ["Redes", "Contenido", "Ads"] },
    { label: "SEO", title: "Posiciónate donde importa", desc: "SEO técnico y de contenido para que te encuentren a ti, no a tu competencia.", tags: ["Técnico", "Keywords", "Local"] },
    { label: "IA y Automatización", title: "Automatiza lo repetitivo", desc: "Chatbots y flujos que se encargan de las tareas repetitivas por ti.", tags: ["Chatbots", "Flujos", "Integraciones"] },
  ],
};

const pad = (n: number) => String(n).padStart(2, "0");

export default function ServiceChapters({ lang = "en" }: { lang?: "en" | "es" }) {
  const chapters = CHAPTERS[lang] ?? CHAPTERS.en;
  const n = chapters.length;
  const [active, setActive] = useState(0);
  const go = useCallback((d: number) => setActive((a) => (a + d + n) % n), [n]);

  // pointer drag-to-spin on the arc
  const dragging = useRef(false);
  const lastY = useRef(0);
  const accum = useRef(0);
  const STEP = 64;

  const onDown = (e: React.PointerEvent) => {
    dragging.current = true;
    lastY.current = e.clientY;
    accum.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dy = e.clientY - lastY.current;
    lastY.current = e.clientY;
    accum.current += dy;
    while (accum.current <= -STEP) { go(1); accum.current += STEP; }   // drag up → next
    while (accum.current >= STEP) { go(-1); accum.current -= STEP; }    // drag down → prev
  };
  const onUp = () => { dragging.current = false; };

  // shortest-path offset so the arc loops continuously
  const offsetOf = (i: number) => {
    let off = i - active;
    if (off > n / 2) off -= n;
    if (off < -n / 2) off += n;
    return off;
  };

  return (
    <div className="mt-12 grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
      {/* LEFT — active chapter detail */}
      <div className="relative min-h-[260px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="flex items-center gap-4">
              <span
                className="font-[family-name:var(--font-lexend)] font-black leading-none text-[#FFC919]"
                style={{ fontSize: "clamp(3rem,7vw,5.5rem)" }}
              >
                {pad(active + 1)}
              </span>
              <span className="font-[family-name:var(--font-lexend)] text-[0.7rem] font-bold uppercase tracking-[0.3em] text-[#F5F6FC]/45">
                {chapters[active].label}
              </span>
            </div>
            <h3
              className="mt-4 font-[family-name:var(--font-lexend)] font-black leading-[1.05] text-[#F5F6FC]"
              style={{ fontSize: "clamp(1.7rem,3.4vw,2.7rem)" }}
            >
              {chapters[active].title}
            </h3>
            <p className="mt-4 max-w-md font-[family-name:var(--font-atkinson)] text-[1.05rem] leading-[1.7] text-[#F5F6FC]/60">
              {chapters[active].desc}
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              {chapters[active].tags.map((tg) => (
                <span
                  key={tg}
                  className="border border-[#FFC919]/30 bg-[#FFC919]/[0.06] px-3 py-1.5 font-[family-name:var(--font-atkinson)] text-[0.85rem] text-[#F5F6FC]/80"
                >
                  {tg}
                </span>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* controls */}
        <div className="mt-9 flex items-center gap-5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => go(-1)}
              aria-label="Previous"
              className="grid h-11 w-11 place-items-center border border-[#F5F6FC]/20 text-[#F5F6FC] transition-colors hover:border-[#FFC919] hover:text-[#FFC919]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6" /></svg>
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Next"
              className="grid h-11 w-11 place-items-center border border-[#F5F6FC]/20 text-[#F5F6FC] transition-colors hover:border-[#FFC919] hover:text-[#FFC919]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
            </button>
          </div>
          <span className="font-[family-name:var(--font-lexend)] text-[0.8rem] font-bold tracking-[0.15em] text-[#F5F6FC]/40">
            {pad(active + 1)} <span className="text-[#F5F6FC]/20">/ {pad(n)}</span>
          </span>
          <span className="hidden font-[family-name:var(--font-atkinson)] text-[0.8rem] text-[#F5F6FC]/30 sm:inline">
            {lang === "es" ? "Arrastra el arco para explorar" : "Drag the arc to explore"}
          </span>
        </div>
      </div>

      {/* RIGHT — the draggable arc of numbered chapters */}
      <div
        className="relative h-[440px] cursor-grab touch-none select-none active:cursor-grabbing"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        role="listbox"
        aria-label="Service chapters"
      >
        {/* center guide line */}
        <div className="pointer-events-none absolute right-0 top-1/2 h-px w-10 -translate-y-1/2 bg-[#FFC919]/40" />
        {chapters.map((c, i) => {
          const off = offsetOf(i);
          const abs = Math.abs(off);
          const x = -Math.pow(abs, 1.4) * 26; // curve away from center → arc
          const y = off * 84;
          const rot = off * -5;
          const opacity = Math.max(0.12, 1 - abs * 0.26);
          const isActive = i === active;
          return (
            <motion.button
              key={i}
              onClick={() => setActive(i)}
              aria-selected={isActive}
              className="absolute right-0 top-1/2 flex items-baseline justify-end gap-4 whitespace-nowrap text-right"
              style={{ originX: 1, originY: 0.5 }}
              animate={{ x, y: y - 0, opacity, scale: isActive ? 1.18 : 0.92, rotate: rot, translateY: "-50%" }}
              transition={{ type: "spring", stiffness: 240, damping: 28 }}
            >
              <span
                className={`font-[family-name:var(--font-lexend)] font-black leading-none transition-colors ${isActive ? "text-[#FFC919]" : "text-[#F5F6FC]/30"}`}
                style={{ fontSize: isActive ? "1.6rem" : "1.15rem" }}
              >
                {pad(i + 1)}
              </span>
              <span
                className={`font-[family-name:var(--font-lexend)] font-bold uppercase tracking-[0.04em] transition-colors ${isActive ? "text-[#F5F6FC]" : "text-[#F5F6FC]/45"}`}
                style={{ fontSize: isActive ? "1.55rem" : "1.1rem" }}
              >
                {c.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
