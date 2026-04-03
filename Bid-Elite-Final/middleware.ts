import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const withAuthMiddleware = withAuth({
  pages: {
    signIn: "/login",
  },
});

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Portal pricing pages — public (code-based auth, no session needed)
  if (pathname === "/portal/pricing" || pathname.startsWith("/portal/pricing/")) {
    return NextResponse.next();
  }

  // Portal authenticated pages — require portal_session cookie
  if (
    pathname.startsWith("/portal/dashboard") ||
    pathname.startsWith("/portal/profile") ||
    pathname.startsWith("/portal/quotes")
  ) {
    const portalToken = req.cookies.get("portal_session")?.value;
    if (portalToken) return NextResponse.next();

    const loginUrl = new URL("/portal/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Portal public pages — login, register, token-based access
  if (
    pathname.startsWith("/portal/login") ||
    pathname.startsWith("/portal/register") ||
    pathname === "/portal" ||
    pathname.match(/^\/portal\/[a-f0-9-]+/)
  ) {
    return NextResponse.next();
  }

  // Auth pages — redirect to home if already logged in
  if (
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password"
  ) {
    const sessionToken =
      req.cookies.get("next-auth.session-token")?.value ||
      req.cookies.get("__Secure-next-auth.session-token")?.value;
    if (sessionToken) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // Everything else — require admin auth
  // @ts-expect-error -- next-auth middleware type mismatch
  return withAuthMiddleware(req as any) as Promise<NextResponse>;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/portal|api/auth).*)",
  ],
};
