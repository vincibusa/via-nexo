/**
 * Next.js Middleware
 * Route protection, redirects, and automatic token refresh
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ===== TYPES =====

interface AuthUser {
  id: string;
  email: string;
  emailConfirmed: boolean;
  role?: string;
}

// ===== CONFIGURATION =====

// Paths that require authentication
const protectedRoutes = [
  "/chat",
  "/account",
  "/bookings",
  "/favorites",
  "/settings",
];

// Admin-only paths
const adminRoutes = ["/admin", "/dashboard"];

// Public API routes that don't need authentication
const publicApiRoutes = [
  "/api/search",
  "/api/partners",
  "/api/destinations",
  "/api/health",
  "/api/auth", // Auth endpoints are public
];

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100;

// Token refresh thresholds
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry

// ===== RATE LIMITING =====

// Simple in-memory rate limiting store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(request: NextRequest): string {
  // Use IP address or user ID for rate limiting
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() || realIp || "unknown";
  return `rate_limit:${ip}`;
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // Reset the counter
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  record.count++;
  return false;
}

function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Cleanup rate limit store every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);

// ===== AUTHENTICATION HELPERS =====

/**
 * Extract JWT payload without verification (for expiry check)
 */
function parseJwtPayload(
  token: string
): {
  exp?: number;
  sub?: string;
  email?: string;
  email_confirmed_at?: string;
} | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = JSON.parse(Buffer.from(payload, "base64").toString());
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Check if token needs refresh based on expiry time
 */
function shouldRefreshToken(accessToken: string): boolean {
  const payload = parseJwtPayload(accessToken);
  if (!payload?.exp) return false;

  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = (payload.exp - now) * 1000;

  return timeUntilExpiry <= TOKEN_REFRESH_THRESHOLD;
}

/**
 * Get current user from cookies directly (without API call to avoid recursion)
 */
function getCurrentUserFromCookies(request: NextRequest): AuthUser | null {
  const accessTokenCookie = request.cookies.get("supabase-access-token");

  if (!accessTokenCookie?.value) {
    return null;
  }

  try {
    const payload = parseJwtPayload(accessTokenCookie.value);
    if (!payload) return null;

    return {
      id: payload.sub || "",
      email: payload.email || "",
      emailConfirmed: payload.email_confirmed_at ? true : false,
      // Role will be handled by pages that need it
    };
  } catch (error) {
    console.error("[MIDDLEWARE] Error parsing user from token:", error);
    return null;
  }
}

/**
 * Check if access token is expired
 */
function isTokenExpired(accessToken: string): boolean {
  const payload = parseJwtPayload(accessToken);
  if (!payload?.exp) return true;

  const now = Math.floor(Date.now() / 1000);
  return now >= payload.exp;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  console.log(`[MIDDLEWARE] Processing: ${pathname}`);

  // ===== AUTHENTICATION =====

  // Get current user authentication status from cookies directly
  let user: AuthUser | null = null;
  const accessTokenCookie = request.cookies.get("supabase-access-token");

  if (accessTokenCookie?.value) {
    if (isTokenExpired(accessTokenCookie.value)) {
      console.log("[MIDDLEWARE] Access token expired, user needs to re-login");
      // Clear expired cookies
      response.cookies.delete("supabase-access-token");
      response.cookies.delete("supabase-refresh-token");
    } else {
      // Token is valid, get user from it
      user = getCurrentUserFromCookies(request);

      // Check if token needs refresh (but don't do it here to avoid recursion)
      if (shouldRefreshToken(accessTokenCookie.value)) {
        console.log(
          "[MIDDLEWARE] Token will need refresh soon, client should handle this"
        );
        // Add header to indicate refresh needed
        response.headers.set("X-Token-Refresh-Needed", "true");
      }
    }
  }

  const isAuthenticated = !!user;
  const isAdmin = false; // We'll handle admin check in pages that need it

  console.log(
    `[MIDDLEWARE] User: ${user?.email || "not authenticated"}, Token: ${accessTokenCookie?.value ? "present" : "missing"}`
  );

  // Security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // Rate limiting for API routes
  if (pathname.startsWith("/api/")) {
    const rateLimitKey = getRateLimitKey(request);

    if (isRateLimited(rateLimitKey)) {
      return new NextResponse(
        JSON.stringify({
          error: "Too many requests",
          message: "Rate limit exceeded. Please try again later.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
          },
        }
      );
    }

    // Add rate limiting headers
    const record = rateLimitStore.get(rateLimitKey);
    if (record) {
      response.headers.set(
        "X-RateLimit-Limit",
        RATE_LIMIT_MAX_REQUESTS.toString()
      );
      response.headers.set(
        "X-RateLimit-Remaining",
        (RATE_LIMIT_MAX_REQUESTS - record.count).toString()
      );
      response.headers.set(
        "X-RateLimit-Reset",
        Math.ceil(record.resetTime / 1000).toString()
      );
    }
  }

  // ===== ROUTE HANDLING =====

  // Skip middleware for public API routes
  if (publicApiRoutes.some(route => pathname.startsWith(route))) {
    console.log(`[MIDDLEWARE] Skipping public API route: ${pathname}`);
    return response;
  }

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.includes(".") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register")
  ) {
    return response;
  }

  // Redirect to login for protected routes
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      console.log(
        `[MIDDLEWARE] Redirecting unauthenticated user to login from ${pathname}`
      );
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect to unauthorized for admin routes
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!isAdmin) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    if (isAuthenticated) {
      const redirect = request.nextUrl.searchParams.get("redirectTo");
      const targetUrl = redirect || "/"; // Redirect to home page instead of chat
      console.log(
        `[MIDDLEWARE] Redirecting authenticated user from ${pathname} to ${targetUrl}`
      );
      return NextResponse.redirect(new URL(targetUrl, request.url));
    }
  }

  // Handle locale redirects (if implementing i18n)
  // Example: redirect /en/... to /...
  if (pathname.startsWith("/en/")) {
    return NextResponse.redirect(
      new URL(pathname.replace("/en", ""), request.url)
    );
  }

  return response;
}

// Configure which paths trigger middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/health (health check)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (*.svg, *.png, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
