import { test } from "node:test";
import assert from "node:assert/strict";
import { GUIDES } from "./guide-content";
import { sitemapPaths } from "./sitemap-paths";

const allText = (g: (typeof GUIDES)[number]) =>
  [
    g.title,
    g.metaTitle,
    g.metaDescription,
    g.answer,
    ...g.sections.flatMap((s) => [
      s.heading,
      ...s.paragraphs,
      ...(s.bullets ?? []),
      ...(s.table ? [s.table.caption, ...s.table.columns, ...s.table.rows.flat()] : []),
    ]),
    ...g.faqs.flatMap((f) => [f.q, f.a]),
  ].join("\n");

test("slugs are unique", () => {
  const slugs = GUIDES.map((g) => g.slug);
  assert.equal(new Set(slugs).size, slugs.length);
});

test("meta fits in search results", () => {
  for (const g of GUIDES) {
    assert.ok(g.metaDescription.length <= 160, `${g.slug}: description ${g.metaDescription.length}`);
    // The layout appends " | NODE by Nouvos" (17 characters).
    assert.ok(g.metaTitle.length + 17 <= 75, `${g.slug}: title ${g.metaTitle.length + 17}`);
  }
});

test("dates are valid and published is not after updated", () => {
  for (const g of GUIDES) {
    assert.match(g.published, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(g.updated, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(g.published <= g.updated, g.slug);
  }
});

test("copy never makes claims the business does not offer", () => {
  const banned = [
    /unlimited revisions/i,
    /no (long )?contracts?/i,
    /24\/7/,
    /delivered in \d/i,
    /\bwe guarantee/i,
    /guaranteed (rankings?|mentions?|#1)/i,
    /\bdiscount/i,
    /\u2014|\u2013/, // no em or en dashes
  ];
  for (const g of GUIDES) {
    const text = allText(g);
    for (const re of banned) assert.doesNotMatch(text, re, `${g.slug}: ${re}`);
    // "Month to month" is only true after a minimum term (the Flexible rate, or any plan after its term).
    for (const sentence of text.split(/(?<=[.?!])\s+/)) {
      if (/month[- ]to[- ]month/i.test(sentence)) {
        assert.match(sentence, /flexible|minimum|after/i, `${g.slug}: "${sentence}"`);
      }
    }
  }
});

test("related links point at real pages", () => {
  const known = new Set(sitemapPaths().map((p) => p.path));
  for (const g of GUIDES) {
    for (const r of g.related) assert.ok(known.has(r.href), `${g.slug}: ${r.href}`);
  }
});
