import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { PROTECTED_SEGMENTS, PUBLIC_SEGMENTS, routeAccess } from "./route-access";

const APP_DIR = join(__dirname, "..", "app");

/** Top-level URL segments that src/app serves, with (route groups) flattened. */
function topLevelSegments(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith("_")) continue;
    if (entry.name.startsWith("(")) out.push(...topLevelSegments(join(dir, entry.name)));
    else out.push(entry.name);
  }
  return out;
}

test("every top-level folder in src/app is classified public or protected", () => {
  const known = new Set<string>([...PUBLIC_SEGMENTS, ...PROTECTED_SEGMENTS]);
  const unclassified = topLevelSegments(APP_DIR).filter((s) => !known.has(s));
  assert.deepEqual(
    unclassified,
    [],
    `Add these to PROTECTED_SEGMENTS (logged-in app) or PUBLIC_SEGMENTS in src/lib/route-access.ts: ${unclassified.join(", ")}`,
  );
});

test("no segment is both public and protected", () => {
  const pub = new Set<string>(PUBLIC_SEGMENTS);
  assert.deepEqual(PROTECTED_SEGMENTS.filter((s) => pub.has(s)), []);
});

test("app routes need a session", () => {
  for (const p of [
    "/dashboard",
    "/admin",
    "/admin/overview",
    "/billing",
    "/messages",
    "/onboarding",
    "/request",
    "/settings",
    "/tickets",
    "/tickets/abc123",
    "/freelancer/portal",
    "/dashboard/",
  ]) {
    assert.equal(routeAccess(p), "protected", p);
  }
});

test("encoded or odd-cased app paths are still gated", () => {
  assert.equal(routeAccess("/%64ashboard"), "protected");
  assert.equal(routeAccess("/%61dmin/overview"), "protected");
  assert.equal(routeAccess("/Dashboard"), "protected");
  assert.equal(routeAccess("//dashboard"), "protected");
  assert.equal(routeAccess("/%E0%A4%A"), "protected"); // malformed escape
});

test("marketing pages, auth pages, and unknown paths fall through to Next", () => {
  for (const p of [
    "/",
    "/about",
    "/contact",
    "/pricing",
    "/services/seo",
    "/locations/chicago-il",
    "/work/wecl",
    "/industries/logistics",
    "/free-website-check",
    "/terms",
    "/login",
    "/register",
    "/sign-agreement/tok",
    "/does-not-exist",
    "/servicesX",
    "/dashboards", // not an app route: 404, not a login wall
  ]) {
    assert.equal(routeAccess(p), "public", p);
  }
});
