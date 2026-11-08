import { test } from "node:test";
import assert from "node:assert/strict";
import { CITY_CONTENT } from "./city-content";
import { guideFor } from "./guide-content";
import { workFor } from "./work-content";

const cities = Object.values(CITY_CONTENT);

const allText = (c: (typeof cities)[number]) =>
  [
    c.metaTitle,
    c.metaDescription,
    c.h1,
    ...c.lead,
    c.areasHeading,
    c.areasIntro,
    ...(c.sections ?? []).flatMap((s) => [s.heading, ...s.paragraphs, ...(s.bullets ?? [])]),
    ...c.faqs.flatMap((f) => [f.q, f.a]),
  ].join("\n");

test("meta fits in search results", () => {
  for (const c of cities) {
    assert.ok(c.metaDescription.length <= 160, `${c.slug}: description ${c.metaDescription.length}`);
    // The layout appends " | NODE by Nouvos" (17 characters). 75 leaves room for the existing city titles.
    assert.ok(c.metaTitle.length + 17 <= 75, `${c.slug}: title ${c.metaTitle.length + 17}`);
  }
});

test("copy uses the search brand and makes no claims the business does not offer", () => {
  const banned = [
    /N\.O\.D\.E\./, // the brand for search is "NODE by Nouvos"
    /runs the SEO/i, // SEO is an add-on, not part of every plan
    /unlimited revisions/i,
    /no (long )?contracts?/i,
    /24\/7/,
    /delivered in \d/i,
    /\bwe guarantee/i,
    /\bdiscount/i,
    /—|–/, // no em or en dashes
  ];
  for (const c of cities) {
    const text = allText(c);
    for (const re of banned) assert.doesNotMatch(text, re, `${c.slug}: ${re}`);
    for (const sentence of text.split(/(?<=[.?!])\s+/)) {
      if (/month[- ]to[- ]month/i.test(sentence)) {
        assert.match(sentence, /flexible|minimum|after/i, `${c.slug}: "${sentence}"`);
      }
    }
  }
});

test("work and guide links point at real pages", () => {
  for (const c of cities) {
    for (const w of c.work ?? []) assert.ok(workFor(w), `${c.slug}: work ${w}`);
    for (const g of c.guides ?? []) assert.ok(guideFor(g), `${c.slug}: guide ${g}`);
  }
});
