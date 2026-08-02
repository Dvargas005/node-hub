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

/* ═══════════════════════════════════════════════════════════════
   TUNABLES — everything you'd want to adjust lives in this block.
   ═══════════════════════════════════════════════════════════════ */

/** Particle count. Mobile gets the smaller budget. */
const POINTS_DESKTOP = 1800;
const POINTS_MOBILE = 1100;
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
const DEPTH_FAR = 46;
/** Floor on how present the furthest glyphs stay (0 = invisible). */
const DEPTH_FLOOR = 0.1;

/** Base glyph size in px (before perspective + DPR scaling), and its cap. */
const GLYPH_SIZE = 11;
const GLYPH_SIZE_MAX = 40;

/** Overall field opacity — the single dial for "too loud / too tenuous". */
const FIELD_OPACITY = 0.8;

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
/** How much of the field is removed at the very centre (0 = none, 1 = all). */
const CENTER_CLEAR_STRENGTH = 0.72;

/** Palette — N.O.D.E. brand tokens. */
const COLOR_CORE = "#F5F6FC"; // ice white — most glyphs
const COLOR_ACCENT = "#FFC919"; // gold bar — accent glyphs
const COLOR_FOG = "#130A06"; // asphalt black — what distance dissolves into
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

/** Glyph atlas: grid size and per-cell resolution in px. */
const ATLAS_GRID = 8; // 8 × 8 = 64 distinct glyphs
const ATLAS_CELL = 64;
/** Character pool — matches the code-stream vocabulary used elsewhere. */
const GLYPH_CHARS = "0123456789ABCDEF{}<>[]/=+*;:#%$&|";

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

const MONO =
  'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace';

/** Previous hero backdrop, loaded only if WebGL is missing. */
const HeroNetwork = dynamic(() => import("./HeroNetwork"), { ssr: false });

function prefersReduced() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Cheap, non-throwing WebGL probe. */
function supportsWebGL() {
  if (typeof window === "undefined") return false;
  if (!("WebGLRenderingContext" in window)) return false;
  try {
    const c = document.createElement("canvas");
    return !!(
      c.getContext("webgl2") ||
      c.getContext("webgl") ||
      c.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

/**
 * Build the glyph atlas: ATLAS_GRID² cells, one random character each, drawn
 * white-on-transparent so the fragment shader can tint it freely.
 */
function buildAtlas() {
  const size = ATLAS_GRID * ATLAS_CELL;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `bold ${Math.round(ATLAS_CELL * 0.72)}px ${MONO}`;

  for (let row = 0; row < ATLAS_GRID; row++) {
    for (let col = 0; col < ATLAS_GRID; col++) {
      const ch = GLYPH_CHARS[Math.floor(Math.random() * GLYPH_CHARS.length)];
      ctx.fillText(
        ch,
        col * ATLAS_CELL + ATLAS_CELL / 2,
        row * ATLAS_CELL + ATLAS_CELL / 2
      );
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return tex;
}

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

/* ── Shaders ─────────────────────────────────────────────────── */

/** Ashima / Stefan Gustavson 3D simplex noise (webgl-noise, MIT). */
const SIMPLEX_3D = /* glsl */ `
vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 mod289(vec4 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

const VERTEX_SHADER = /* glsl */ `
attribute float aChar;
attribute float aSeed;
attribute float aAccent;
attribute float aSizeMul;

uniform float uTime;
uniform float uNoiseStrength;
uniform float uNoiseScale;
uniform float uNoiseAmp;
uniform float uDrift;
uniform float uPixelRatio;
uniform float uSize;
uniform float uSizeMax;
uniform float uDepthNear;
uniform float uDepthFar;

varying float vChar;
varying float vFade;
varying float vAccent;
varying float vTwinkle;
varying vec2 vNdc;

${SIMPLEX_3D}

void main() {
  vec3 p = position;

  // Slow ambient drift so the field breathes even when the pointer is still.
  p.y += sin(uTime * uDrift * 2.4 + aSeed * 6.2831853) * 0.5;

  // Mouse-reactive simplex displacement; the noise field itself scrolls slowly
  // so glyphs appear to recompute rather than sit in a frozen pattern.
  vec3 np = p * uNoiseScale + vec3(0.0, 0.0, uTime * uDrift);
  vec3 disp = vec3(
    snoise(np),
    snoise(np + vec3(31.4, 0.0, 0.0)),
    snoise(np + vec3(0.0, 17.7, 0.0))
  );
  p += disp * uNoiseAmp * uNoiseStrength;

  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);

  // Depth drives both alpha and fog blend in the fragment stage.
  float viewDepth = -mvPosition.z;
  vFade = 1.0 - smoothstep(uDepthNear, uDepthFar, viewDepth);

  vChar = aChar;
  vAccent = aAccent;
  vTwinkle = 0.72 + 0.28 * sin(uTime * 0.9 + aSeed * 12.9898);

  gl_Position = projectionMatrix * mvPosition;

  // Screen-space position, so the fragment stage can carve out the centre where
  // the wordmark and headline live.
  vNdc = gl_Position.xy / max(gl_Position.w, 0.0001);

  // Perspective-correct point size, clamped so near glyphs don't blow up.
  float size = uSize * aSizeMul * uPixelRatio * (30.0 / max(viewDepth, 0.001));
  gl_PointSize = clamp(size, 1.0, uSizeMax * uPixelRatio);
}
`;

const FRAGMENT_SHADER = /* glsl */ `
uniform sampler2D uAtlas;
uniform float uGrid;
uniform vec3 uCore;
uniform vec3 uAccent;
uniform vec3 uFog;
uniform float uDepthFloor;
uniform float uOpacity;
uniform float uClearInner;
uniform float uClearOuter;
uniform float uClearStrength;
uniform vec2 uClearRadii;

varying float vChar;
varying float vFade;
varying float vAccent;
varying float vTwinkle;
varying vec2 vNdc;

void main() {
  // Map this point's glyph index to its atlas cell. CanvasTexture is flipY, so
  // the V coordinate is mirrored to keep glyphs upright.
  float idx = floor(vChar + 0.5);
  float col = mod(idx, uGrid);
  float row = floor(idx / uGrid);
  vec2 uv = vec2(
    (col + gl_PointCoord.x) / uGrid,
    1.0 - (row + gl_PointCoord.y) / uGrid
  );

  float mask = texture2D(uAtlas, uv).a;
  if (mask < 0.08) discard;

  vec3 base = mix(uCore, uAccent, vAccent);

  // Distance reads as atmosphere: colour sinks toward the fog tone as well as
  // losing alpha, rather than going flatly transparent.
  float presence = uDepthFloor + (1.0 - uDepthFloor) * vFade;
  vec3 tinted = mix(uFog, base, 0.25 + 0.75 * vFade);

  // Calm centre: glyphs thin out toward the middle of the viewport so the
  // wordmark stays legible, then recover their full weight out at the edges.
  float radial = length(vNdc / uClearRadii);
  float clear = mix(
    1.0 - uClearStrength,
    1.0,
    smoothstep(uClearInner, uClearOuter, radial)
  );

  gl_FragColor = vec4(tinted, mask * presence * vTwinkle * clear * uOpacity);
}
`;

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
      });
    } catch {
      setNoWebGL(true);
      return;
    }

    const dpr = () => Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr());
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none";
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 200);
    camera.position.z = CAMERA_Z;

    /* ── glyph cloud ── */
    const atlas = buildAtlas();
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
      uPixelRatio: { value: dpr() },
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
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
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

    /* ── pointer: velocity drives noise, position drives parallax ── */
    const pointer = {
      x: 0,
      y: 0,
      lastX: 0,
      lastY: 0,
      lastT: 0,
      seen: false,
      /** 0..1 impulse from pointer speed, decays exponentially. */
      energy: 0,
      parallaxX: 0,
      parallaxY: 0,
      targetX: 0,
      targetY: 0,
    };

    function onPointerMove(e: PointerEvent) {
      const now = performance.now();
      pointer.x = e.clientX;
      pointer.y = e.clientY;

      if (pointer.seen) {
        const dt = Math.max(now - pointer.lastT, 1) / 1000;
        const dist = Math.hypot(
          pointer.x - pointer.lastX,
          pointer.y - pointer.lastY
        );
        const speed = dist / dt; // px per second
        const impulse = Math.min(speed / MOUSE_SPEED_FULL, 1);
        pointer.energy = Math.min(pointer.energy + impulse * MOUSE_GAIN, 1);
      }

      pointer.lastX = pointer.x;
      pointer.lastY = pointer.y;
      pointer.lastT = now;
      pointer.seen = true;

      const rect = host!.getBoundingClientRect();
      pointer.targetX = ((pointer.x - rect.left) / rect.width - 0.5) * PARALLAX;
      pointer.targetY = -((pointer.y - rect.top) / rect.height - 0.5) * PARALLAX;
    }

    /* ── sizing ── */
    function resize() {
      const rect = host!.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      renderer.setPixelRatio(dpr());
      renderer.setSize(w, h, false);
      uniforms.uPixelRatio.value = dpr();
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
      pointer.energy *= Math.exp(-MOUSE_DECAY * dt);
      uniforms.uNoiseStrength.value =
        NOISE_IDLE + pointer.energy * (1 - NOISE_IDLE);

      pointer.parallaxX += (pointer.targetX - pointer.parallaxX) * 0.04;
      pointer.parallaxY += (pointer.targetY - pointer.parallaxY) * 0.04;
      camera.position.x = pointer.parallaxX;
      camera.position.y = pointer.parallaxY;
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
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      start();
    }

    /* ── teardown ── */
    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);

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
