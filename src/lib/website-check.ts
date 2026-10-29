/**
 * Free website check: fetches one public page and grades it on search basics,
 * AI-answer readiness (GEO / AEO), and speed.
 *
 * The URL comes from an anonymous visitor, so the fetcher is the dangerous part.
 * It must never reach our own network: every DNS answer is checked against the
 * private and reserved ranges INSIDE the socket's `lookup`, which is the address
 * the connection actually uses. Checking the hostname once and then calling
 * fetch() would be open to DNS rebinding (first answer public, second 127.0.0.1).
 * Redirects are followed by hand so each hop goes through the same check.
 */

import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import http from "node:http";
import https from "node:https";
import { isIP } from "node:net";
import zlib from "node:zlib";

const MAX_REDIRECTS = 4;
const TIMEOUT_MS = 10_000;
const MAX_HTML_BYTES = 2_000_000;
const MAX_AUX_BYTES = 300_000;
const USER_AGENT = "NODE-WebsiteCheck/1.0 (+https://www.nodedev.one/free-website-check)";

export class CheckInputError extends Error {}

// ---------------------------------------------------------------------------
// URL + address validation
// ---------------------------------------------------------------------------

/** Accepts "example.com" or a full URL; returns a normalized http(s) URL or throws CheckInputError. */
export function normalizeTargetUrl(raw: string): URL {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 2048) throw new CheckInputError("Enter a website address.");
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new CheckInputError("That does not look like a website address.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new CheckInputError("Only http and https addresses can be checked.");
  }
  if (url.username || url.password) throw new CheckInputError("Remove the username and password from the address.");
  if (url.port && url.port !== "80" && url.port !== "443") {
    throw new CheckInputError("Only standard web ports can be checked.");
  }
  const host = url.hostname.toLowerCase();
  if (isIP(host.replace(/^\[|\]$/g, ""))) throw new CheckInputError("Enter a domain name, not an IP address.");
  if (!host.includes(".") || /\.(local|localhost|internal|lan|home|corp)$/.test(host) || host === "localhost") {
    throw new CheckInputError("Enter a public domain name, like example.com.");
  }
  url.hash = "";
  return url;
}

function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}

const BLOCKED_V4: Array<[string, number]> = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 3], // multicast + reserved, through 255.255.255.255
];

/** True when an address is loopback, private, link-local, metadata, or otherwise not the public internet. */
export function isBlockedAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) {
    const n = ipv4ToInt(address);
    return BLOCKED_V4.some(([base, bits]) => {
      const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
      return (n & mask) === (ipv4ToInt(base) & mask);
    });
  }
  if (family === 6) {
    const a = address.toLowerCase();
    const mapped = a.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isBlockedAddress(mapped[1]);
    if (a === "::" || a === "::1") return true;
    if (/^f[cd]/.test(a)) return true; // fc00::/7 unique local
    if (/^fe[89ab]/.test(a)) return true; // fe80::/10 link-local
    if (/^ff/.test(a)) return true; // multicast
    if (a.startsWith("64:ff9b:") || a.startsWith("2001:db8:")) return true;
    return false;
  }
  return true;
}

type LookupCallback = (err: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void;

/** dns.lookup replacement used by the socket itself, so the checked address is the connected address. */
function safeLookup(hostname: string, options: object, callback: LookupCallback): void {
  dnsLookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, []);
    const list = addresses as LookupAddress[];
    if (list.length === 0 || list.some((a) => isBlockedAddress(a.address))) {
      const blocked: NodeJS.ErrnoException = new Error("Address not allowed");
      blocked.code = "EBLOCKED";
      return callback(blocked, []);
    }
    const wantsAll = (options as { all?: boolean }).all === true;
    if (wantsAll) return callback(null, list);
    callback(null, list[0].address, list[0].family);
  });
}

// ---------------------------------------------------------------------------
// Fetching
// ---------------------------------------------------------------------------

export interface FetchResult {
  url: string;
  status: number;
  headers: http.IncomingHttpHeaders;
  body: string;
  elapsedMs: number;
  bytes: number;
  truncated: boolean;
}

function requestOnce(url: URL, maxBytes: number): Promise<FetchResult> {
  const started = Date.now();
  const transport = url.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    const req = transport.request(
      url,
      {
        method: "GET",
        lookup: safeLookup as unknown as typeof dnsLookup,
        timeout: TIMEOUT_MS,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5",
          "Accept-Encoding": "gzip, deflate, br",
        },
      },
      (res) => {
        const encoding = String(res.headers["content-encoding"] ?? "").toLowerCase();
        const stream =
          encoding === "gzip"
            ? res.pipe(zlib.createGunzip())
            : encoding === "deflate"
              ? res.pipe(zlib.createInflate())
              : encoding === "br"
                ? res.pipe(zlib.createBrotliDecompress())
                : res;

        const chunks: Buffer[] = [];
        let bytes = 0;
        let truncated = false;
        const finish = () =>
          resolve({
            url: url.toString(),
            status: res.statusCode ?? 0,
            headers: res.headers,
            body: Buffer.concat(chunks).toString("utf8"),
            elapsedMs: Date.now() - started,
            bytes,
            truncated,
          });

        stream.on("data", (chunk: Buffer) => {
          bytes += chunk.length;
          if (bytes > maxBytes) {
            truncated = true;
            req.destroy();
            finish();
            return;
          }
          chunks.push(chunk);
        });
        stream.on("end", finish);
        stream.on("error", (err) => (truncated ? finish() : reject(err)));
      },
    );
    req.on("timeout", () => req.destroy(new Error("Timed out")));
    req.on("error", reject);
    req.end();
  });
}

/** GET with manual redirects; every hop is re-validated. */
export async function safeFetch(start: URL, maxBytes: number = MAX_HTML_BYTES): Promise<FetchResult> {
  let current = start;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await requestOnce(current, maxBytes);
    const location = res.headers.location;
    if (res.status >= 300 && res.status < 400 && location) {
      current = normalizeTargetUrl(new URL(location, current).toString());
      continue;
    }
    return res;
  }
  throw new CheckInputError("That site redirects too many times.");
}

// ---------------------------------------------------------------------------
// HTML helpers (regex on purpose: no parser dependency, and we only read the head)
// ---------------------------------------------------------------------------

function parseAttributes(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tag))) attrs[m[1].toLowerCase()] = m[3] ?? m[4] ?? m[5] ?? "";
  return attrs;
}

function tags(html: string, name: string): Array<Record<string, string>> {
  return Array.from(html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi")), (m) => parseAttributes(m[0]));
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function metaContent(metas: Array<Record<string, string>>, key: string): string | null {
  const hit = metas.find((m) => (m.name ?? m.property ?? "").toLowerCase() === key);
  return hit?.content !== undefined ? decodeEntities(hit.content) : null;
}

/**
 * schema.org has hundreds of LocalBusiness subtypes (ClothingStore, Plumber, Bakery...),
 * so a name list always misses some. A typed node that carries an address or phone is
 * a business description whatever its type is called.
 */
const BUSINESS_TYPE = /(Organization|Business|Service|Store|Shop|Corporation|Restaurant|Agency|Clinic|Office)$/;
const NON_ENTITY_TYPES = new Set(["WebSite", "WebPage", "PostalAddress", "GeoCoordinates", "ContactPoint", "BreadcrumbList", "ImageObject", "Offer"]);

function collectSchemaTypes(node: unknown, out: Set<string>, found: { business: boolean }): void {
  if (Array.isArray(node)) return node.forEach((n) => collectSchemaTypes(n, out, found));
  if (!node || typeof node !== "object") return;
  const obj = node as Record<string, unknown>;
  const t = obj["@type"];
  const own = typeof t === "string" ? [t] : Array.isArray(t) ? t.filter((x): x is string => typeof x === "string") : [];
  own.forEach((x) => out.add(x));
  if (own.some((x) => BUSINESS_TYPE.test(x))) found.business = true;
  if (own.some((x) => !NON_ENTITY_TYPES.has(x)) && (obj.address || obj.telephone)) found.business = true;
  for (const value of Object.values(obj)) if (value && typeof value === "object") collectSchemaTypes(value, out, found);
}

export function schemaTypes(html: string): { types: Set<string>; invalidBlocks: number; hasBusiness: boolean } {
  const types = new Set<string>();
  const found = { business: false };
  let invalidBlocks = 0;
  const re = /<script\b[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi;
  for (const m of Array.from(html.matchAll(re))) {
    try {
      collectSchemaTypes(JSON.parse(m[1]), types, found);
    } catch {
      invalidBlocks++;
    }
  }
  return { types, invalidBlocks, hasBusiness: found.business };
}

function visibleWordCount(html: string): number {
  const body = html.match(/<body\b[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? html;
  const text = body
    .replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  return decodeEntities(text).split(" ").filter((w) => /[a-z0-9]/i.test(w)).length;
}

/** Latest year in a copyright notice, same rule as Agents outreach `site_audit.py` so both tools agree. */
export function copyrightYear(html: string, today: Date = new Date()): number | null {
  const re = /(?:©|&copy;|&#169;|copyright)\s*(?:[^<\d]{0,40})?((?:19|20)\d{2})(?:\s*[-–]\s*((?:19|20)\d{2}))?/gi;
  const years: number[] = [];
  for (const m of Array.from(html.matchAll(re))) {
    const y = Number(m[2] ?? m[1]);
    if (y >= 1990 && y <= today.getFullYear()) years.push(y);
  }
  return years.length ? Math.max(...years) : null;
}

// ---------------------------------------------------------------------------
// robots.txt
// ---------------------------------------------------------------------------

export const AI_BOTS = ["GPTBot", "OAI-SearchBot", "ClaudeBot", "PerplexityBot", "Google-Extended"] as const;

/** Bots whose effective robots.txt group disallows the whole site. Most specific group wins, `*` otherwise. */
export function botsBlockedByRobots(robots: string, bots: readonly string[]): string[] {
  const groups: Array<{ agents: string[]; rules: string[] }> = [];
  let current: { agents: string[]; rules: string[] } | null = null;
  let lastWasAgent = false;

  for (const rawLine of robots.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*/, "").trim();
    const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const field = m[1].toLowerCase();
    const value = m[2].trim();
    if (field === "user-agent") {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else {
      if (current && (field === "disallow" || field === "allow")) current.rules.push(`${field}:${value}`);
      lastWasAgent = false;
    }
  }

  const blocksAll = (rules: string[]) =>
    rules.includes("disallow:/") && !rules.some((r) => r === "allow:/" || r === "allow:/*");

  return bots.filter((bot) => {
    const own = groups.find((g) => g.agents.includes(bot.toLowerCase()));
    const group = own ?? groups.find((g) => g.agents.includes("*"));
    return group ? blocksAll(group.rules.map((r) => r.replace(/\s+/g, ""))) : false;
  });
}

// ---------------------------------------------------------------------------
// The report
// ---------------------------------------------------------------------------

export type CheckStatus = "pass" | "warn" | "fail";
export type CheckGroup = "search" | "ai" | "speed";

export interface CheckItem {
  id: string;
  group: CheckGroup;
  status: CheckStatus;
  label: string;
  detail: string;
}

export interface CheckReport {
  url: string;
  finalUrl: string;
  score: number;
  groups: Record<CheckGroup, number>;
  items: CheckItem[];
}

export interface AuxFiles {
  robots: string | null;
  llms: boolean;
  sitemap: boolean;
  /** Google PageSpeed mobile performance score, 0-100; null when PageSpeed was unavailable. */
  pagespeedMobile: number | null;
}

const POINTS: Record<CheckStatus, number> = { pass: 1, warn: 0.5, fail: 0 };

function percent(items: CheckItem[]): number {
  if (items.length === 0) return 0;
  return Math.round((items.reduce((sum, i) => sum + POINTS[i.status], 0) / items.length) * 100);
}

function clip(s: string, n = 90): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

/** Pure grading step, separated from fetching so it can be tested without the network. */
export function gradePage(page: FetchResult, aux: AuxFiles, requestedUrl: string, today: Date = new Date()): CheckReport {
  const html = page.body;
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? html.slice(0, 200_000);
  const metas = tags(head, "meta");
  const links = tags(head, "link");
  const items: CheckItem[] = [];
  const add = (group: CheckGroup, id: string, status: CheckStatus, label: string, detail: string) =>
    items.push({ id, group, status, label, detail });

  // --- Search basics -------------------------------------------------------
  const finalUrl = new URL(page.url);
  add(
    "search",
    "https",
    finalUrl.protocol === "https:" ? "pass" : "fail",
    "Secure connection (HTTPS)",
    finalUrl.protocol === "https:"
      ? "The page loads over HTTPS."
      : "The page loads without HTTPS. Browsers mark it Not Secure and search engines rank it lower.",
  );

  const title = decodeEntities(head.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  add(
    "search",
    "title",
    !title ? "fail" : title.length < 15 || title.length > 65 ? "warn" : "pass",
    "Page title",
    !title
      ? "No title tag. This is the blue link people click in search results."
      : `"${clip(title)}" (${title.length} characters). ${
          title.length < 15 ? "Too short to say what you do and where." : title.length > 65 ? "Long titles get cut off in results; aim for 30 to 60 characters." : "Good length."
        }`,
  );

  const description = metaContent(metas, "description");
  add(
    "search",
    "description",
    !description ? "fail" : description.length < 70 || description.length > 170 ? "warn" : "pass",
    "Meta description",
    !description
      ? "No meta description, so search engines pick a random snippet from the page."
      : `${description.length} characters. ${description.length < 70 ? "Short; aim for 120 to 160." : description.length > 170 ? "Long; it will be cut off around 160." : "Good length."}`,
  );

  const h1Count = (html.match(/<h1\b/gi) ?? []).length;
  add(
    "search",
    "h1",
    h1Count === 1 ? "pass" : h1Count === 0 ? "fail" : "warn",
    "One main heading (H1)",
    h1Count === 1 ? "Exactly one H1." : h1Count === 0 ? "No H1 heading. The main heading tells search engines what the page is about." : `${h1Count} H1 headings. Use one for the page topic.`,
  );

  const robotsMeta = (metaContent(metas, "robots") ?? "").toLowerCase();
  const xRobots = String(page.headers["x-robots-tag"] ?? "").toLowerCase();
  const noindex = robotsMeta.includes("noindex") || xRobots.includes("noindex");
  add(
    "search",
    "indexable",
    noindex ? "fail" : "pass",
    "Allowed in search results",
    noindex ? "This page tells search engines not to index it (noindex). It will not show up in Google." : "Nothing on the page blocks indexing.",
  );

  const canonical = links.find((l) => (l.rel ?? "").toLowerCase().split(/\s+/).includes("canonical"))?.href;
  add(
    "search",
    "canonical",
    canonical ? "pass" : "warn",
    "Canonical URL",
    canonical ? `Points to ${clip(canonical, 70)}.` : "No canonical tag. Duplicate versions of the page (with and without www, tracking links) can split ranking.",
  );

  const hasOg = Boolean(metaContent(metas, "og:title") && metaContent(metas, "og:image"));
  add(
    "search",
    "og",
    hasOg ? "pass" : "warn",
    "Social sharing preview",
    hasOg ? "Open Graph title and image are set." : "Missing Open Graph title or image, so links shared on Facebook, LinkedIn, or iMessage show a blank or random preview.",
  );

  // --- AI answers (GEO / AEO) ---------------------------------------------
  const { types, invalidBlocks, hasBusiness } = schemaTypes(html);
  add(
    "ai",
    "schema",
    types.size === 0 ? "fail" : invalidBlocks > 0 ? "warn" : "pass",
    "Structured data (schema.org)",
    types.size === 0
      ? invalidBlocks > 0
        ? "Structured data is present but broken (invalid JSON), so nothing can read it."
        : "No structured data. This is how search engines and AI assistants read your business facts reliably."
      : `Found: ${clip(Array.from(types).slice(0, 6).join(", "), 80)}.${invalidBlocks ? ` ${invalidBlocks} block(s) are invalid JSON.` : ""}`,
  );
  add(
    "ai",
    "business-schema",
    hasBusiness ? "pass" : "fail",
    "Business identity markup",
    hasBusiness
      ? "Your business is described as an Organization or LocalBusiness."
      : "No Organization or LocalBusiness markup. AI assistants have to guess your name, address, phone, and hours.",
  );
  add(
    "ai",
    "faq",
    types.has("FAQPage") || types.has("QAPage") ? "pass" : "warn",
    "Question-and-answer content",
    types.has("FAQPage") || types.has("QAPage")
      ? "FAQ markup found. Direct answers are what assistants quote."
      : "No FAQ markup on this page. Short question-and-answer sections are the easiest content for AI assistants and voice search to quote.",
  );

  if (aux.robots === null) {
    add("ai", "ai-crawlers", "pass", "AI assistants can read the site", "No robots.txt, so nothing blocks ChatGPT, Claude, Perplexity, or Gemini.");
  } else {
    const blocked = botsBlockedByRobots(aux.robots, AI_BOTS);
    add(
      "ai",
      "ai-crawlers",
      blocked.length === 0 ? "pass" : blocked.length === AI_BOTS.length ? "fail" : "warn",
      "AI assistants can read the site",
      blocked.length === 0
        ? "robots.txt does not block the major AI crawlers."
        : `robots.txt blocks ${blocked.join(", ")}. Blocked assistants cannot cite you in their answers.`,
    );
  }

  const words = visibleWordCount(html);
  add(
    "ai",
    "rendered-text",
    words >= 250 ? "pass" : words >= 80 ? "warn" : "fail",
    "Readable without JavaScript",
    words >= 250
      ? `About ${words} words are in the raw HTML.`
      : `Only about ${words} words are in the raw HTML. Most AI crawlers do not run JavaScript, so content loaded by scripts is invisible to them.`,
  );

  add(
    "ai",
    "llms",
    aux.llms ? "pass" : "warn",
    "llms.txt summary",
    aux.llms
      ? "An llms.txt file is published."
      : "No /llms.txt. It is a short plain-text summary of your business for AI systems. Optional today, cheap to add.",
  );

  add(
    "ai",
    "sitemap",
    aux.sitemap ? "pass" : "warn",
    "XML sitemap",
    aux.sitemap ? "A sitemap was found." : "No sitemap found at /sitemap.xml or in robots.txt, so crawlers have to discover pages on their own.",
  );

  // --- Speed and mobile ----------------------------------------------------
  const viewport = metaContent(metas, "viewport");
  add(
    "speed",
    "viewport",
    viewport && /width\s*=\s*device-width/i.test(viewport) ? "pass" : "fail",
    "Mobile friendly viewport",
    viewport && /width\s*=\s*device-width/i.test(viewport)
      ? "The page is set up to fit phone screens."
      : "No mobile viewport tag. On phones the page renders as a shrunken desktop site.",
  );

  add(
    "speed",
    "response",
    page.elapsedMs <= 800 ? "pass" : page.elapsedMs <= 2000 ? "warn" : "fail",
    "Server response time",
    `The page took ${(page.elapsedMs / 1000).toFixed(1)}s to download from our checker. ${
      page.elapsedMs <= 800 ? "Fast." : page.elapsedMs <= 2000 ? "Slower than ideal; under 0.8s is the goal." : "Slow. Visitors on phones leave before it loads."
    }`,
  );

  if (aux.pagespeedMobile !== null) {
    const psi = aux.pagespeedMobile;
    add(
      "speed",
      "pagespeed",
      psi >= 70 ? "pass" : psi >= 50 ? "warn" : "fail",
      "Google PageSpeed (mobile)",
      `Google scores this page ${psi}/100 for performance on a phone. ${psi >= 90 ? "Excellent." : psi >= 70 ? "Acceptable." : "Slow pages lose visitors and rank lower on mobile."}`,
    );
  }

  const hasTel = /href\s*=\s*["']tel:/i.test(html);
  add(
    "speed",
    "tel",
    hasTel ? "pass" : "warn",
    "Tap to call",
    hasTel ? "The phone number is a tap-to-call link." : "No tap-to-call link. On a phone, visitors have to copy your number by hand.",
  );

  const year = copyrightYear(html, today);
  if (year !== null) {
    const stale = year <= today.getFullYear() - 3;
    add(
      "speed",
      "copyright",
      stale ? "warn" : "pass",
      "Site looks maintained",
      stale ? `The footer copyright still says ${year}. Visitors read that as a business that may have closed.` : `Copyright notice is current (${year}).`,
    );
  }

  const kb = Math.round(page.bytes / 1024);
  add(
    "speed",
    "weight",
    page.truncated || kb > 600 ? "warn" : "pass",
    "HTML size",
    page.truncated ? "The HTML is over 2 MB, which is very heavy." : `${kb} KB of HTML.${kb > 600 ? " Heavy; large inline scripts or data slow the first paint." : ""}`,
  );

  const imgs = tags(html, "img");
  const missingAlt = imgs.filter((i) => i.alt === undefined).length;
  add(
    "speed",
    "alt",
    imgs.length === 0 || missingAlt === 0 ? "pass" : missingAlt / imgs.length > 0.3 ? "fail" : "warn",
    "Image descriptions (alt text)",
    imgs.length === 0
      ? "No images in the HTML."
      : missingAlt === 0
        ? `All ${imgs.length} images have alt text.`
        : `${missingAlt} of ${imgs.length} images have no alt text. Screen readers and image search skip them.`,
  );

  const byGroup = (g: CheckGroup) => items.filter((i) => i.group === g);
  return {
    url: requestedUrl,
    finalUrl: page.url,
    score: percent(items),
    groups: { search: percent(byGroup("search")), ai: percent(byGroup("ai")), speed: percent(byGroup("speed")) },
    items,
  };
}

/**
 * Google PageSpeed Insights, mobile performance only. Optional enrichment: it takes
 * 10-40s and has a small keyless quota, so any failure just drops the item.
 * Set GOOGLE_PAGESPEED_API_KEY in production for the real quota.
 */
async function pagespeedMobileScore(url: string): Promise<number | null> {
  const params = new URLSearchParams({ url, strategy: "mobile", category: "performance" });
  if (process.env.GOOGLE_PAGESPEED_API_KEY) params.set("key", process.env.GOOGLE_PAGESPEED_API_KEY);
  try {
    const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`, {
      signal: AbortSignal.timeout(45_000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { lighthouseResult?: { categories?: { performance?: { score?: number | null } } } };
    const score = json.lighthouseResult?.categories?.performance?.score;
    return typeof score === "number" ? Math.round(score * 100) : null;
  } catch {
    return null;
  }
}

async function fetchAux(url: URL): Promise<FetchResult | null> {
  try {
    const res = await safeFetch(url, MAX_AUX_BYTES);
    return res.status === 200 ? res : null;
  } catch {
    return null;
  }
}

/** Full check: fetch the page, then robots.txt, llms.txt, and sitemap.xml on the final origin. */
export async function runWebsiteCheck(rawUrl: string): Promise<CheckReport> {
  const target = normalizeTargetUrl(rawUrl);
  const page = await safeFetch(target);
  if (page.status >= 400) {
    throw new CheckInputError(`The site answered with an error (HTTP ${page.status}). Check the address and try again.`);
  }
  const contentType = String(page.headers["content-type"] ?? "");
  if (contentType && !/html/i.test(contentType)) {
    throw new CheckInputError("That address is not a web page.");
  }

  const origin = new URL(page.url).origin;
  const [robots, llms, sitemap, pagespeedMobile] = await Promise.all([
    fetchAux(new URL("/robots.txt", origin)),
    fetchAux(new URL("/llms.txt", origin)),
    fetchAux(new URL("/sitemap.xml", origin)),
    pagespeedMobileScore(page.url),
  ]);
  // Soft 404s: many hosts answer 200 with an HTML page for any path.
  const isText = (r: FetchResult | null) => Boolean(r && !/^\s*<(!doctype|html)/i.test(r.body));
  const robotsText = isText(robots) ? robots!.body : null;

  return gradePage(
    page,
    {
      robots: robotsText,
      llms: isText(llms),
      sitemap: (sitemap !== null && /<(urlset|sitemapindex)\b/i.test(sitemap.body)) || /^\s*sitemap\s*:/im.test(robotsText ?? ""),
      pagespeedMobile,
    },
    target.toString(),
  );
}
