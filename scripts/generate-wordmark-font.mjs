/**
 * Generates the typeface JSON that HeroWordmark's TextGeometry needs.
 *
 * three's FontLoader only understands the facetype.js "typeface" format, and no
 * such file existed for the brand font — Lexend reaches the browser as hashed
 * WOFF2 build output, which FontLoader cannot read. This converts the real
 * Lexend Black (900) outlines into that format, SUBSET to just the glyphs the
 * wordmark uses, so the committed asset stays a few KB instead of a few hundred.
 *
 * Run with: node scripts/generate-wordmark-font.mjs
 * Source font: @fontsource/lexend (devDependency, not shipped to the client).
 *
 * Output: public/fonts/lexend-900-node.typeface.json
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import opentype from "opentype.js";

const SRC = "node_modules/@fontsource/lexend/files/lexend-latin-900-normal.woff";
const OUT = "public/fonts/lexend-900-node.typeface.json";
/** Every distinct character in "N.O.D.E." */
const CHARS = ["N", "O", "D", "E", "."];

/* FontLoader's outline grammar puts the END point first and the control
 * point(s) after it, which is the reverse of opentype.js's ordering:
 *   m endX endY
 *   l endX endY
 *   q endX endY ctrlX ctrlY
 *   b endX endY ctrl1X ctrl1Y ctrl2X ctrl2Y
 * Coordinates are in font units with Y pointing UP, while opentype.js hands back
 * screen-style Y-down coordinates, so every Y is negated on the way out. */
function toOutline(path) {
  const out = [];
  const n = (v) => Math.round(v * 100) / 100;
  for (const c of path.commands) {
    switch (c.type) {
      case "M":
        out.push("m", n(c.x), n(-c.y));
        break;
      case "L":
        out.push("l", n(c.x), n(-c.y));
        break;
      case "Q":
        out.push("q", n(c.x), n(-c.y), n(c.x1), n(-c.y1));
        break;
      case "C":
        out.push("b", n(c.x), n(-c.y), n(c.x1), n(-c.y1), n(c.x2), n(-c.y2));
        break;
      case "Z":
        // Typeface outlines close implicitly; FontLoader has no 'z' command.
        break;
      default:
        throw new Error(`Unhandled command type: ${c.type}`);
    }
  }
  return out.join(" ");
}

const buf = readFileSync(resolve(SRC));
const font = opentype.parse(
  buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
);

const unitsPerEm = font.unitsPerEm;
const glyphs = {};

for (const ch of CHARS) {
  const glyph = font.charToGlyph(ch);
  if (!glyph || glyph.index === 0) {
    throw new Error(`Glyph missing from source font: ${JSON.stringify(ch)}`);
  }
  // fontSize = unitsPerEm keeps the output in raw font units (scale factor 1).
  const path = glyph.getPath(0, 0, unitsPerEm);
  const outline = toOutline(path);
  if (!outline) throw new Error(`Empty outline for ${JSON.stringify(ch)}`);

  glyphs[ch] = {
    ha: Math.round(glyph.advanceWidth),
    x_min: Math.round(glyph.xMin ?? 0),
    x_max: Math.round(glyph.xMax ?? 0),
    o: outline,
  };
}

const data = {
  glyphs,
  familyName: "Lexend",
  ascender: Math.round(font.ascender),
  descender: Math.round(font.descender),
  underlinePosition: Math.round(font.tables.post?.underlinePosition ?? -100),
  underlineThickness: Math.round(font.tables.post?.underlineThickness ?? 50),
  boundingBox: {
    xMin: Math.round(font.tables.head.xMin),
    xMax: Math.round(font.tables.head.xMax),
    yMin: Math.round(font.tables.head.yMin),
    yMax: Math.round(font.tables.head.yMax),
  },
  resolution: unitsPerEm,
  original_font_information: {
    font_family: "Lexend",
    font_subfamily: "Black",
    // Recorded so it is obvious this file is generated, not hand-authored.
    generated_by: "scripts/generate-wordmark-font.mjs",
    subset: CHARS.join(""),
  },
};

mkdirSync(dirname(resolve(OUT)), { recursive: true });
writeFileSync(resolve(OUT), JSON.stringify(data));

const bytes = readFileSync(resolve(OUT)).length;
console.log(`wrote ${OUT} (${(bytes / 1024).toFixed(1)} KB)`);
console.log(`unitsPerEm=${unitsPerEm} ascender=${data.ascender}`);
for (const ch of CHARS) {
  const g = glyphs[ch];
  console.log(
    `  ${JSON.stringify(ch)} ha=${g.ha} x=[${g.x_min},${g.x_max}] cmds=${g.o.split(" ").filter((t) => /^[mlqb]$/.test(t)).length}`
  );
}
