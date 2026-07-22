"use client";

/**
 * HeroWordmark — renders the "N.O.D.E." headline entirely out of code. The word
 * is drawn into an offscreen buffer with the brand display font, its pixels are
 * sampled on a grid, and every "ink" point becomes a live monospace glyph that
 * recomputes over time. The result: the letters are literally made of code,
 * sitting in front of the code-stream network.
 *
 * A very faint solid backbone of the word keeps the letters readable between
 * glyphs. Accessible text lives in a real <h1 class="sr-only"> in the page, so
 * this canvas is aria-hidden. DPR-aware, ResizeObserver-driven, cleaned up on
 * unmount, honours prefers-reduced-motion (static glyphs).
 */

import { useEffect, useRef } from "react";

const GOLD = { r: 255, g: 201, b: 25 };
const ICE = { r: 245, g: 246, b: 252 };
const GLYPHS = "0123456789ABCDEF{}<>[]/=+*;:#%$&|".split("");
const MONO = 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace';
const WORD = "N.O.D.E.";

const rgba = (c: { r: number; g: number; b: number }, a: number) =>
  `rgba(${c.r},${c.g},${c.b},${a})`;

const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function HeroWordmark() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = prefersReduced();
    let cancelled = false;
    let ready = false;
    let raf = 0;

    let points: { x: number; y: number; seed: number; gold: boolean }[] = [];
    let cssW = 0;
    let cssH = 0;
    let dpr = 1;
    let fontSize = 120;
    let step = 9;
    // Match the page's display face (next/font exposes it via --font-lexend);
    // fall back to a heavy sans so the letter shape is still bold and correct.
    let displayFam = '"Arial Black", system-ui, sans-serif';

    function glyphAt(seed: number, time: number) {
      const idx = (seed * 13 + Math.floor(time / 130 + seed)) % GLYPHS.length;
      return GLYPHS[(idx + GLYPHS.length) % GLYPHS.length];
    }

    function computeLayout() {
      const parent = canvas!.parentElement;
      const containerW = parent?.clientWidth || canvas!.clientWidth || 320;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      // Fit the word to ~94% of the container width, capped for large screens.
      ctx!.font = `900 100px ${displayFam}`;
      const ratio = Math.max(1, ctx!.measureText(WORD).width) / 100;
      const targetW = containerW * 0.62;
      fontSize = Math.min(220, Math.max(52, targetW / ratio));
      cssW = containerW;
      cssH = Math.round(fontSize * 1.06);
      step = Math.max(6, Math.round(fontSize * 0.055));

      canvas!.width = Math.round(cssW * dpr);
      canvas!.height = Math.round(cssH * dpr);
      canvas!.style.width = `${cssW}px`;
      canvas!.style.height = `${cssH}px`;

      // Draw the word offscreen at device resolution and sample its pixels.
      const off = document.createElement("canvas");
      off.width = canvas!.width;
      off.height = canvas!.height;
      const octx = off.getContext("2d");
      if (!octx) return;
      octx.scale(dpr, dpr);
      octx.font = `900 ${fontSize}px ${displayFam}`;
      octx.textAlign = "center";
      octx.textBaseline = "middle";
      octx.fillStyle = "#fff";
      octx.fillText(WORD, cssW / 2, cssH / 2);

      const data = octx.getImageData(0, 0, off.width, off.height).data;
      const stepDev = step * dpr;
      points = [];
      let i = 0;
      for (let y = stepDev / 2; y < off.height; y += stepDev) {
        for (let x = stepDev / 2; x < off.width; x += stepDev) {
          const idx = (Math.round(y) * off.width + Math.round(x)) * 4 + 3;
          if (data[idx] > 128) {
            points.push({
              x: x / dpr,
              y: y / dpr,
              seed: i * 131 + (((x * 7 + y * 13) | 0) % 997),
              gold: i % 7 === 0,
            });
            i++;
          }
        }
      }

      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawFrame(0);
    }

    function drawFrame(time: number) {
      ctx!.clearRect(0, 0, cssW, cssH);

      // faint solid backbone so the letters read even between glyphs
      ctx!.font = `900 ${fontSize}px ${displayFam}`;
      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";
      ctx!.fillStyle = rgba(ICE, 0.06);
      ctx!.fillText(WORD, cssW / 2, cssH / 2);

      // code glyphs that form the letters
      ctx!.font = `${step + 1}px ${MONO}`;
      for (const p of points) {
        const tw = reduced ? 0.85 : 0.7 + 0.3 * Math.sin(time * 0.005 + p.seed);
        const wave = reduced ? 0 : Math.sin(time * 0.002 + p.x * 0.03);
        ctx!.fillStyle = p.gold ? rgba(GOLD, Math.min(1, tw + 0.1)) : rgba(ICE, tw);
        ctx!.fillText(glyphAt(p.seed, time), p.x, p.y + wave);
      }
    }

    function loop(t: number) {
      drawFrame(t);
      raf = requestAnimationFrame(loop);
    }

    async function init() {
      try {
        if (typeof document !== "undefined" && document.fonts) {
          const rootFam = getComputedStyle(document.documentElement)
            .getPropertyValue("--font-lexend")
            .trim();
          if (rootFam) displayFam = rootFam;
          try {
            await document.fonts.load(`900 100px ${displayFam}`);
          } catch {
            /* fall back to the default family */
          }
          await document.fonts.ready;
        }
      } catch {
        /* ignore — fallback family is fine */
      }
      if (cancelled) return;
      computeLayout();
      ready = true;
      if (!reduced) raf = requestAnimationFrame(loop);
    }

    init();

    const ro = new ResizeObserver(() => {
      if (ready && !cancelled) computeLayout();
    });
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="block w-full" />;
}
