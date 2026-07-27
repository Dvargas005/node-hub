"use client";

/**
 * HeroHud — an animated "command-center" telemetry overlay for the N.O.D.E.
 * hero. Frames the robot + N.O.D.E. wordmark with corner panels: a scrolling
 * line graph, an oscillating bar chart, a sweeping radial gauge, live
 * counters, a vertical scan sweep and corner brackets. Everything runs on a
 * PERFECT seamless loop (keyframes whose first === last, or geometry shifted
 * by exactly one tile / faded across the reset). Decorative + pointer-events
 * none; hidden on small screens; honours prefers-reduced-motion.
 */

import { useEffect, useRef, useState } from "react";
import { motion, animate } from "framer-motion";

const GOLD = "#FFC919";
const ICE = "#F5F6FC";

/* ═══════════════════════════════════════════════════════════════
   TUNABLES — widget sizing. Everything below scales the RENDERED size
   of each SVG while leaving its internal viewBox geometry alone, so one
   number rescales a whole widget with no risk of distorting it.

   Note the split: the graphics are ambience and shrink hard, while the
   numeric readouts are the actual information and shrink far less. That
   is deliberate — the graph is decoration, the number is the data.
   ═══════════════════════════════════════════════════════════════ */

/** Global multiplier for the decorative telemetry graphics. */
const WIDGET_SCALE = 0.65;
/** Applied on top of WIDGET_SCALE to text living INSIDE a scaled SVG, to claw
 *  back legibility the outer scale would otherwise cost. */
const IN_SVG_TEXT_COMPENSATION = 1.28;

/** Throughput line graph (top-left). Internal viewBox units. */
const GRAPH_VB_W = 300;
const GRAPH_VB_H = 70;
const GRAPH_CYCLES = 6;
const GRAPH_AMP = 18;

/** Compute bar chart (top-right). Internal viewBox units. */
const BARS_VB_W = 160;
const BARS_VB_H = 70;

/** Uptime radial gauge (left-middle). Internal viewBox units. */
const GAUGE_VB = 110;
/** Gauge label/value font sizes, in viewBox units, pre-compensation. */
const GAUGE_VALUE_FONT = 20;
const GAUGE_LABEL_FONT = 8;

/** Corner bracket size in px. */
const BRACKET_PX = 26;

/* Derived rendered sizes — nothing below needs touching to retune. */
const GRAPH_W = Math.round(GRAPH_VB_W * WIDGET_SCALE);
const GRAPH_H = Math.round(GRAPH_VB_H * WIDGET_SCALE);
const BARS_W = Math.round(BARS_VB_W * WIDGET_SCALE);
const BARS_H = Math.round(BARS_VB_H * WIDGET_SCALE);
const GAUGE_PX = Math.round(GAUGE_VB * WIDGET_SCALE);

const reduce = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── live counter (yoyo so start === end → seamless) ── */
function Counter({
  from,
  to,
  duration,
  decimals = 0,
  suffix = "",
}: {
  from: number;
  to: number;
  duration: number;
  decimals?: number;
  suffix?: string;
}) {
  const [v, setV] = useState(from);
  useEffect(() => {
    if (reduce()) {
      setV((from + to) / 2);
      return;
    }
    const controls = animate(from, to, {
      duration,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut",
      onUpdate: setV,
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      {v.toFixed(decimals)}
      {suffix}
    </>
  );
}

/* ── repeating waveform path (periodic so a -width shift is seamless) ── */
function wavePath(width: number, height: number, cycles: number, amp: number) {
  const steps = cycles * 16;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * width;
    const t = (i / steps) * cycles * Math.PI * 2;
    const y =
      height / 2 -
      Math.sin(t) * amp -
      Math.sin(t * 0.5 + 0.8) * amp * 0.35;
    d += (i === 0 ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1) + " ";
  }
  return d.trim();
}

const PANEL =
  "absolute hidden md:block font-[family-name:var(--font-lexend)] select-none";
const LABEL =
  "font-bold text-[0.5rem] uppercase tracking-[0.28em] text-[rgba(245,246,252,0.4)] mb-1";
/** Readouts step down only slightly (1.1rem -> 0.95rem): the value is the data. */
const VALUE = "font-black text-[0.95rem] tracking-tight";

export default function HeroHud() {
  const W = GRAPH_VB_W; // visible viewBox width for the line graph
  // 2 tiles wide, shift by exactly W = seamless loop
  const path = wavePath(W * 2, GRAPH_VB_H, GRAPH_CYCLES, GRAPH_AMP);
  const reduced = useRef(false);
  useEffect(() => {
    reduced.current = reduce();
  }, []);

  return (
    <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden">
      {/* corner brackets */}
      {[
        "top-6 left-6 border-l-2 border-t-2",
        "top-6 right-6 border-r-2 border-t-2",
        "bottom-6 left-6 border-l-2 border-b-2",
        "bottom-6 right-6 border-r-2 border-b-2",
      ].map((c) => (
        <div
          key={c}
          className={`absolute hidden md:block ${c}`}
          style={{ borderColor: "rgba(255,201,25,0.25)", height: BRACKET_PX, width: BRACKET_PX }}
        />
      ))}

      {/* ── TOP-LEFT: scrolling line graph ── */}
      <div className={`${PANEL} top-[12%] left-[5%]`} style={{ width: GRAPH_W }}>
        <div className={LABEL}>Throughput // live</div>
        <svg
          viewBox={`0 0 ${W} ${GRAPH_VB_H}`}
          width={GRAPH_W}
          height={GRAPH_H}
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="hud-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={GOLD} stopOpacity="0.22" />
              <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* faint baseline grid */}
          {[0, 23, 46, 69].map((y) => (
            <line key={y} x1="0" y1={y} x2={W} y2={y} stroke={ICE} strokeOpacity="0.06" strokeWidth="1" />
          ))}
          <motion.g
            animate={reduced.current ? {} : { x: [0, -W] }}
            transition={{ duration: 7, ease: "linear", repeat: Infinity }}
          >
            <path
              d={`${path} L${W * 2},${GRAPH_VB_H} L0,${GRAPH_VB_H} Z`}
              fill="url(#hud-area)"
            />
            <path d={path} fill="none" stroke={GOLD} strokeWidth="1.6" strokeOpacity="0.85" />
          </motion.g>
          {/* leading pulse dot at the live edge */}
          <motion.circle
            cx={W - 2}
            cy={35}
            r="3"
            fill={GOLD}
            animate={reduced.current ? {} : { opacity: [1, 0.3, 1], r: [3, 4.5, 3] }}
            transition={{ duration: 1.6, ease: "easeInOut", repeat: Infinity }}
          />
        </svg>
        <div className="mt-1 flex items-baseline gap-1">
          <span className={VALUE} style={{ color: GOLD }}>
            <Counter from={1820} to={4310} duration={6} />
          </span>
          <span className="text-[0.55rem] uppercase tracking-widest text-[rgba(245,246,252,0.4)]">req/s</span>
        </div>
      </div>

      {/* ── TOP-RIGHT: oscillating bar chart ── */}
      <div className={`${PANEL} top-[13%] right-[5%] text-right`}>
        <div className={LABEL}>Compute // nodes</div>
        <svg viewBox={`0 0 ${BARS_VB_W} ${BARS_VB_H}`} width={BARS_W} height={BARS_H}>
          {Array.from({ length: 9 }).map((_, i) => {
            const x = i * 18 + 4;
            const seq = [0.35, 1, 0.55, 0.85, 0.4, 0.7, 0.35]; // start === end → loop
            return (
              <motion.rect
                key={i}
                x={x}
                y={6}
                width={10}
                height={58}
                rx={1}
                fill={i % 3 === 0 ? GOLD : ICE}
                fillOpacity={i % 3 === 0 ? 0.85 : 0.35}
                style={{ transformOrigin: "center bottom", transformBox: "fill-box" }}
                animate={reduced.current ? { scaleY: 0.6 } : { scaleY: seq }}
                transition={{
                  duration: 2.4,
                  ease: "easeInOut",
                  repeat: Infinity,
                  delay: (i * 0.18) % 2.4,
                }}
              />
            );
          })}
        </svg>
        <div className="mt-1 flex items-baseline justify-end gap-1">
          <span className={VALUE} style={{ color: ICE }}>
            <Counter from={42} to={68} duration={5} />
          </span>
          <span className="text-[0.55rem] uppercase tracking-widest text-[rgba(245,246,252,0.4)]">active</span>
        </div>
      </div>

      {/* ── LEFT-MID: radial gauge ── */}
      <div className={`${PANEL} top-1/2 left-[6%] -translate-y-1/2`}>
        <svg viewBox={`0 0 ${GAUGE_VB} ${GAUGE_VB}`} width={GAUGE_PX} height={GAUGE_PX}>
          <circle cx="55" cy="55" r="46" fill="none" stroke={ICE} strokeOpacity="0.08" strokeWidth="6" />
          <motion.circle
            cx="55"
            cy="55"
            r="46"
            fill="none"
            stroke={GOLD}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 46}
            transform="rotate(-90 55 55)"
            animate={
              reduced.current
                ? { strokeDashoffset: 2 * Math.PI * 46 * 0.4 }
                : { strokeDashoffset: [2 * Math.PI * 46 * 0.75, 2 * Math.PI * 46 * 0.12, 2 * Math.PI * 46 * 0.75] }
            }
            transition={{ duration: 5, ease: "easeInOut", repeat: Infinity }}
          />
          <text x="55" y="52" textAnchor="middle" fill={ICE} className="font-[family-name:var(--font-lexend)]" fontWeight="900"
            fontSize={GAUGE_VALUE_FONT * IN_SVG_TEXT_COMPENSATION}
          >
            <Counter from={61} to={98} duration={5} />
          </text>
          <text x="55" y="70" textAnchor="middle" fill={GOLD} fontSize={GAUGE_LABEL_FONT * IN_SVG_TEXT_COMPENSATION} letterSpacing="1.6" className="font-[family-name:var(--font-lexend)]" fontWeight="700">UPTIME</text>
        </svg>
      </div>

      {/* ── RIGHT-MID: telemetry rows ── */}
      <div className={`${PANEL} top-1/2 right-[6%] -translate-y-1/2 text-right w-[132px]`}>
        {[
          { k: "Latency", from: 8, to: 24, suffix: "ms", d: 4 },
          { k: "Queue", from: 0, to: 12, suffix: "", d: 5.5 },
          { k: "Tasks/min", from: 120, to: 340, suffix: "", d: 6.5 },
        ].map((r) => (
          <div key={r.k} className="mb-2">
            <div className="text-[0.5rem] uppercase tracking-[0.25em] text-[rgba(245,246,252,0.4)]">{r.k}</div>
            <div className="font-black text-[1rem]" style={{ color: ICE }}>
              <Counter from={r.from} to={r.to} duration={r.d} suffix={r.suffix} />
            </div>
            <div className="ml-auto mt-1 h-[2px] w-full overflow-hidden bg-[rgba(245,246,252,0.08)]">
              <motion.div
                className="h-full"
                style={{ background: GOLD, originX: 1 }}
                animate={reduced.current ? { scaleX: 0.6 } : { scaleX: [0.25, 0.9, 0.5, 0.75, 0.25] }}
                transition={{ duration: 4 + r.d * 0.2, ease: "easeInOut", repeat: Infinity }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ── vertical scan sweep (fades across the reset → seamless) ── */}
      <motion.div
        className="absolute left-0 right-0 h-[2px] hidden md:block"
        style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`, boxShadow: `0 0 12px ${GOLD}` }}
        initial={{ top: "8%", opacity: 0 }}
        animate={reduced.current ? { opacity: 0 } : { top: ["8%", "92%"], opacity: [0, 0.5, 0.5, 0] }}
        transition={{ duration: 6, ease: "linear", repeat: Infinity }}
      />
    </div>
  );
}
