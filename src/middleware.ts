import { NextRequest, NextResponse } from "next/server";
import { routeAccess } from "@/lib/route-access";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // NEVER intercept static assets.
  if (pathname.startsWith("/_next")) return NextResponse.next();
  if (pathname.startsWith("/favicon")) return NextResponse.next();
  if (pathname.startsWith("/img")) return NextResponse.next();
  if (pathname.includes(".")) return NextResponse.next();

  // Only the logged-in app is gated (src/lib/route-access.ts). Everything else,
  // including paths that do not exist, goes to Next so a missing page is a real
  // 404 instead of a redirect to /login. API routes check auth in each handler.
  if (routeAccess(pathname) === "public") return NextResponse.next();

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
