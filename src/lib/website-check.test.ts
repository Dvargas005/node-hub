import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AI_BOTS,
  CheckInputError,
  botsBlockedByRobots,
  copyrightYear,
  gradePage,
  isBlockedAddress,
  normalizeTargetUrl,
  schemaTypes,
  type FetchResult,
} from "./website-check";

// Run with: npx tsx --test src/lib/website-check.test.ts

test("private, loopback, link-local, and metadata addresses are blocked", () => {
  for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "::", "fd00::1", "fe80::1", "::ffff:127.0.0.1", "::ffff:10.0.0.1", "224.0.0.1", "255.255.255.255"]) {
    assert.equal(isBlockedAddress(ip), true, ip);
  }
});

test("public addresses are allowed", () => {
  for (const ip of ["8.8.8.8", "76.76.21.21", "172.32.0.1", "2606:4700:4700::1111", "::ffff:8.8.8.8"]) {
    assert.equal(isBlockedAddress(ip), false, ip);
  }
});

test("bare domains get https and a path", () => {
  assert.equal(normalizeTargetUrl("example.com").toString(), "https://example.com/");
  assert.equal(normalizeTargetUrl("  http://Example.com/about#x ").toString(), "http://example.com/about");
});

test("unsafe or non-web URLs are rejected before any request", () => {
  for (const bad of ["", "localhost", "http://localhost:3000", "http://127.0.0.1", "http://[::1]/", "file:///etc/passwd", "ftp://example.com", "http://user:pw@example.com", "http://example.com:8080", "printer.local", "intranet"]) {
    assert.throws(() => normalizeTargetUrl(bad), CheckInputError, bad);
  }
});

test("robots.txt: most specific group wins", () => {
  const robots = "User-agent: *\nDisallow: /admin\n\nUser-agent: GPTBot\nUser-agent: ClaudeBot\nDisallow: /\n";
  assert.deepEqual(botsBlockedByRobots(robots, AI_BOTS), ["GPTBot", "ClaudeBot"]);
  assert.deepEqual(botsBlockedByRobots("User-agent: *\nDisallow: /\n", ["GPTBot"]), ["GPTBot"]);
  assert.deepEqual(botsBlockedByRobots("User-agent: *\nDisallow: /\n\nUser-agent: GPTBot\nAllow: /\n", ["GPTBot"]), []);
  assert.deepEqual(botsBlockedByRobots("User-agent: *\nDisallow:\n", ["GPTBot"]), []);
});

test("copyright year picks the latest year in a range", () => {
  const today = new Date("2026-10-29");
  assert.equal(copyrightYear("<p>&copy; 2019 - 2022 Acme</p>", today), 2022);
  assert.equal(copyrightYear("<p>No notice</p>", today), null);
});

function page(html: string, overrides: Partial<FetchResult> = {}): FetchResult {
  return { url: "https://example.com/", status: 200, headers: {}, body: html, elapsedMs: 300, bytes: html.length, truncated: false, ...overrides };
}

const GOOD = `<!doctype html><html lang="en"><head>
<title>Acme Plumbing in Evanston, IL | Acme</title>
<meta name="description" content="Licensed plumbers serving Evanston and the North Shore. Same-week repairs, water heaters, and drain cleaning for homes and small businesses.">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="canonical" href="https://example.com/">
<meta property="og:title" content="Acme"><meta property="og:image" content="/og.png">
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Plumber"},{"@type":"LocalBusiness"},{"@type":"FAQPage"}]}</script>
</head><body><h1>Acme</h1><a href="tel:+15555555555">Call</a><p>${"word ".repeat(300)}</p><img src="a.png" alt="x"><footer>&copy; 2026 Acme</footer></body></html>`;

test("a well-built page scores high with no failures", () => {
  const report = gradePage(page(GOOD), { robots: "User-agent: *\nAllow: /\n", llms: true, sitemap: true, pagespeedMobile: 92 }, "https://example.com/", new Date("2026-10-29"));
  assert.deepEqual(report.items.filter((i) => i.status === "fail").map((i) => i.id), []);
  assert.ok(report.score >= 95, `score ${report.score}`);
});

test("a bare page fails the basics and AI checks", () => {
  const report = gradePage(page("<html><head></head><body><div id=root></div></body></html>", { url: "http://example.com/" }), { robots: "User-agent: *\nDisallow: /\n", llms: false, sitemap: false, pagespeedMobile: null }, "http://example.com/");
  const failed = new Set(report.items.filter((i) => i.status === "fail").map((i) => i.id));
  for (const id of ["https", "title", "description", "h1", "schema", "business-schema", "ai-crawlers", "rendered-text", "viewport"]) {
    assert.ok(failed.has(id), id);
  }
  assert.equal(report.items.some((i) => i.id === "pagespeed"), false);
  assert.ok(report.score < 45, `score ${report.score}`);
});

test("noindex in a header is caught", () => {
  const report = gradePage(page(GOOD, { headers: { "x-robots-tag": "noindex" } }), { robots: null, llms: false, sitemap: false, pagespeedMobile: null }, "https://example.com/");
  assert.equal(report.items.find((i) => i.id === "indexable")?.status, "fail");
});

test("any LocalBusiness subtype counts as business markup", () => {
  assert.equal(schemaTypes('<script type="application/ld+json">{"@type":"ClothingStore","name":"W.A.R."}</script>').hasBusiness, true);
  assert.equal(schemaTypes('<script type="application/ld+json">{"@type":"Plumber","telephone":"+1-555"}</script>').hasBusiness, true);
  assert.equal(schemaTypes('<script type="application/ld+json">{"@type":"WebSite","name":"x"}</script>').hasBusiness, false);
});
