import { test } from "node:test";
import assert from "node:assert/strict";
import { sitemapPaths } from "./sitemap-paths";
import { PAGE_UPDATED } from "./page-dates";

test("every sitemap URL has a last-updated date", () => {
  const missing = sitemapPaths()
    .map((p) => p.path)
    .filter((path) => !PAGE_UPDATED[path]);
  assert.deepEqual(missing, [], `Add these paths to PAGE_UPDATED in src/lib/page-dates.ts: ${missing.join(", ")}`);
});

test("dates are real calendar days, not in the future", () => {
  const tomorrow = Date.now() + 24 * 60 * 60 * 1000;
  for (const [path, d] of Object.entries(PAGE_UPDATED)) {
    assert.match(d, /^\d{4}-\d{2}-\d{2}$/, path);
    const t = Date.parse(`${d}T00:00:00Z`);
    assert.ok(!Number.isNaN(t), `${path}: ${d}`);
    assert.ok(t <= tomorrow, `${path}: ${d} is in the future`);
  }
});

test("no date for a page that is not in the sitemap", () => {
  const listed = new Set(sitemapPaths().map((p) => p.path));
  const orphans = Object.keys(PAGE_UPDATED).filter((p) => !listed.has(p));
  assert.deepEqual(orphans, []);
});
