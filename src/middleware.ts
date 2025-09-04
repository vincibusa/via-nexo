/**
 * Next.js Middleware
 * Route protection, redirects, and request processing
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Paths that require authentication
const protectedRoutes = ["/account", "/bookings", "/favorites", "/settings"];

// Admin-only paths
const adminRoutes = ["/admin", "/dashboard"];

// Public API routes that don't need authentication
const publicApiRoutes = [
  "/api/search",
  "/api/partners",
  "/api/destinations",
  "/api/health",
];

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100;

// Simple in-memory rate limiting store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(request: NextRequest): string {
  // Use IP address or user ID for rate limiting
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.ip || "unknown";
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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

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

  // Skip middleware for public API routes
  if (publicApiRoutes.some(route => pathname.startsWith(route))) {
    return response;
  }

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.includes(".") ||
    pathname.startsWith("/favicon")
  ) {
    return response;
  }

  // TODO: Implement authentication check when Auth is ready
  // For now, we'll just check for a simple session cookie
  // const session = request.cookies.get("session");
  // const isAuthenticated = !!session?.value;

  // Mock authentication for development
  const isAuthenticated = false; // Will be replaced with real auth
  const isAdmin = false; // Will be replaced with real role checking

  // Redirect to login for protected routes
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect to unauthorized for admin routes
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!isAdmin) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    if (isAuthenticated) {
      const redirect = request.nextUrl.searchParams.get("redirect");
      return NextResponse.redirect(new URL(redirect || "/", request.url));
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
