import { NextRequest, NextResponse } from "next/server";

const publicPaths = [
  "/",
  "/api/auth",
  "/api/stripe/webhook",
  "/api/ping",
  "/api/waitlist",
  "/api/alliance",
  "/api/register",
  "/api/onboarding",
];

const authPaths = ["/login", "/register"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // NEVER intercept static assets or Next.js internals
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/img/") ||
    pathname.startsWith("/api/auth") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".js") ||
    pathname.endsWith(".map") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".woff") ||
    pathname.endsWith(".woff2")
  ) {
    return NextResponse.next();
  }

  // Allow public paths
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const sessionToken = req.cookies.get("better-auth.session_token")?.value;

  // Auth pages: redirect to dashboard if already authenticated
  if (authPaths.includes(pathname)) {
    if (sessionToken) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Protected routes: require auth
  if (!sessionToken) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Only run middleware on page routes, not static assets.
     * Matches: /dashboard, /login, /admin/overview, etc.
     * Skips: /_next/*, /favicon.ico, /img/*, any file with extension
     */
    "/((?!_next|favicon\\.ico|img|api/auth).*)",
  ],
};
