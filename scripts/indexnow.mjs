#!/usr/bin/env node
/**
 * IndexNow ping: tells Bing (and Yandex, Seznam, Naver, which share the
 * protocol) about changed URLs right away instead of waiting for a crawl.
 *
 * Runs after every successful production deploy via
 * .github/workflows/indexnow.yml, and can be run by hand:
 *
 *   node scripts/indexnow.mjs              # URLs changed in the last 3 days
 *   node scripts/indexnow.mjs --all        # every URL in the sitemap
 *   node scripts/indexnow.mjs --since-days=14
 *   node scripts/indexnow.mjs --dry-run    # print what would be sent
 *
 * Which URLs are sent:
 * - Sitemap entries whose <lastmod> falls inside the window.
 * - If the sitemap has no <lastmod> at all, every URL (small sites only; do
 *   not rely on this for large sitemaps).
 * Only URLs listed in the sitemap are sent. The bare origin is not added: on
 * sites where "/" redirects (e.g. to a locale), pinging it wastes the request.
 *
 * The key is public by design: IndexNow proves ownership by fetching
 * SITE/KEY.txt and comparing it to the key in the request, so the file in
 * public/ must stay deployed or every ping fails with 403.
 */

// ---- per-site config -------------------------------------------------------
const SITE = "https://www.nodedev.one";
const KEY = "a559a3c4e7e7d9ed3efced68f9f4e9d1";
// ----------------------------------------------------------------------------

const ENDPOINT = "https://api.indexnow.org/indexnow";
const MAX_URLS_PER_REQUEST = 10_000;

const args = process.argv.slice(2);
const ALL = args.includes("--all");
const DRY_RUN = args.includes("--dry-run");
const sinceArg = args.find((a) => a.startsWith("--since-days="));
const SINCE_DAYS = sinceArg ? Number(sinceArg.split("=")[1]) : 3;

const host = new URL(SITE).host;

async function fetchText(url) {
  const res = await fetch(url, { redirect: "follow", headers: { "user-agent": "indexnow-ping" } });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.text();
}

/** Returns [{ loc, lastmod|null }], following one level of <sitemapindex>. */
async function readSitemap(url) {
  const xml = await fetchText(url);
  if (/<sitemapindex[\s>]/.test(xml)) {
    const children = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
    const nested = await Promise.all(children.map(readSitemap));
    return nested.flat();
  }
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, block]) => ({
    loc: block.match(/<loc>\s*([^<\s]+)\s*<\/loc>/)?.[1] ?? null,
    lastmod: block.match(/<lastmod>\s*([^<\s]+)\s*<\/lastmod>/)?.[1] ?? null,
  })).filter((e) => e.loc);
}

function selectUrls(entries) {
  const anyLastmod = entries.some((e) => e.lastmod);
  const cutoff = Date.now() - SINCE_DAYS * 24 * 60 * 60 * 1000;
  const picked = new Set();
  for (const e of entries) {
    if (ALL || !anyLastmod) picked.add(e.loc);
    else if (e.lastmod && Date.parse(e.lastmod) >= cutoff) picked.add(e.loc);
  }
  const urls = [...picked].filter((u) => {
    const ok = new URL(u).host === host;
    if (!ok) console.warn(`  skip (other host): ${u}`);
    return ok;
  });
  return { urls, mode: ALL ? "all" : anyLastmod ? `lastmod within ${SINCE_DAYS}d` : "all (sitemap has no lastmod)" };
}

async function main() {
  console.log(`IndexNow: ${SITE}`);

  // A missing key file makes IndexNow answer 403; fail with a clear reason first.
  const keyLocation = `${SITE}/${KEY}.txt`;
  const served = (await fetchText(keyLocation)).trim();
  if (served !== KEY) throw new Error(`${keyLocation} does not contain the key; is public/${KEY}.txt deployed?`);

  const entries = await readSitemap(`${SITE}/sitemap.xml`);
  const { urls, mode } = selectUrls(entries);
  console.log(`  sitemap: ${entries.length} URLs, sending ${urls.length} (${mode})`);
  if (urls.length === 0) {
    console.log("  nothing changed in the window; no ping sent");
    return;
  }

  if (DRY_RUN) {
    urls.forEach((u) => console.log(`  ${u}`));
    return;
  }

  for (let i = 0; i < urls.length; i += MAX_URLS_PER_REQUEST) {
    const urlList = urls.slice(i, i + MAX_URLS_PER_REQUEST);
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host, key: KEY, keyLocation, urlList }),
    });
    // 200 = accepted, 202 = accepted, key validation pending.
    if (res.status !== 200 && res.status !== 202) {
      throw new Error(`IndexNow ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }
    console.log(`  batch ${i / MAX_URLS_PER_REQUEST + 1}: ${urlList.length} URLs -> ${res.status}`);
  }
}

main().catch((err) => {
  console.error(`IndexNow failed: ${err.message}`);
  process.exit(1);
});
