/**
 * Which paths need a session. Read by src/middleware.ts.
 *
 * The app used to gate every path that was not on a public allow list, so a
 * URL that does not exist (/about, /contact, a typo, an old link) answered
 * with a 307 to /login instead of a 404. Google counted those as redirects to
 * a robots-blocked page, and AI assistants that guess /contact hit a login wall.
 *
 * Now only the app's own route trees are gated and everything else falls
 * through to Next, which renders the page or the 404. The cost is that a NEW
 * app route is public until it is listed here. route-access.test.ts fails if
 * any top-level folder in src/app is not classified, so that cannot slip by.
 */

/** First path segments of the logged-in app: (admin), (client), (freelancer). */
export const PROTECTED_SEGMENTS = [
  "admin",
  "billing",
  "dashboard",
  "freelancer",
  "messages",
  "onboarding",
  "request",
  "settings",
  "tickets",
] as const;

/**
 * First path segments that are public on purpose. Not read by the middleware
 * (anything unlisted is public); it exists so the test can prove every folder
 * in src/app was classified by a person rather than defaulted.
 */
export const PUBLIC_SEGMENTS = [
  "", // landing page
  "about",
  "api", // auth is checked in each route handler
  "contact",
  "dedicated",
  "early-adopters",
  "forgot-password",
  "free-website-check",
  "guides",
  "industries",
  "locations",
  "login",
  "pricing",
  "register",
  "reset-password",
  "services",
  "sign-agreement", // token-gated in the page and API
  "terms",
  "work",
] as const;

const PROTECTED = new Set<string>(PROTECTED_SEGMENTS);

function firstSegment(pathname: string): string {
  return pathname.replace(/^\/+/, "").split("/")[0] ?? "";
}

/**
 * "protected" when the path belongs to the logged-in app, else "public".
 *
 * Checks the raw and the percent-decoded path: Next decodes before routing, so
 * "/%64ashboard" must be gated exactly like "/dashboard". A path that does not
 * decode is treated as protected rather than guessed at.
 */
export function routeAccess(pathname: string): "public" | "protected" {
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return "protected";
  }
  for (const p of [pathname, decoded]) {
    if (PROTECTED.has(firstSegment(p).toLowerCase())) return "protected";
  }
  return "public";
}
