"use client";

/**
 * HeroWordmark3D — the N.O.D.E. wordmark as a genuine 3D model rendered as a
 * glyph point cloud.
 *
 * The previous implementation sampled a flat 2D canvas render of the word, so it
 * had no real depth: no thickness, and nothing for parallax to reveal. This
 * builds actual letter geometry instead:
 *
 *  1. GEOMETRY — FontLoader reads a typeface JSON generated from the real Lexend
 *     Black outlines (see scripts/generate-wordmark-font.mjs) and TextGeometry
 *     extrudes it, giving front face, back face and side walls.
 *  2. SURFACE SAMPLING — MeshSurfaceSampler scatters points evenly over that
 *     surface by triangle area. Sampling the surface rather than reusing the
 *     geometry's vertices matters: extruded text puts its vertices on the
 *     outline corners, so a vertex cloud would trace the letter edges and leave
 *     the faces empty.
 *  3. RENDERING — the shared glyph shader from hero-glyph-core, so each point is
 *     an alphanumeric character that fades and sinks toward the fog tone with
 *     view depth, exactly like the ambient field behind it.
 *
 * It reacts to the same pointer-velocity noise and parallax as the field, scaled
 * down by WORDMARK_NOISE_FACTOR: this is the anchor element, so it should feel
 * steadier than the atmosphere around it and must never wobble into illegibility.
 * A slight tilt driven by the pointer is what actually sells the depth.
 *
 * The semantic text lives in a real <h1 class="sr-only"> in the page, so this
 * canvas is aria-hidden. Without WebGL it falls back to the original 2D
 * HeroWordmark. prefers-reduced-motion renders one static frame, holding a fixed
 * tilt so the 3D form still reads without any animation.
 */

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import * as THREE from "three";
import { FontLoader, type Font } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
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
   TUNABLES
   ═══════════════════════════════════════════════════════════════ */

const WORD = "N.O.D.E.";
const FONT_URL = "/fonts/lexend-900-node.typeface.json";

/** Points sampled over the letter surface. Independent of the ambient field's
 *  budget: this is the logo, and legibility depends directly on density.
 *
 *  Counter-intuitively, MORE points hurt legibility past a point: once the mean
 *  spacing drops below the glyph size the characters overlap into a solid slab
 *  and the letterforms disappear. These counts keep spacing at roughly one
 *  glyph, so the word reads as being built out of characters. */
const WORDMARK_POINTS_DESKTOP = 1900;
const WORDMARK_POINTS_MOBILE = 720;
const MOBILE_BREAKPOINT = 640;

/** Letter size and extrusion depth, in world units. */
const TEXT_SIZE = 10;
const TEXT_DEPTH = 1.6;
/** Curve subdivision on the letter outlines. Higher = rounder O, more triangles. */
const CURVE_SEGMENTS = 5;

/** Camera framing. The distance is solved per resize so the word fits both axes
 *  of its container; these are the margins left around it.
 *
 *  The horizontal margin has to be responsive. The container is ~1386px wide on
 *  desktop, where letting the word span it all would dwarf the headline, so it
 *  sits at ~55% to match the wordmark this replaced. On a 414px phone that same
 *  ratio yields a ~200px word inside a 66px-tall box, far too small to read, so
 *  narrow viewports use nearly the full width instead. */
const CAMERA_FOV = 45;
const FIT_MARGIN_X_DESKTOP = 1.85;
const FIT_MARGIN_X_MOBILE = 1.1;
const FIT_MARGIN_Y = 1.15;

/** Glyph size is derived from the RENDERED word height rather than fixed.
 *  A fixed size does not survive responsiveness: the word is ~130px tall on
 *  desktop but ~35px on a 414px phone, so a size that reads as "letters built
 *  from characters" on one becomes an unreadable slab on the other. */
const GLYPH_TO_WORD_RATIO = 0.05;
const GLYPH_PX_MIN = 3.5;
const GLYPH_PX_MAX = 11;

/** Opacity — above the field's, again for hierarchy. */
const WORDMARK_OPACITY = 1;
/** How present the rear of the extrusion stays (0 = invisible). */
const DEPTH_FLOOR = 0.1;
/** Depth fade window, as multiples of the extrusion depth either side of the
 *  front face. Tight, because the whole model is only TEXT_DEPTH deep. */
const DEPTH_NEAR_PAD = 0.6;
const DEPTH_FAR_PAD = 4.5;

/** Share of glyphs in the gold accent. Lower than the field's, so the wordmark
 *  reads as one object rather than a confetti of colour. */
const ACCENT_RATIO = 0.16;

/** Noise: same model as the field, scaled down so the logo stays readable. */
const NOISE_SCALE = 0.11;
const NOISE_AMP = 0.5;
const NOISE_IDLE = 0.12;
const WORDMARK_NOISE_FACTOR = 0.45;
const MOUSE_GAIN = 2.4;
const MOUSE_DECAY = 2.6;
const MOUSE_SPEED_FULL = 2200;
const DRIFT_SPEED = 0.05;

/** Pointer-driven tilt, in radians — this is what makes the extrusion visible.
 *  Kept small: the word is ~4x wider than it is tall, so at this camera distance
 *  even a modest yaw swings the near end far enough out to break the framing.
 *  FIT_MARGIN_X leaves the headroom for it. */
const TILT_MAX = 0.13;
/** Fixed tilt used when prefers-reduced-motion is on, so depth still reads
 *  without any motion at all. */
const TILT_STATIC = 0.085;

/* ═══════════════════════════════════════════════════════════════ */

/** Original flat wordmark, loaded only if WebGL is unavailable. */
const HeroWordmark2D = dynamic(() => import("./HeroWordmark"), { ssr: false });

export default function HeroWordmark3D() {
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
    let disposed = false;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        // With prefers-reduced-motion we draw exactly one frame and then never
        // again. WebGL discards the drawing buffer after compositing unless
        // asked not to, so without this the static wordmark can silently vanish
        // on any later composite. Only paid for when we are not animating.
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
    const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 400);
    /** Half-extents of the word, filled in once the geometry exists. */
    const halfExtent = { x: 1, y: 1 };

    const group = new THREE.Group();
    scene.add(group);

    const atlas = buildGlyphAtlas();

    const uniforms = {
      uTime: { value: 0 },
      uNoiseStrength: { value: reduced ? 0 : NOISE_IDLE * WORDMARK_NOISE_FACTOR },
      uNoiseScale: { value: NOISE_SCALE },
      uNoiseAmp: { value: NOISE_AMP },
      uDrift: { value: DRIFT_SPEED },
      uPixelRatio: { value: cappedDpr() },
      uSize: { value: 1 },
      uSizeMax: { value: GLYPH_PX_MAX },
      uDepthNear: { value: 1 },
      uDepthFar: { value: 2 },
      uDepthFloor: { value: DEPTH_FLOOR },
      uOpacity: { value: WORDMARK_OPACITY },
      // The wordmark is what the field's centre clear-out makes room for, so it
      // must not clear itself.
      uClearInner: { value: 0 },
      uClearOuter: { value: 1 },
      uClearStrength: { value: 0 },
      uClearRadii: { value: new THREE.Vector2(1, 1) },
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

    let pointCloud: THREE.Points | null = null;
    let cloudGeometry: THREE.BufferGeometry | null = null;

    const pointer = createPointerTracker({
      gain: MOUSE_GAIN,
      decay: MOUSE_DECAY,
      speedFull: MOUSE_SPEED_FULL,
      parallax: 1,
      host,
    });

    /** Solve the camera distance so the word fits its container on both axes. */
    function resize() {
      const rect = host!.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      renderer.setPixelRatio(cappedDpr());
      renderer.setSize(w, h, false);
      uniforms.uPixelRatio.value = cappedDpr();

      const aspect = w / h;
      camera.aspect = aspect;

      const tanHalfFov = Math.tan((CAMERA_FOV * Math.PI) / 360);
      const marginX =
        w <= MOBILE_BREAKPOINT ? FIT_MARGIN_X_MOBILE : FIT_MARGIN_X_DESKTOP;
      // Distance needed for the word's height, and for its width at this aspect.
      const distForY = (halfExtent.y * FIT_MARGIN_Y) / tanHalfFov;
      const distForX = (halfExtent.x * marginX) / (tanHalfFov * aspect);
      const dist = Math.max(distForY, distForX);

      camera.position.set(0, 0, dist);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();

      // Keep the depth window tight around the model, which is only
      // TEXT_DEPTH deep, so front and back faces are clearly distinguishable.
      uniforms.uDepthNear.value = dist - TEXT_DEPTH * DEPTH_NEAR_PAD;
      uniforms.uDepthFar.value = dist + TEXT_DEPTH * DEPTH_FAR_PAD;

      // Scale the glyphs to the word as actually rendered. The shader applies a
      // perspective term of 30/viewDepth, so dividing it back out here turns a
      // target pixel size into the uSize the shader wants.
      const wordHeightPx = (halfExtent.y / (tanHalfFov * dist)) * h;
      const glyphPx = Math.min(
        GLYPH_PX_MAX,
        Math.max(GLYPH_PX_MIN, wordHeightPx * GLYPH_TO_WORD_RATIO)
      );
      uniforms.uSize.value = (glyphPx * dist) / 30;
      uniforms.uSizeMax.value = glyphPx * 1.7;

      renderer.render(scene, camera);
    }

    /** Sample the extruded letters into a glyph point cloud. */
    function buildCloud(font: Font) {
      const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
      const count = isMobile
        ? WORDMARK_POINTS_MOBILE
        : WORDMARK_POINTS_DESKTOP;

      const textGeo = new TextGeometry(WORD, {
        font,
        size: TEXT_SIZE,
        depth: TEXT_DEPTH,
        curveSegments: CURVE_SEGMENTS,
        bevelEnabled: false,
      });
      textGeo.computeBoundingBox();
      const bb = textGeo.boundingBox!;
      // TextGeometry lays the word out from the origin along +X and sits it on
      // the baseline; recentre it so the model rotates about its own middle.
      textGeo.translate(
        -(bb.max.x + bb.min.x) / 2,
        -(bb.max.y + bb.min.y) / 2,
        -(bb.max.z + bb.min.z) / 2
      );
      halfExtent.x = (bb.max.x - bb.min.x) / 2;
      halfExtent.y = (bb.max.y - bb.min.y) / 2;

      // MeshSurfaceSampler needs a Mesh, and an index-free, non-morphed geometry.
      const sampler = new MeshSurfaceSampler(
        new THREE.Mesh(textGeo, new THREE.MeshBasicMaterial())
      ).build();

      const positions = new Float32Array(count * 3);
      const chars = new Float32Array(count);
      const seeds = new Float32Array(count);
      const accents = new Float32Array(count);
      const sizeMuls = new Float32Array(count);
      const cells = ATLAS_GRID * ATLAS_GRID;
      const tmp = new THREE.Vector3();

      // Reject samples on the rear face. Transparent points render with
      // depthWrite off, so back-face points are not occluded by the front ones
      // and instead bleed through as a ghost offset sideways by the tilt, which
      // is what was hazing the letterforms. Dropping them is also the physically
      // correct result, and doubles the effective density on the face you see.
      // Side walls survive, so the extrusion still reads under tilt.
      const zFloor = -TEXT_DEPTH * 0.1;
      const sampleFront = (out: THREE.Vector3) => {
        for (let attempt = 0; attempt < 40; attempt++) {
          sampler.sample(out);
          if (out.z >= zFloor) return;
        }
        // Gave up: nudge it to the front plane rather than leaving it behind.
        out.z = zFloor;
      };

      for (let i = 0; i < count; i++) {
        sampleFront(tmp);
        positions[i * 3] = tmp.x;
        positions[i * 3 + 1] = tmp.y;
        positions[i * 3 + 2] = tmp.z;
        chars[i] = Math.floor(Math.random() * cells);
        seeds[i] = Math.random();
        accents[i] = Math.random() < ACCENT_RATIO ? 1 : 0;
        sizeMuls[i] = 0.85 + Math.random() * 0.35;
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setAttribute("aChar", new THREE.BufferAttribute(chars, 1));
      geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
      geo.setAttribute("aAccent", new THREE.BufferAttribute(accents, 1));
      geo.setAttribute("aSizeMul", new THREE.BufferAttribute(sizeMuls, 1));

      cloudGeometry = geo;
      pointCloud = new THREE.Points(geo, material);
      pointCloud.frustumCulled = false;
      group.add(pointCloud);

      // The sampler and the source mesh are no longer needed on the GPU/CPU.
      textGeo.dispose();
    }

    /* ── loop ── */
    let raf = 0;
    let prev = performance.now();
    let running = false;
    let visible = true;

    function frame(now: number) {
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;

      uniforms.uTime.value += dt;
      pointer.step(dt);

      uniforms.uNoiseStrength.value =
        (NOISE_IDLE + pointer.state.energy * (1 - NOISE_IDLE)) *
        WORDMARK_NOISE_FACTOR;

      // Tilt is what reveals the extrusion — without it a head-on point cloud
      // of extruded text is indistinguishable from a flat one.
      group.rotation.y = pointer.state.parallaxX * TILT_MAX;
      group.rotation.x = pointer.state.parallaxY * TILT_MAX * 0.6;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (running || reduced || disposed) return;
      running = true;
      prev = performance.now();
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(host);

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

    /* ── font load, then first paint ── */
    new FontLoader().load(
      FONT_URL,
      (font) => {
        if (disposed) return;
        buildCloud(font);
        if (reduced) {
          // Hold a fixed tilt so the 3D form is legible in a single frame.
          group.rotation.y = TILT_STATIC;
          group.rotation.x = TILT_STATIC * 0.35;
        }
        // Now that halfExtent is known, solve framing and paint synchronously so
        // the wordmark is never blank waiting on the first animation frame.
        resize();
        if (!reduced) {
          pointer.attach();
          start();
        }
      },
      undefined,
      () => {
        // Font unavailable (404, offline): fall back to the flat wordmark rather
        // than leaving a blank gap where the logo belongs.
        if (!disposed) setNoWebGL(true);
      }
    );

    return () => {
      disposed = true;
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      pointer.detach();

      cloudGeometry?.dispose();
      material.dispose();
      atlas?.dispose();
      scene.clear();
      renderer.dispose();
      renderer.forceContextLoss?.();
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (noWebGL) return <HeroWordmark2D />;

  // Stretched with inset-0 rather than h-full: the parent's height comes from a
  // min-height with height:auto, so a percentage height would resolve to zero.
  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full pointer-events-none"
    />
  );
}
