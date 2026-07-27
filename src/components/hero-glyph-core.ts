/**
 * Shared machinery for the hero's glyph point clouds.
 *
 * Both `HeroGlyphField` (the ambient background field) and `HeroWordmark3D`
 * (the N.O.D.E. logo sampled off real 3D letter geometry) render the same way:
 * a THREE.Points cloud where each point samples one cell of a generated glyph
 * atlas, fades and sinks toward a fog tone with view depth, and is displaced by
 * mouse-velocity-driven simplex noise.
 *
 * This module owns the parts that must not diverge between the two — the atlas
 * canvas, the shader pair, and the pointer-energy model — so the field and the
 * wordmark stay visually consistent and the atlas generation exists once.
 */

import * as THREE from "three";

/* ── Glyph atlas ─────────────────────────────────────────────── */

/** Atlas grid size and per-cell resolution in px. */
export const ATLAS_GRID = 8; // 8 × 8 = 64 distinct glyphs
export const ATLAS_CELL = 64;
/** Character pool — the code-stream vocabulary used across the hero. */
export const GLYPH_CHARS = "0123456789ABCDEF{}<>[]/=+*;:#%$&|";

export const MONO =
  'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace';

/** Brand palette. */
export const COLOR_CORE = "#F5F6FC"; // ice white
export const COLOR_ACCENT = "#FFC919"; // gold bar
export const COLOR_FOG = "#130A06"; // asphalt black — what distance dissolves into

/**
 * Build the glyph atlas: ATLAS_GRID² cells, one random character each, drawn
 * white-on-transparent so the fragment shader can tint it freely.
 */
export function buildGlyphAtlas(): THREE.CanvasTexture | null {
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

/* ── Environment probes ──────────────────────────────────────── */

export function prefersReduced(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Cheap, non-throwing WebGL probe. */
export function supportsWebGL(): boolean {
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

/** devicePixelRatio, capped so high-DPI screens don't quadruple the fill cost. */
export function cappedDpr(): number {
  return Math.min(window.devicePixelRatio || 1, 2);
}

/* ── Pointer model ───────────────────────────────────────────── */

export type PointerTrackerOptions = {
  /** How hard pointer speed drives the energy. */
  gain: number;
  /** Exponential settle rate, per second. */
  decay: number;
  /** Pointer speed (px/sec) that maps to full energy. */
  speedFull: number;
  /** Parallax reach, in whatever units the consumer wants. */
  parallax: number;
  /** Element the parallax is measured relative to. */
  host: HTMLElement;
};

/**
 * Tracks pointer *velocity* (not position) as a 0..1 energy that decays
 * exponentially once the pointer stops, plus a smoothed parallax offset.
 * Shared so the wordmark and the field react to the same gesture in step —
 * the wordmark just scales the result down, since it is the anchor element.
 */
export function createPointerTracker(opts: PointerTrackerOptions) {
  const state = {
    energy: 0,
    parallaxX: 0,
    parallaxY: 0,
    targetX: 0,
    targetY: 0,
  };
  let lastX = 0;
  let lastY = 0;
  let lastT = 0;
  let seen = false;

  function onPointerMove(e: PointerEvent) {
    const now = performance.now();
    const x = e.clientX;
    const y = e.clientY;

    if (seen) {
      const dt = Math.max(now - lastT, 1) / 1000;
      const speed = Math.hypot(x - lastX, y - lastY) / dt; // px per second
      const impulse = Math.min(speed / opts.speedFull, 1);
      state.energy = Math.min(state.energy + impulse * opts.gain, 1);
    }

    lastX = x;
    lastY = y;
    lastT = now;
    seen = true;

    const rect = opts.host.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      state.targetX = ((x - rect.left) / rect.width - 0.5) * opts.parallax;
      state.targetY = -((y - rect.top) / rect.height - 0.5) * opts.parallax;
    }
  }

  return {
    state,
    /** Advance decay and parallax smoothing by `dt` seconds. */
    step(dt: number) {
      state.energy *= Math.exp(-opts.decay * dt);
      state.parallaxX += (state.targetX - state.parallaxX) * 0.04;
      state.parallaxY += (state.targetY - state.parallaxY) * 0.04;
    },
    attach() {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
    },
    detach() {
      window.removeEventListener("pointermove", onPointerMove);
    },
  };
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

export const GLYPH_VERTEX_SHADER = /* glsl */ `
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

  // Slow ambient drift so the cloud breathes even when the pointer is still.
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

  // Screen-space position, so the fragment stage can carve out the centre.
  vNdc = gl_Position.xy / max(gl_Position.w, 0.0001);

  // Perspective-correct point size, clamped so near glyphs don't blow up.
  float size = uSize * aSizeMul * uPixelRatio * (30.0 / max(viewDepth, 0.001));
  gl_PointSize = clamp(size, 1.0, uSizeMax * uPixelRatio);
}
`;

export const GLYPH_FRAGMENT_SHADER = /* glsl */ `
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

  // Optional calm centre. The wordmark sets uClearStrength to 0, since it IS
  // the thing the field is clearing space for.
  float radial = length(vNdc / uClearRadii);
  float clear = mix(
    1.0 - uClearStrength,
    1.0,
    smoothstep(uClearInner, uClearOuter, radial)
  );

  gl_FragColor = vec4(tinted, mask * presence * vTwinkle * clear * uOpacity);
}
`;
