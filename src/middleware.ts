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

  // NEVER intercept static assets.
  if (pathname.startsWith("/_next")) return NextResponse.next();
  if (pathname.startsWith("/favicon")) return NextResponse.next();
  if (pathname.startsWith("/img")) return NextResponse.next();
  if (pathname.includes(".")) return NextResponse.next();

  // API routes — pass through (auth checked in route handlers)
  if (pathname.startsWith("/api/")) return NextResponse.next();

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

// No matcher — middleware runs on ALL requests.
// Filtering is done in the function body above.
// This avoids Next.js 14 regex matcher bugs that cause 404s on static assets.
