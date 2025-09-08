/**
 * Next.js Middleware
 * Route protection, redirects, and request processing
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

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
];

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100;

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client for authentication
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  // Get user authentication status
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const cookies = request.cookies.getAll();
  const supabaseCookies = cookies.filter(cookie =>
    cookie.name.includes("supabase")
  );
  console.log(
    `[MIDDLEWARE] Path: ${pathname}, User: ${user ? user.email : "not logged in"}, Total Cookies: ${cookies.length}, Supabase Cookies: ${supabaseCookies.map(c => c.name).join(", ")}`
  );

  // Get user profile for role checking
  let userProfile = null;
  if (user) {
    try {
      const { data } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      userProfile = data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  }

  const isAuthenticated = !!user;
  const isAdmin = userProfile?.role === "admin";

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
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register")
  ) {
    return response;
  }

  // Authentication is now handled above via Supabase

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
      console.log(
        `[MIDDLEWARE] Redirecting authenticated user from ${pathname} to /chat`
      );
      const redirect = request.nextUrl.searchParams.get("redirectTo");
      return NextResponse.redirect(new URL(redirect || "/chat", request.url));
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
