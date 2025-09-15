"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  User,
  UserProfile,
  AuthError,
  loginWithPassword,
  registerUser,
  getCurrentUser,
  updateProfile,
  logout,
  refreshToken,
} from "@/lib/auth-api";

// ===== TYPES =====

interface AuthContextType {
  user: SupabaseUser | null;
  userProfile: UserProfile | null;
  session: { user: SupabaseUser } | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error?: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<{ error?: AuthError | null }>;
  signOut: () => Promise<{ error?: AuthError | null }>;
  updateUserProfile: (
    updates: Partial<UserProfile>
  ) => Promise<{ error?: AuthError | null }>;
  forceSetUser: (user: SupabaseUser | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// ===== HELPER FUNCTIONS =====

/**
 * Convert API User to Supabase User format for compatibility
 */
function convertToSupabaseUser(apiUser: User): SupabaseUser {
  return {
    id: apiUser.id,
    email: apiUser.email,
    email_confirmed_at: apiUser.emailConfirmed ? apiUser.createdAt : undefined,
    phone: undefined,
    phone_confirmed_at: undefined,
    created_at: apiUser.createdAt,
    updated_at: apiUser.createdAt,
    last_sign_in_at: apiUser.lastSignInAt || undefined,
    app_metadata: {},
    user_metadata: apiUser.userMetadata || {},
    aud: "authenticated",
    role: "authenticated",
    identities: [],
  };
}

/**
 * Convert API error to Supabase AuthError format
 */
function convertToAuthError(message: string, status: number = 400): AuthError {
  return {
    message,
    name: "AuthError",
    status,
  };
}

// ===== MAIN COMPONENT =====

export function AuthProvider({ children }: { children: React.ReactNode }) {
  console.log("[AUTH_API] 🚀 AuthProvider mounting...");

  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<{ user: SupabaseUser } | null>(null);
  const [loading, setLoading] = useState(true);

  // Refs to prevent multiple simultaneous operations
  const initializingRef = useRef(false);
  const refreshingRef = useRef(false);

  // Debug logging
  useEffect(() => {
    console.log("[AUTH_API_STATE] User:", user?.email || "null");
    console.log(
      "[AUTH_API_STATE] Profile:",
      userProfile?.display_name || "null"
    );
    console.log("[AUTH_API_STATE] Session:", session ? "exists" : "null");
    console.log("[AUTH_API_STATE] Loading:", loading);
  }, [user, userProfile, session, loading]);

  /**
   * Initialize authentication state
   */
  const initializeAuth = useCallback(async () => {
    if (initializingRef.current) {
      console.log("[AUTH_API] Already initializing, skipping...");
      return;
    }

    initializingRef.current = true;
    console.log("[AUTH_API] Initializing authentication...");

    try {
      const response = await getCurrentUser();

      if (response.success && response.data) {
        const { user: apiUser, profile } = response.data;
        const supabaseUser = convertToSupabaseUser(apiUser);

        console.log("[AUTH_API] User authenticated:", apiUser.email);

        setUser(supabaseUser);
        setUserProfile(profile);
        setSession({ user: supabaseUser });
      } else {
        console.log("[AUTH_API] No authenticated user");
        setUser(null);
        setUserProfile(null);
        setSession(null);
      }
    } catch (error) {
      console.error("[AUTH_API] Initialize auth error:", error);
      setUser(null);
      setUserProfile(null);
      setSession(null);
    } finally {
      setLoading(false);
      initializingRef.current = false;
    }
  }, []);

  /**
   * Auto-refresh token periodically
   */
  const setupTokenRefresh = useCallback(() => {
    const refreshInterval = setInterval(
      async () => {
        if (refreshingRef.current || !user) return;

        refreshingRef.current = true;
        try {
          console.log("[AUTH_API] Auto-refreshing token...");
          await refreshToken();
        } catch (error) {
          console.warn("[AUTH_API] Auto-refresh failed:", error);
        } finally {
          refreshingRef.current = false;
        }
      },
      10 * 60 * 1000
    ); // Refresh every 10 minutes

    return () => clearInterval(refreshInterval);
  }, [user]);

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Setup auto-refresh when user is authenticated
  useEffect(() => {
    if (user) {
      return setupTokenRefresh();
    }
  }, [user, setupTokenRefresh]);

  /**
   * Sign in with email and password
   */
  const signIn = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ error?: AuthError | null }> => {
      console.log("[AUTH_API] Signing in user:", email);
      setLoading(true);

      try {
        const response = await loginWithPassword(email, password);

        if (response.success && response.data) {
          const { user: apiUser, profile } = response.data;
          const supabaseUser = convertToSupabaseUser(apiUser);

          setUser(supabaseUser);
          setUserProfile(profile);
          setSession({ user: supabaseUser });

          console.log("[AUTH_API] ✅ Sign in successful");
          return {};
        } else {
          const error = convertToAuthError(response.error || "Login failed");
          console.error("[AUTH_API] ❌ Sign in failed:", error.message);
          return { error };
        }
      } catch (error) {
        const authError = convertToAuthError("Network error during sign in");
        console.error("[AUTH_API] ❌ Sign in error:", error);
        return { error: authError };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Sign up new user
   */
  const signUp = useCallback(
    async (
      email: string,
      password: string,
      displayName?: string
    ): Promise<{ error?: AuthError | null }> => {
      console.log("[AUTH_API] Signing up user:", email);
      setLoading(true);

      try {
        const response = await registerUser(email, password, displayName);

        if (response.success && response.data) {
          const {
            user: apiUser,
            profile,
            needsEmailConfirmation,
          } = response.data;

          if (!needsEmailConfirmation) {
            // User is immediately authenticated
            const supabaseUser = convertToSupabaseUser(apiUser);
            setUser(supabaseUser);
            setUserProfile(profile);
            setSession({ user: supabaseUser });
          }

          console.log("[AUTH_API] ✅ Sign up successful");
          return {};
        } else {
          const error = convertToAuthError(
            response.error || "Registration failed"
          );
          console.error("[AUTH_API] ❌ Sign up failed:", error.message);
          return { error };
        }
      } catch (error) {
        const authError = convertToAuthError("Network error during sign up");
        console.error("[AUTH_API] ❌ Sign up error:", error);
        return { error: authError };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Sign out user
   */
  const signOut = useCallback(async (): Promise<{
    error?: AuthError | null;
  }> => {
    console.log("[AUTH_API] Signing out user");
    setLoading(true);

    try {
      const response = await logout();

      // Clear state regardless of API response
      setUser(null);
      setUserProfile(null);
      setSession(null);

      if (response.success) {
        console.log("[AUTH_API] ✅ Sign out successful");
        return {};
      } else {
        console.warn(
          "[AUTH_API] ⚠️ Sign out API failed, but cleared local state"
        );
        return {};
      }
    } catch (error) {
      console.error("[AUTH_API] ❌ Sign out error:", error);
      // Still clear local state
      setUser(null);
      setUserProfile(null);
      setSession(null);
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update user profile
   */
  const updateUserProfile = useCallback(
    async (
      updates: Partial<UserProfile>
    ): Promise<{ error?: AuthError | null }> => {
      console.log("[AUTH_API] Updating user profile");

      try {
        const response = await updateProfile(updates);

        if (response.success && response.data) {
          setUserProfile(response.data.profile);
          console.log("[AUTH_API] ✅ Profile updated successfully");
          return {};
        } else {
          const error = convertToAuthError(
            response.error || "Profile update failed"
          );
          console.error("[AUTH_API] ❌ Profile update failed:", error.message);
          return { error };
        }
      } catch (error) {
        const authError = convertToAuthError("Network error updating profile");
        console.error("[AUTH_API] ❌ Profile update error:", error);
        return { error: authError };
      }
    },
    []
  );

  /**
   * Force set user (for compatibility)
   */
  const forceSetUser = useCallback((newUser: SupabaseUser | null) => {
    console.log("[AUTH_API] 🔄 Force setting user:", newUser?.email || "null");
    setUser(newUser);
    if (newUser) {
      setSession({ user: newUser });
    } else {
      setUserProfile(null);
      setSession(null);
      setLoading(false);
    }
  }, []);

  const value = {
    user,
    userProfile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateUserProfile,
    forceSetUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
