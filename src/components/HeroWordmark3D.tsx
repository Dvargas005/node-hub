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
  SIMPLEX_3D,
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

/* ── Letter outline ───────────────────────────────────────────
   A hairline wireframe tracing every letter contour — including the O and D
   counters — so closed letters have a hard edge instead of dissolving into a
   blob of characters. It is real line geometry, NOT a band of particles: an
   earlier attempt scattered glyphs along the contour, which just added more
   particle mass and buried the letterforms further.

   GL line width is effectively locked to 1 device pixel (drivers ignore
   linewidth > 1), which here is exactly the point: at DPR 2 that renders as
   half a CSS pixel. The fill keeps every one of its particles; this only adds
   the edge that tells you where each letter stops. */

/** Master switch for the outline. */
const ENABLE_OUTLINE = true;
/** Length of one wireframe segment in world units. Larger = fewer, longer
 *  facets, so the curves read as a faceted polygonal mesh rather than as smooth
 *  vector curves — deliberate, and consistent with the wireframe node accent
 *  already in the hero. */
const OUTLINE_FACET_LENGTH = 0.85;
/** Line opacity — the only weight dial there is, since GL linewidth is pinned at
 *  1 device pixel. A hairline needs a fairly high value to register at all, so
 *  this is not on the same scale as a fill opacity.
 *
 *  Split by breakpoint, and for a sharper reason than the usual responsive
 *  tweak: the line is one PIXEL wide no matter how large the word is drawn,
 *  while the word itself goes from ~130px tall on desktop to ~35px on a phone.
 *  The stroke is therefore ~4x heavier relative to the letterform on mobile —
 *  and it lands on a fill that has simultaneously dropped from 1900 points to
 *  720. Held at the desktop value it stops reading as an edge around a glyph
 *  texture and starts reading as a line drawing with some glyphs scattered in
 *  it, which loses exactly the quality the wordmark is for. */
const OUTLINE_OPACITY_DESKTOP = 0.72;
const OUTLINE_OPACITY_MOBILE = 0.46;
/** Outline noise relative to the fill's — deliberately lower. If the edge
 *  travels more than the interior it stops reading as a border at all. */
const OUTLINE_NOISE_FACTOR = 0.3;
/** How much presence the outline keeps at depth (0 = fades out entirely). */
const OUTLINE_DEPTH_FLOOR = 0.55;

/** Pointer-driven tilt, in radians — this is what makes the extrusion visible.
 *  Kept small: the word is ~4x wider than it is tall, so at this camera distance
 *  even a modest yaw swings the near end far enough out to break the framing.
 *  FIT_MARGIN_X leaves the headroom for it. */
const TILT_MAX = 0.13;
/** Fixed tilt used when prefers-reduced-motion is on, so depth still reads
 *  without any motion at all. */
const TILT_STATIC = 0.085;

/* ═══════════════════════════════════════════════════════════════ */

/* The outline can't use the point-cloud shader — that one is built around
 * gl_PointSize and atlas sampling. It shares the noise field and the depth-fade
 * model, and nothing else. Crucially it omits the per-point random Y jitter the
 * fill applies via aSeed: that is fine for scattered particles but would tear a
 * connected line into confetti. Simplex noise is spatially coherent, so
 * neighbouring vertices displace together and the outline flexes as one piece. */
const OUTLINE_VERTEX_SHADER = /* glsl */ `
uniform float uTime;
uniform float uNoiseStrength;
uniform float uNoiseScale;
uniform float uNoiseAmp;
uniform float uDrift;
uniform float uDepthNear;
uniform float uDepthFar;

varying float vFade;

${SIMPLEX_3D}

void main() {
  vec3 p = position;

  vec3 np = p * uNoiseScale + vec3(0.0, 0.0, uTime * uDrift);
  vec3 disp = vec3(
    snoise(np),
    snoise(np + vec3(31.4, 0.0, 0.0)),
    snoise(np + vec3(0.0, 17.7, 0.0))
  );
  p += disp * uNoiseAmp * uNoiseStrength;

  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  float viewDepth = -mvPosition.z;
  vFade = 1.0 - smoothstep(uDepthNear, uDepthFar, viewDepth);

  gl_Position = projectionMatrix * mvPosition;
}
`;

const OUTLINE_FRAGMENT_SHADER = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uFog;
uniform float uOpacity;
uniform float uDepthFloor;

varying float vFade;

void main() {
  vec3 tinted = mix(uFog, uColor, 0.35 + 0.65 * vFade);
  float presence = uDepthFloor + (1.0 - uDepthFloor) * vFade;
  gl_FragColor = vec4(tinted, uOpacity * presence);
}
`;

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

    const outlineUniforms = {
      uTime: { value: 0 },
      uNoiseStrength: {
        value: reduced
          ? 0
          : NOISE_IDLE * WORDMARK_NOISE_FACTOR * OUTLINE_NOISE_FACTOR,
      },
      uNoiseScale: { value: NOISE_SCALE },
      uNoiseAmp: { value: NOISE_AMP },
      uDrift: { value: DRIFT_SPEED },
      uDepthNear: { value: 1 },
      uDepthFar: { value: 2 },
      uDepthFloor: { value: OUTLINE_DEPTH_FLOOR },
      uOpacity: { value: OUTLINE_OPACITY_DESKTOP },
      uColor: { value: new THREE.Color(COLOR_ACCENT) },
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

    const outlineMaterial = new THREE.ShaderMaterial({
      uniforms: outlineUniforms,
      vertexShader: OUTLINE_VERTEX_SHADER,
      fragmentShader: OUTLINE_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    let pointCloud: THREE.Points | null = null;
    let cloudGeometry: THREE.BufferGeometry | null = null;
    let outlineLines: THREE.LineSegments | null = null;
    let outlineGeometry: THREE.BufferGeometry | null = null;

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

      const isNarrow = w <= MOBILE_BREAKPOINT;
      const tanHalfFov = Math.tan((CAMERA_FOV * Math.PI) / 360);
      const marginX = isNarrow ? FIT_MARGIN_X_MOBILE : FIT_MARGIN_X_DESKTOP;
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

      // The hairline has no glyph size to solve; it shares the depth window and
      // re-picks its weight, since a resize can cross the breakpoint.
      outlineUniforms.uDepthNear.value = uniforms.uDepthNear.value;
      outlineUniforms.uDepthFar.value = uniforms.uDepthFar.value;
      outlineUniforms.uOpacity.value = isNarrow
        ? OUTLINE_OPACITY_MOBILE
        : OUTLINE_OPACITY_DESKTOP;

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
      // Read the offsets out BEFORE translating: translate() runs through
      // applyMatrix4, which recomputes boundingBox in place, so `bb` would then
      // describe the already-centred geometry. The outline is generated from the
      // font's own shapes in the untranslated space and needs these same offsets.
      const offX = -(bb.max.x + bb.min.x) / 2;
      const offY = -(bb.max.y + bb.min.y) / 2;
      const offZ = -(bb.max.z + bb.min.z) / 2;
      const sizeX = bb.max.x - bb.min.x;
      const sizeY = bb.max.y - bb.min.y;

      textGeo.translate(offX, offY, offZ);
      halfExtent.x = sizeX / 2;
      halfExtent.y = sizeY / 2;

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

      if (ENABLE_OUTLINE) buildOutline(font, offX, offY);
    }

    /**
     * Trace every letter contour as a hairline wireframe.
     *
     * `font.generateShapes` hands back the same THREE.Shapes that TextGeometry
     * extrudes, each carrying its holes — which is exactly what the O and D need,
     * since their inner edge defines the letter as much as the outer one.
     *
     * Everything goes into ONE LineSegments: a LineLoop per contour would mean a
     * draw call per contour, and the word has ten of them.
     */
    function buildOutline(font: Font, offX: number, offY: number) {
      const shapes = font.generateShapes(WORD, TEXT_SIZE);

      // Outer contours and holes are treated identically.
      const contours: THREE.Path[] = [];
      for (const shape of shapes) {
        contours.push(shape);
        for (const hole of shape.holes) contours.push(hole);
      }

      // Sit slightly in front of the front face so the hairline is never buried
      // inside the particle mass it is meant to delimit.
      const frontZ = TEXT_DEPTH / 2 + 0.02;
      const coords: number[] = [];

      for (const contour of contours) {
        const length = contour.getLength();
        if (!Number.isFinite(length) || length <= 0) continue;

        // Segment count from arc length, so a long stem and a tight curve get
        // facets of the same size rather than the same COUNT.
        const segments = Math.max(3, Math.round(length / OUTLINE_FACET_LENGTH));
        const pts = contour.getSpacedPoints(segments);
        if (pts.length < 2) continue;

        // Explicit vertex pairs, closing the loop on the last segment.
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i];
          const b = pts[(i + 1) % pts.length];
          coords.push(a.x + offX, a.y + offY, frontZ);
          coords.push(b.x + offX, b.y + offY, frontZ);
        }
      }

      if (coords.length === 0) return;

      const geo = new THREE.BufferGeometry();
      geo.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(coords), 3)
      );

      outlineGeometry = geo;
      outlineLines = new THREE.LineSegments(geo, outlineMaterial);
      outlineLines.frustumCulled = false;
      group.add(outlineLines);
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

      const wordmarkNoise =
        (NOISE_IDLE + pointer.state.energy * (1 - NOISE_IDLE)) *
        WORDMARK_NOISE_FACTOR;
      uniforms.uNoiseStrength.value = wordmarkNoise;
      // The edge moves with the fill but far less, so it still reads as a border.
      outlineUniforms.uTime.value = uniforms.uTime.value;
      outlineUniforms.uNoiseStrength.value = wordmarkNoise * OUTLINE_NOISE_FACTOR;

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
      outlineGeometry?.dispose();
      material.dispose();
      outlineMaterial.dispose();
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
