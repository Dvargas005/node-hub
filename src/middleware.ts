import { NextRequest, NextResponse } from "next/server";

const authPaths = ["/login", "/register", "/forgot-password", "/reset-password"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // NEVER intercept static assets.
  if (pathname.startsWith("/_next")) return NextResponse.next();
  if (pathname.startsWith("/favicon")) return NextResponse.next();
  if (pathname.startsWith("/img")) return NextResponse.next();
  if (pathname.includes(".")) return NextResponse.next();

  // API routes — pass through (auth checked in route handlers)
  if (pathname.startsWith("/api/")) return NextResponse.next();

  // Landing page — always public
  if (pathname === "/") return NextResponse.next();

  // Hidden Early Adopters landing — public (auth-aware in the page itself)
  if (pathname === "/early-adopters") return NextResponse.next();

  // Auth pages — always allow (cookie may be expired)
  if (authPaths.includes(pathname)) return NextResponse.next();

  // Production uses __Secure- prefix on HTTPS
  const sessionToken =
    req.cookies.get("better-auth.session_token")?.value ||
    req.cookies.get("__Secure-better-auth.session_token")?.value;

  // Protected routes: require auth
  if (!sessionToken) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If admin has view-as role cookie, allow access to all app routes
  // (the actual role check is done in server components/API routes)
  const viewAsRole = req.cookies.get("node-view-as-role")?.value;
  if (viewAsRole && viewAsRole !== "ADMIN") {
    // Admin impersonating — allow through to any app route
    return NextResponse.next();
  }

  return NextResponse.next();
}

// No matcher — middleware runs on ALL requests.
// Filtering is done in the function body above.
// This avoids Next.js 14 regex matcher bugs that cause 404s on static assets.
