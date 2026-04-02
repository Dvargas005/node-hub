import { NextRequest, NextResponse } from "next/server";

const publicPaths = [
  "/",
  "/api/auth",
  "/api/stripe/webhook",
  "/api/ping",
  "/api/waitlist",
  "/api/alliance",
  "/api/register",
];

const authPaths = ["/login", "/register"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
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

  // Role-based access is enforced at the layout/page level
  // since middleware can't decode the session without a DB call.
  // The middleware just ensures a session cookie exists.

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
