import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("mcq_session_token")?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password");

  const isDashboardPage =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/questions") ||
    pathname.startsWith("/topics") ||
    pathname.startsWith("/quiz") ||
    pathname.startsWith("/ai") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/settings");

  // If user has no session and tries to access dashboard, redirect to login
  if (!token && isDashboardPage) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If user is already logged in and visits auth page, redirect to dashboard
  if (token && isAuthPage) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/questions/:path*",
    "/topics/:path*",
    "/quiz/:path*",
    "/ai/:path*",
    "/analytics/:path*",
    "/settings/:path*",
    "/login",
    "/signup",
    "/forgot-password",
  ],
};
