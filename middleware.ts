import { type NextRequest, NextResponse } from "next/server";
import {
  getHomeRouteForRole,
  isPathAllowedForRole,
  type UserRole,
} from "@/lib/auth/roles";

/**
 * Rotas públicas que não requerem autenticação
 */
const PUBLIC_PATHS = [
  "/",
  "/auth/signin",
  "/auth/signup",
  "/invite",
  "/therapist-invite",
];

/**
 * Verifica se o path é público
 */
function isPublicPath(path: string): boolean {
  if (
    PUBLIC_PATHS.some(
      (publicPath) => path === publicPath || path.startsWith(`${publicPath}/`)
    )
  ) {
    return true;
  }
  return false;
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Skip middleware for API routes and static files
  if (
    path.startsWith("/api/") ||
    path.startsWith("/_next/") ||
    path.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionToken = request.cookies.get("better-auth.session_token");
  const isAuthenticated = !!sessionToken;

  // Public paths that don't require authentication
  const isPublic = isPublicPath(path);

  // Debug log
  console.log("[Middleware]", {
    path,
    isAuthenticated,
    isPublic,
    roleCookie: request.cookies.get("user-role")?.value,
  });

  // Redirect unauthenticated users to signin
  if (!(isAuthenticated || isPublic)) {
    console.log("[Middleware] Redirecting to signin - not authenticated");
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && path.startsWith("/auth/")) {
    // Get role from cookie (set during login)
    const roleCookie = request.cookies.get("user-role");
    const role = (roleCookie?.value as UserRole) || "patient";
    const homeRoute = getHomeRouteForRole(role);
    console.log("[Middleware] Redirecting from auth to:", homeRoute);
    return NextResponse.redirect(new URL(homeRoute, request.url));
  }

  // Role-based access control for authenticated users
  if (isAuthenticated && !isPublic) {
    const roleCookie = request.cookies.get("user-role");
    const role = (roleCookie?.value as UserRole) || "patient";

    console.log(
      "[Middleware] Checking access for role:",
      role,
      "to path:",
      path
    );

    // Check if the path is allowed for this role
    if (!isPathAllowedForRole(path, role)) {
      const homeRoute = getHomeRouteForRole(role);
      console.log("[Middleware] Path not allowed, redirecting to:", homeRoute);
      return NextResponse.redirect(new URL(homeRoute, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
