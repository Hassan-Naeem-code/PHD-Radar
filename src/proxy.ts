import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // CSRF protection for mutating API requests
  if (
    pathname.startsWith("/api/") &&
    ["POST", "PUT", "DELETE", "PATCH"].includes(request.method)
  ) {
    // Skip CSRF for auth endpoints and webhooks
    const skipCsrf =
      pathname.startsWith("/api/auth/") ||
      pathname.startsWith("/api/webhooks/") ||
      pathname.startsWith("/api/notifications/");

    if (!skipCsrf) {
      const origin = request.headers.get("origin");
      const host = request.headers.get("host");

      if (origin && host) {
        try {
          const originHost = new URL(origin).host;
          if (originHost !== host) {
            return Response.json(
              { success: false, error: { code: "CSRF_FAILED", message: "Cross-origin request blocked" } },
              { status: 403 }
            );
          }
        } catch {
          return Response.json(
            { success: false, error: { code: "CSRF_FAILED", message: "Invalid origin" } },
            { status: 403 }
          );
        }
      }
    }
  }

  // Auth protection for dashboard routes
  const protectedPaths = [
    "/dashboard", "/discover", "/professors", "/outreach",
    "/applications", "/papers", "/profile", "/settings",
    "/admin", "/onboarding", "/implement-paper",
  ];

  const isProtected = protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (isProtected) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/discover/:path*",
    "/professors/:path*",
    "/outreach/:path*",
    "/applications/:path*",
    "/papers/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/onboarding/:path*",
    "/implement-paper/:path*",
    "/api/:path*",
  ],
};
