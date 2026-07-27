"use client";

/**
 * HeroGlyphField — a 3D cloud of code glyphs behind the N.O.D.E. wordmark.
 *
 * Replaces the 2D `HeroNetwork` canvas as the hero backdrop. The mechanism:
 *
 *  1. GLYPH ATLAS — a <canvas> 2D texture holding an ATLAS_GRID × ATLAS_GRID
 *     grid of random alphanumeric/symbol characters. Every point in the cloud
 *     carries an `aChar` attribute naming which cell to sample, so each
 *     particle renders as a *character*, not a soft circle.
 *
 *  2. DEPTH AS ATMOSPHERE — the vertex shader computes `viewDepth = -mvPosition.z`
 *     and `smoothstep(near, far, viewDepth)`. Near points stay opaque; far ones
 *     fade AND blend toward COLOR_FOG, so distance reads as atmosphere rather
 *     than flat transparency.
 *
 *  3. MOUSE-REACTIVE NOISE — 3D simplex noise displaces points in the vertex
 *     shader. Its amplitude (`uNoiseStrength`) is driven by pointer *velocity*,
 *     not position, and decays exponentially once the pointer stops.
 *
 *  4. NODE ACCENT (optional, off by default) — a few low-opacity wireframe
 *     solids linked by thin cylinders, with an additive glow sprite travelling
 *     each link. Toggle with ENABLE_NODE_ACCENT.
 *
 * Accessibility & resilience: `prefers-reduced-motion` freezes the field to a
 * single static frame (no noise, no drift, no pulses). If WebGL is unavailable
 * the component falls back to the previous `HeroNetwork` 2D canvas, so the hero
 * degrades to its prior state with no console errors and no layout shift.
 * DPR is capped at 2. Everything is disposed on unmount.
 */

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import * as THREE from "three";
import {
  ATLAS_GRID,
  COLOR_ACCENT,
  COLOR_CORE,
  COLOR_FOG,
  GLYPH_FRAGMENT_SHADER,
  GLYPH_VERTEX_SHADER,
  buildGlyphAtlas,
  cappedDpr,
  createPointerTracker,
  prefersReduced,
  supportsWebGL,
} from "./hero-glyph-core";

/* ═══════════════════════════════════════════════════════════════
   TUNABLES — everything you'd want to adjust lives in this block.
   ═══════════════════════════════════════════════════════════════ */

/** Particle count. Mobile gets the smaller budget.
 *  Trimmed ~36% from the original 1800/1100: the field was competing with the
 *  wordmark and the HUD instead of reading as atmosphere behind them. */
const POINTS_DESKTOP = 1150;
const POINTS_MOBILE = 680;
/** Viewport width (px) at or below which the mobile budget applies. */
const MOBILE_BREAKPOINT = 640;

/** Camera distance from the cloud centre, and vertical field of view. */
const CAMERA_Z = 26;
const CAMERA_FOV = 60;

/** How far past the viewport edges the cloud extends, so the parallax never
 *  reveals an empty border. 1.0 = exactly the visible frustum. */
const SPREAD_MARGIN = 1.3;
/** Cloud half-depth in world units (points sit between -Z and +Z). */
const FIELD_Z = 18;
/** Re-seed the cloud if the aspect ratio changes by more than this factor (a
 *  device rotation). Small height changes — a mobile URL bar collapsing —
 *  stay well under it, so the field never pops during scroll. */
const RESEED_ASPECT_FACTOR = 1.6;

/** Depth fade window in world units. Below NEAR = fully present,
 *  above FAR = fully dissolved into COLOR_FOG. */
const DEPTH_NEAR = 10;
/** Pulled in from 46 so the mid-field dissolves sooner and the depth gradient
 *  does more of the work of pushing this layer behind the wordmark. */
const DEPTH_FAR = 34;
/** Floor on how present the furthest glyphs stay (0 = invisible). */
const DEPTH_FLOOR = 0.1;

/** Base glyph size in px (before perspective + DPR scaling), and its cap.
 *  The ceiling is well under the wordmark's, so a near field glyph can never be
 *  mistaken for part of the logo. */
const GLYPH_SIZE = 11;
const GLYPH_SIZE_MAX = 26;

/** Overall field opacity — the single dial for "too loud / too tenuous". */
const FIELD_OPACITY = 0.68;

/** Centre clear-out, so the wordmark and headline stay high contrast. The zone
 *  is an ellipse in normalised-device units (0 = screen centre, 1 = edge), so
 *  the radii are independent per axis. */
const CENTER_CLEAR_INNER = 0.0;
const CENTER_CLEAR_OUTER = 0.95;
const CENTER_CLEAR_RX = 1.0;
const CENTER_CLEAR_RY = 1.0;
/** Portrait viewports are tall and narrow, so a circular NDC zone would clear
 *  almost the whole screen. Tighten the vertical reach there instead. */
const CENTER_CLEAR_RY_PORTRAIT = 0.5;
/** How much of the field is removed at the very centre (0 = none, 1 = all).
 *  Was 0.72 when the wordmark was a flat 2D canvas that needed the help. The 3D
 *  wordmark now carries itself on density and brightness, so this is dialled
 *  back to a gentle focal vignette rather than a hole in the field. 0 removes it
 *  entirely; both extremes are captured in the PR for comparison. */
const CENTER_CLEAR_STRENGTH = 0.35;

/** Share of glyphs rendered in the gold accent (0..1). */
const ACCENT_RATIO = 0.26;

/** Noise field: spatial frequency, max displacement, and idle amplitude. */
const NOISE_SCALE = 0.035;
const NOISE_AMP = 3.4;
const NOISE_IDLE = 0.1;
/** How hard pointer speed drives the noise, and how fast it settles (per sec). */
const MOUSE_GAIN = 2.4;
const MOUSE_DECAY = 2.6;
/** Pointer speed (px/sec) that maps to full noise strength. */
const MOUSE_SPEED_FULL = 2200;

/** Slow ambient motion: cloud drift and glyph "recompute" rate. */
const DRIFT_SPEED = 0.05;
/** Camera parallax reach in world units, following the pointer. */
const PARALLAX = 1.6;

/** The glyph atlas, palette and shader pair live in ./hero-glyph-core, shared
 *  with HeroWordmark3D so the two clouds stay visually consistent. */

/** Optional wireframe node-network accent layered into the field. */
const ENABLE_NODE_ACCENT = true;
const NODE_ACCENT_COUNT = 4;
/** Wireframe solid opacity, link-tube opacity, and travelling glow opacity. */
const NODE_ACCENT_OPACITY = 0.3;
const NODE_LINK_OPACITY = 0.07;
const NODE_GLOW_OPACITY = 0.45;
/** Radius of the wireframe solids in world units. */
const NODE_ACCENT_RADIUS = 0.9;
/** The accent sits as one small off-centre cluster rather than being scattered
 *  across the field: scattered nodes chained in sequence produce link tubes
 *  that cut clean across the hero, and the accent layer is not subject to the
 *  points shader's centre clear-out, so those lines crossed the wordmark. */
/* The hero is crowded: the HUD owns the top-left sparkline and top-right node
 * bars, the telemetry rows own the middle-right, the uptime ring the mid-left,
 * and the wordmark the centre. The lower-left quadrant is the one genuinely
 * free pocket, so the cluster lives there. */
const NODE_CLUSTER_AT = { x: -0.42, y: -0.45 }; // fraction of the field extents
const NODE_CLUSTER_SPREAD = 6; // world units around that anchor
/** The camera's visible half-height is fixed, so a fixed world-unit cluster
 *  renders at the same PIXEL size on every viewport — which made it dominate a
 *  narrow phone screen while reading as a small detail on desktop. Scale the
 *  accent down with the aspect ratio so it stays a detail everywhere. */
const NODE_ACCENT_REFERENCE_ASPECT = 1.5;

/* ═══════════════════════════════════════════════════════════════ */

/** Previous hero backdrop, loaded only if WebGL is missing. */
const HeroNetwork = dynamic(() => import("./HeroNetwork"), { ssr: false });

/** Small radial glow, generated in canvas, for the travelling link sprites. */
function buildGlowTexture() {
  const s = 64;
  const canvas = document.createElement("canvas");
  canvas.width = s;
  canvas.height = s;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(255,201,25,1)");
  g.addColorStop(0.4, "rgba(255,201,25,0.35)");
  g.addColorStop(1, "rgba(255,201,25,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return tex;
}

/* ── Component ───────────────────────────────────────────────── */

export default function HeroGlyphField() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [noWebGL, setNoWebGL] = useState(false);

  useEffect(() => {
    if (!supportsWebGL()) {
      setNoWebGL(true);
      return;
    }

    const host = hostRef.current;
    if (!host) return;

    const reduced = prefersReduced();

    /* ── renderer ── */
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: "high-performance",
        // Reduced-motion draws a single frame and stops; WebGL discards the
        // drawing buffer after compositing unless told otherwise, which would
        // leave those users with a blank field.
        preserveDrawingBuffer: reduced,
      });
    } catch {
      setNoWebGL(true);
      return;
    }

    renderer.setPixelRatio(cappedDpr());
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none";
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 200);
    camera.position.z = CAMERA_Z;

    /* ── glyph cloud ── */
    const atlas = buildGlyphAtlas();
    const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
    const count = isMobile ? POINTS_MOBILE : POINTS_DESKTOP;

    // The camera's visible half-height is fixed by FOV and distance, but its
    // half-WIDTH scales with the aspect ratio. Spreading the cloud over a fixed
    // width would therefore leave a portrait viewport nearly empty (only the
    // narrow centre strip is ever on screen), so extents track the live aspect.
    const halfH = Math.tan((CAMERA_FOV * Math.PI) / 360) * CAMERA_Z;
    let fieldX = halfH * SPREAD_MARGIN;
    let fieldY = halfH * SPREAD_MARGIN;
    let seededAspect = 1;

    const positions = new Float32Array(count * 3);
    const chars = new Float32Array(count);
    const seeds = new Float32Array(count);
    const accents = new Float32Array(count);
    const sizeMuls = new Float32Array(count);
    const cells = ATLAS_GRID * ATLAS_GRID;

    for (let i = 0; i < count; i++) {
      chars[i] = Math.floor(Math.random() * cells);
      seeds[i] = Math.random();
      accents[i] = Math.random() < ACCENT_RATIO ? 1 : 0;
      sizeMuls[i] = 0.8 + Math.random() * 0.5;
    }

    /** Scatter the cloud across the frustum implied by `aspect`. */
    function seedPositions(aspect: number) {
      seededAspect = aspect;
      fieldX = halfH * aspect * SPREAD_MARGIN;
      fieldY = halfH * SPREAD_MARGIN;
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() * 2 - 1) * fieldX;
        positions[i * 3 + 1] = (Math.random() * 2 - 1) * fieldY;
        positions[i * 3 + 2] = (Math.random() * 2 - 1) * FIELD_Z;
      }
    }

    seedPositions(Math.max(host.clientWidth, 1) / Math.max(host.clientHeight, 1));

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aChar", new THREE.BufferAttribute(chars, 1));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute("aAccent", new THREE.BufferAttribute(accents, 1));
    geometry.setAttribute("aSizeMul", new THREE.BufferAttribute(sizeMuls, 1));

    const uniforms = {
      uTime: { value: 0 },
      uNoiseStrength: { value: reduced ? 0 : NOISE_IDLE },
      uNoiseScale: { value: NOISE_SCALE },
      uNoiseAmp: { value: NOISE_AMP },
      uDrift: { value: DRIFT_SPEED },
      uPixelRatio: { value: cappedDpr() },
      uSize: { value: GLYPH_SIZE },
      uSizeMax: { value: GLYPH_SIZE_MAX },
      uDepthNear: { value: DEPTH_NEAR },
      uDepthFar: { value: DEPTH_FAR },
      uDepthFloor: { value: DEPTH_FLOOR },
      uOpacity: { value: FIELD_OPACITY },
      uClearInner: { value: CENTER_CLEAR_INNER },
      uClearOuter: { value: CENTER_CLEAR_OUTER },
      uClearStrength: { value: CENTER_CLEAR_STRENGTH },
      uClearRadii: {
        value: new THREE.Vector2(CENTER_CLEAR_RX, CENTER_CLEAR_RY),
      },
      uAtlas: { value: atlas },
      uGrid: { value: ATLAS_GRID },
      uCore: { value: new THREE.Color(COLOR_CORE) },
      uAccent: { value: new THREE.Color(COLOR_ACCENT) },
      uFog: { value: new THREE.Color(COLOR_FOG) },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: GLYPH_VERTEX_SHADER,
      fragmentShader: GLYPH_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    scene.add(points);

    /* ── optional node-network accent ── */
    const accentDisposables: Array<{ dispose: () => void }> = [];
    const travellers: Array<{
      sprite: THREE.Sprite;
      a: THREE.Vector3;
      b: THREE.Vector3;
      t: number;
      speed: number;
    }> = [];
    let accentGroup: THREE.Group | null = null;

    if (ENABLE_NODE_ACCENT) {
      accentGroup = new THREE.Group();
      const glow = buildGlowTexture();
      const accentScale = Math.min(
        1,
        seededAspect / NODE_ACCENT_REFERENCE_ASPECT
      );
      const nodeRadius = NODE_ACCENT_RADIUS * accentScale;
      const clusterSpread = NODE_CLUSTER_SPREAD * accentScale;
      const nodeGeoms = [
        new THREE.IcosahedronGeometry(nodeRadius, 0),
        new THREE.DodecahedronGeometry(nodeRadius * 0.93, 0),
      ];
      const wireMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(COLOR_ACCENT),
        wireframe: true,
        transparent: true,
        opacity: NODE_ACCENT_OPACITY,
      });
      const linkMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(COLOR_ACCENT),
        transparent: true,
        opacity: NODE_LINK_OPACITY,
      });
      accentDisposables.push(wireMat, linkMat, ...nodeGeoms);
      if (glow) accentDisposables.push(glow);

      const anchor = new THREE.Vector3(
        NODE_CLUSTER_AT.x * fieldX,
        NODE_CLUSTER_AT.y * fieldY,
        0
      );
      const centres: THREE.Vector3[] = [];
      for (let i = 0; i < NODE_ACCENT_COUNT; i++) {
        const pos = new THREE.Vector3(
          anchor.x + (Math.random() * 2 - 1) * clusterSpread,
          anchor.y + (Math.random() * 2 - 1) * clusterSpread * 0.7,
          (Math.random() * 2 - 1) * FIELD_Z * 0.35
        );
        centres.push(pos);
        const mesh = new THREE.Mesh(nodeGeoms[i % nodeGeoms.length], wireMat);
        mesh.position.copy(pos);
        accentGroup.add(mesh);
      }

      // Chain the nodes with thin translucent cylinders + a travelling glow.
      for (let i = 0; i < centres.length - 1; i++) {
        const a = centres[i];
        const b = centres[i + 1];
        const len = a.distanceTo(b);
        const tubeR = 0.035 * accentScale;
        const geo = new THREE.CylinderGeometry(tubeR, tubeR, len, 5, 1, true);
        accentDisposables.push(geo);
        const tube = new THREE.Mesh(geo, linkMat);
        tube.position.copy(a).add(b).multiplyScalar(0.5);
        tube.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          b.clone().sub(a).normalize()
        );
        accentGroup.add(tube);

        if (glow) {
          const spriteMat = new THREE.SpriteMaterial({
            map: glow,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            opacity: NODE_GLOW_OPACITY,
          });
          accentDisposables.push(spriteMat);
          const sprite = new THREE.Sprite(spriteMat);
          sprite.scale.setScalar(2.2 * accentScale);
          accentGroup.add(sprite);
          const startT = Math.random();
          // Seed the position too: without this the sprite sits at the origin
          // until the first animation frame, which is visible in the static
          // frame drawn for reduced-motion and for the initial paint.
          sprite.position.lerpVectors(a, b, startT);
          travellers.push({
            sprite,
            a: a.clone(),
            b: b.clone(),
            t: startT,
            speed: 0.12 + Math.random() * 0.12,
          });
        }
      }

      scene.add(accentGroup);
    }

    /* ── pointer: velocity drives noise, position drives parallax ──
       Shared with HeroWordmark3D so both clouds answer the same gesture. */
    const pointer = createPointerTracker({
      gain: MOUSE_GAIN,
      decay: MOUSE_DECAY,
      speedFull: MOUSE_SPEED_FULL,
      parallax: PARALLAX,
      host,
    });

    /* ── sizing ── */
    function resize() {
      const rect = host!.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      renderer.setPixelRatio(cappedDpr());
      renderer.setSize(w, h, false);
      uniforms.uPixelRatio.value = cappedDpr();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      // Only a real orientation change re-scatters the cloud; see the constant.
      const drift = camera.aspect / seededAspect;
      if (drift > RESEED_ASPECT_FACTOR || drift < 1 / RESEED_ASPECT_FACTOR) {
        seedPositions(camera.aspect);
        geometry.getAttribute("position").needsUpdate = true;
      }

      // Portrait needs a vertically tighter clear zone (see the constant).
      uniforms.uClearRadii.value.set(
        CENTER_CLEAR_RX,
        camera.aspect < 1 ? CENTER_CLEAR_RY_PORTRAIT : CENTER_CLEAR_RY
      );

      renderer.render(scene, camera);
    }

    /* ── loop ── */
    let raf = 0;
    let prev = performance.now();

    function frame(now: number) {
      // dt is clamped so a backgrounded tab can't jump the noise field.
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;

      uniforms.uTime.value += dt;

      // Exponential decay back to the idle baseline.
      pointer.step(dt);
      uniforms.uNoiseStrength.value =
        NOISE_IDLE + pointer.state.energy * (1 - NOISE_IDLE);

      camera.position.x = pointer.state.parallaxX;
      camera.position.y = pointer.state.parallaxY;
      camera.lookAt(0, 0, 0);

      for (const tr of travellers) {
        tr.t += tr.speed * dt;
        if (tr.t > 1) tr.t -= 1;
        tr.sprite.position.lerpVectors(tr.a, tr.b, tr.t);
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }

    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(host);

    // Pause when the hero scrolls out of view or the tab is hidden.
    let visible = true;
    let running = false;

    function start() {
      if (running || reduced) return;
      running = true;
      prev = performance.now();
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !document.hidden) start();
        else stop();
      },
      { threshold: 0 }
    );
    io.observe(host);

    function onVisibility() {
      if (document.hidden) stop();
      else if (visible) start();
    }
    document.addEventListener("visibilitychange", onVisibility);

    if (!reduced) {
      pointer.attach();
      start();
    }

    /* ── teardown ── */
    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      pointer.detach();

      geometry.dispose();
      material.dispose();
      atlas?.dispose();
      if (accentGroup) scene.remove(accentGroup);
      for (const d of accentDisposables) d.dispose();
      scene.clear();
      renderer.dispose();
      renderer.forceContextLoss?.();
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, []);

  // No WebGL → fall back to the previous 2D code-stream backdrop.
  if (noWebGL) return <HeroNetwork />;

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full pointer-events-none"
    />
  );
}
