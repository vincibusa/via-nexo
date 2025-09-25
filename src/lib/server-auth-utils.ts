/**
 * Server-side Authentication Utilities
 * Pure API-based auth without @supabase/ssr dependency
 */

import { cookies } from "next/headers";
import { supabase } from "./supabase-server";

// ===== TYPES =====

export interface ServerAuthUser {
  id: string;
  email: string;
  emailConfirmed: boolean;
  createdAt: string;
  lastSignInAt?: string;
  userMetadata?: Record<string, unknown>;
  role?: string;
}

export interface ServerAuthResult {
  user: ServerAuthUser | null;
  error: string | null;
}

// ===== JWT UTILITIES =====

/**
 * Extract JWT payload without verification (for user ID and expiry check)
 * Reused from middleware.ts
 */
function parseJwtPayload(token: string): {
  exp?: number;
  sub?: string;
  email?: string;
  email_confirmed_at?: string;
  user_metadata?: Record<string, unknown>;
  iat?: number;
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
 * Check if access token is expired
 */
function isTokenExpired(accessToken: string): boolean {
  const payload = parseJwtPayload(accessToken);
  if (!payload?.exp) return true;

  const now = Math.floor(Date.now() / 1000);
  return now >= payload.exp;
}

// ===== MAIN AUTH FUNCTIONS =====

/**
 * Get current authenticated user from server-side cookies
 * Uses JWT token validation + database verification with service role
 */
export async function getServerAuthUser(): Promise<ServerAuthResult> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("supabase-access-token")?.value;

    if (!accessToken) {
      return { user: null, error: "No access token" };
    }

    // Check if token is expired
    if (isTokenExpired(accessToken)) {
      return { user: null, error: "Access token expired" };
    }

    // Parse token payload to get user ID
    const payload = parseJwtPayload(accessToken);
    if (!payload?.sub) {
      return { user: null, error: "Invalid token payload" };
    }

    // Verify user still exists in database using service role
    const { data: authUser, error: dbError } =
      await supabase.auth.admin.getUserById(payload.sub);

    if (dbError || !authUser?.user) {
      return { user: null, error: "User not found in database" };
    }

    // Convert Supabase user to our format
    const user: ServerAuthUser = {
      id: authUser.user.id,
      email: authUser.user.email || "",
      emailConfirmed: !!authUser.user.email_confirmed_at,
      createdAt: authUser.user.created_at,
      lastSignInAt: authUser.user.last_sign_in_at || undefined,
      userMetadata: authUser.user.user_metadata || {},
      role: authUser.user.user_metadata?.role || "user",
    };

    return { user, error: null };
  } catch (error) {
    console.error("[SERVER_AUTH] Unexpected error:", error);
    return { user: null, error: "Authentication error" };
  }
}

/**
 * Require authentication for API routes
 * Returns user or throws unauthorized error
 */
export async function requireAuth(): Promise<ServerAuthUser> {
  const { user, error } = await getServerAuthUser();

  if (!user) {
    throw new Error(`Unauthorized: ${error}`);
  }

  return user;
}

/**
 * Get user profile from database using service role
 */
export async function getServerUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.warn("[SERVER_AUTH] Error fetching user profile:", error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.warn("[SERVER_AUTH] Unexpected error fetching profile:", error);
    return null;
  }
}

/**
 * Check if user has specific role
 */
export async function hasRole(requiredRole: string): Promise<boolean> {
  const { user } = await getServerAuthUser();
  return user?.role === requiredRole || false;
}

/**
 * Require specific role for API routes
 */
export async function requireRole(
  requiredRole: string
): Promise<ServerAuthUser> {
  const user = await requireAuth();

  if (user.role !== requiredRole) {
    throw new Error(`Forbidden: requires ${requiredRole} role`);
  }

  return user;
}
