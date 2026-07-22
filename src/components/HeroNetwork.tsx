"use client";

/**
 * HeroNetwork — a fully code-generated "living delivery network" that replaces
 * the static /img/hero.png behind the N.O.D.E. wordmark.
 *
 * The network is literally made of code: every link is a STREAM OF CODE — a row
 * of monospace glyphs marching from node to node — and every node is a CODE
 * TOKEN (hex, symbols, or a short keyword on the hub nodes). Bright packets are
 * the leading heads of a code stream, showing data being delivered in real time.
 * The cursor becomes a live node the streams reach toward.
 *
 * A calm dark scrim is painted over the centre so the headline stays high
 * contrast while the code activity lives in the surrounding field.
 *
 * Pure <canvas> + requestAnimationFrame. No image, no external deps. DPR-aware,
 * ResizeObserver-driven, cleaned up on unmount, honours prefers-reduced-motion.
 */

import { useEffect, useRef } from "react";

const GOLD = { r: 255, g: 201, b: 25 };
const ICE = { r: 245, g: 246, b: 252 };
const GROUND = { r: 15, g: 8, b: 4 };

// Code-flavoured character set for the streams.
const GLYPHS = "0123456789ABCDEF{}<>[]/=+*;:#%$&|".split("");
// Tokens rendered AT each node.
const NODE_TOKENS = ["0", "1", "x", "{", "}", "<", ">", "/", "=", ";", "F", "A", "7", "E", "3", "9"];
const HUB_TOKENS = ["NODE", "0x7F", "</>", "fn()", "{ }", ">>", "SYNC", "0xFF", "::", "404"];

const STREAM_FONT = 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace';

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hub: boolean;
  seed: number;
  token: string;
  pulse: number;
};

type Packet = {
  a: number;
  b: number;
  t: number;
  speed: number;
};

const rgba = (c: { r: number; g: number; b: number }, a: number) =>
  `rgba(${c.r},${c.g},${c.b},${a})`;

const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function HeroNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced = prefersReduced();

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    let nodes: Node[] = [];
    let packets: Packet[] = [];
    let raf = 0;

    let linkDist = 170;
    let glyphSpacing = 16; // px between glyphs along a stream

    const mouse = { x: -9999, y: -9999, active: false };
    const parallax = { x: 0, y: 0, tx: 0, ty: 0 };

    // Deterministic glyph for a given stream position + time (advances so the
    // code appears to "recompute" like matrix rain, but never random-flickers).
    function glyphAt(seed: number, slot: number, time: number) {
      const idx = (seed * 13 + slot * 7 + Math.floor(time / 140 + slot)) % GLYPHS.length;
      return GLYPHS[(idx + GLYPHS.length) % GLYPHS.length];
    }

    function spawnPacket(): Packet {
      const a = Math.floor(Math.random() * nodes.length);
      const na = nodes[a];
      const candidates: number[] = [];
      for (let i = 0; i < nodes.length; i++) {
        if (i === a) continue;
        const dx = nodes[i].x - na.x;
        const dy = nodes[i].y - na.y;
        if (dx * dx + dy * dy < linkDist * linkDist) candidates.push(i);
      }
      const b =
        candidates.length > 0
          ? candidates[Math.floor(Math.random() * candidates.length)]
          : Math.floor(Math.random() * nodes.length);
      return { a, b, t: Math.random(), speed: 0.0016 + Math.random() * 0.0032 };
    }

    function build() {
      const area = width * height;
      const count = Math.max(24, Math.min(72, Math.round(area / 24000)));
      linkDist = Math.max(120, Math.min(width, height) * 0.27);
      glyphSpacing = width < 640 ? 20 : 16;

      nodes = Array.from({ length: count }, (_, i) => {
        const hub = Math.random() < 0.15;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          hub,
          seed: i * 977 + Math.floor(Math.random() * 997),
          token: hub
            ? HUB_TOKENS[Math.floor(Math.random() * HUB_TOKENS.length)]
            : NODE_TOKENS[Math.floor(Math.random() * NODE_TOKENS.length)],
          pulse: Math.random() * Math.PI * 2,
        };
      });

      const packetCount = Math.max(7, Math.round(count * 0.45));
      packets = Array.from({ length: packetCount }, () => spawnPacket());
    }

    function resize() {
      const parent = canvas!.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.max(1, Math.round(width * dpr));
      canvas!.height = Math.max(1, Math.round(height * dpr));
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
      // Paint one frame synchronously so the hero is never blank before the
      // first rAF (covers reduced-motion, slow paint, tabs that start hidden).
      drawFrame(0);
    }

    // Draw a stream of code glyphs marching along a segment a→b.
    function drawStream(
      ax: number,
      ay: number,
      bx: number,
      by: number,
      seed: number,
      color: typeof GOLD,
      baseAlpha: number,
      time: number
    ) {
      const dx = bx - ax;
      const dy = by - ay;
      const len = Math.hypot(dx, dy);
      if (len < 1) return;
      const ux = dx / len;
      const uy = dy / len;
      const n = Math.floor(len / glyphSpacing);
      const flow = reduced ? 0 : (time * 0.03) % glyphSpacing;
      for (let k = 0; k <= n; k++) {
        const dist = k * glyphSpacing + flow;
        if (dist > len) continue;
        const t = dist / len;
        const gx = ax + ux * dist;
        const gy = ay + uy * dist;
        // gentle twinkle so the stream shimmers
        const tw = 0.55 + 0.45 * Math.sin(time * 0.004 + k * 0.9 + seed);
        ctx!.fillStyle = rgba(color, baseAlpha * tw * (0.5 + 0.5 * (1 - Math.abs(t - 0.5) * 2)));
        ctx!.fillText(glyphAt(seed, k, time), gx, gy);
      }
    }

    function drawFrame(time: number) {
      ctx!.clearRect(0, 0, width, height);
      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";

      parallax.x += (parallax.tx - parallax.x) * 0.05;
      parallax.y += (parallax.ty - parallax.y) * 0.05;
      const ox = parallax.x;
      const oy = parallax.y;

      // ── advance node drift ──
      if (!reduced) {
        for (const n of nodes) {
          n.x += n.vx;
          n.y += n.vy;
          const m = 40;
          if (n.x < -m) n.x = width + m;
          else if (n.x > width + m) n.x = -m;
          if (n.y < -m) n.y = height + m;
          else if (n.y > height + m) n.y = -m;
        }
      }

      // ── links as streams of code ──
      ctx!.font = `${width < 640 ? 10 : 11}px ${STREAM_FONT}`;
      const ld2 = linkDist * linkDist;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > ld2) continue;
          const strength = 1 - Math.sqrt(d2) / linkDist;
          drawStream(
            a.x + ox,
            a.y + oy,
            b.x + ox,
            b.y + oy,
            a.seed + b.seed,
            GOLD,
            0.1 + strength * 0.22,
            time
          );
        }
      }

      // ── cursor as a live node: code streams reach toward it ──
      if (mouse.active) {
        const reach = linkDist * 1.2;
        const reach2 = reach * reach;
        for (const n of nodes) {
          const dx = n.x + ox - mouse.x;
          const dy = n.y + oy - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > reach2) continue;
          const strength = 1 - Math.sqrt(d2) / reach;
          drawStream(mouse.x, mouse.y, n.x + ox, n.y + oy, n.seed, ICE, 0.15 + strength * 0.35, time);
        }
        const g = ctx!.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 24);
        g.addColorStop(0, rgba(GOLD, 0.45));
        g.addColorStop(1, rgba(GOLD, 0));
        ctx!.fillStyle = g;
        ctx!.beginPath();
        ctx!.arc(mouse.x, mouse.y, 24, 0, Math.PI * 2);
        ctx!.fill();
      }

      // ── packets: bright code heads streaming along an edge ──
      ctx!.font = `bold ${width < 640 ? 11 : 13}px ${STREAM_FONT}`;
      for (const p of packets) {
        if (!reduced) p.t += p.speed;
        if (p.t >= 1) {
          Object.assign(p, spawnPacket());
          continue;
        }
        const a = nodes[p.a];
        const b = nodes[p.b];
        if (!a || !b) {
          Object.assign(p, spawnPacket());
          continue;
        }
        const ax = a.x + ox;
        const ay = a.y + oy;
        const bx = b.x + ox;
        const by = b.y + oy;
        // head + a short trail of fading glyphs
        for (let tr = 0; tr < 5; tr++) {
          const tt = p.t - tr * 0.045;
          if (tt < 0) break;
          const px = ax + (bx - ax) * tt;
          const py = ay + (by - ay) * tt;
          const alpha = tr === 0 ? 0.95 : 0.5 * (1 - tr / 5);
          ctx!.fillStyle = rgba(GOLD, alpha);
          ctx!.fillText(glyphAt(p.a + p.b + tr, tr, time), px, py);
        }
      }

      // ── nodes as code tokens ──
      // regular nodes
      ctx!.font = `${width < 640 ? 11 : 12}px ${STREAM_FONT}`;
      for (const n of nodes) {
        if (n.hub) continue;
        const breathe = reduced ? 0.6 : 0.55 + 0.45 * Math.sin(time * 0.0015 + n.pulse);
        ctx!.fillStyle = rgba(ICE, 0.35 + breathe * 0.3);
        ctx!.fillText(n.token, n.x + ox, n.y + oy);
      }
      // hub nodes — brighter, larger, with a glow
      ctx!.font = `bold ${width < 640 ? 12 : 14}px ${STREAM_FONT}`;
      for (const n of nodes) {
        if (!n.hub) continue;
        const breathe = reduced ? 0.6 : 0.55 + 0.45 * Math.sin(time * 0.0015 + n.pulse);
        const x = n.x + ox;
        const y = n.y + oy;
        const glowR = 22;
        const g = ctx!.createRadialGradient(x, y, 0, x, y, glowR);
        g.addColorStop(0, rgba(GOLD, 0.22 + breathe * 0.18));
        g.addColorStop(1, rgba(GOLD, 0));
        ctx!.fillStyle = g;
        ctx!.beginPath();
        ctx!.arc(x, y, glowR, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.fillStyle = rgba(GOLD, 0.85 + breathe * 0.15);
        ctx!.fillText(n.token, x, y);
      }

      // ── calm dark scrim over the centre so the headline stays legible ──
      const cx = width / 2;
      const cy = height / 2;
      const maxR = Math.max(width, height) * 0.6;
      const scrim = ctx!.createRadialGradient(cx, cy, 0, cx, cy, maxR);
      scrim.addColorStop(0, rgba(GROUND, 0.9));
      scrim.addColorStop(0.45, rgba(GROUND, 0.45));
      scrim.addColorStop(1, rgba(GROUND, 0));
      ctx!.fillStyle = scrim;
      ctx!.fillRect(0, 0, width, height);
    }

    function loop(time: number) {
      drawFrame(time);
      raf = requestAnimationFrame(loop);
    }

    function onMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
      parallax.tx = (mouse.x / width - 0.5) * -24;
      parallax.ty = (mouse.y / height - 0.5) * -24;
    }
    function onLeave() {
      mouse.active = false;
      parallax.tx = 0;
      parallax.ty = 0;
    }

    resize();

    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    if (!reduced) {
      raf = requestAnimationFrame(loop);
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerleave", onLeave);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full pointer-events-none"
    />
  );
}
