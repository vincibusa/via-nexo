"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { User, AuthError, Session } from "@supabase/supabase-js";
import { createClientComponentClient } from "@/lib/supabase-client-unified";
import { UserProfile } from "@/lib/supabase-auth";
import { useSupabaseCookieSync } from "@/hooks/useSupabaseCookieSync";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error?: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    userData: {
      firstName: string;
      lastName: string;
      phone: string;
    }
  ) => Promise<{ error?: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError } | undefined>;
  updateProfile: (
    updates: Partial<UserProfile>
  ) => Promise<{ error?: AuthError | null }>;
  forceSetUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  console.log("[AUTH] 🚀 AuthProvider mounting...");

  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingProfile, setFetchingProfile] = useState(false);

  console.log("[AUTH] 📱 Creating Supabase client...");
  const supabase = createClientComponentClient();

  // Use cookie sync hook to ensure cookies are properly managed
  console.log("[AUTH] 🔄 Initializing cookie sync...");
  useSupabaseCookieSync();

  // Debug logging for state changes
  useEffect(() => {
    console.log("[AUTH_STATE] User:", user?.email || "null");
    console.log(
      "[AUTH_STATE] UserProfile:",
      userProfile?.display_name || "null"
    );
    console.log("[AUTH_STATE] Session:", session ? "exists" : "null");
    console.log("[AUTH_STATE] Loading:", loading);
  }, [user, userProfile, session, loading]);

  const fetchUserProfile = useCallback(
    async (userId: string) => {
      // Don't fetch profile if we don't have a valid userId
      if (!userId) {
        console.warn("[AUTH] No userId provided to fetchUserProfile");
        setUserProfile(null);
        return;
      }

      // Prevent multiple simultaneous fetches for the same user
      if (fetchingProfile) {
        console.log("[AUTH] Already fetching profile, skipping...");
        return;
      }

      // Check if we already have a profile for this user
      if (userProfile?.id === userId) {
        console.log("[AUTH] Profile already cached for user:", userId);
        return;
      }

      setFetchingProfile(true);
      try {
        console.log("[AUTH] Fetching user profile for:", userId);

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Profile fetch timeout")), 5000)
        );

        const queryPromise = supabase
          .from("user_profiles")
          .select("*")
          .eq("id", userId)
          .single();

        const result = await Promise.race([queryPromise, timeoutPromise]);
        const { data, error } = result as {
          data: UserProfile | null;
          error: unknown;
        };

        if (error) {
          console.warn("[AUTH] Error fetching user profile:", error);
          setUserProfile(null);
        } else {
          console.log("[AUTH] User profile fetched successfully:", data);
          setUserProfile(data);
        }
      } catch (error) {
        console.warn("[AUTH] Unexpected error fetching user profile:", error);
        setUserProfile(null);
      } finally {
        setFetchingProfile(false);
      }
    },
    [supabase, fetchingProfile, userProfile?.id]
  );

  useEffect(() => {
    // Get initial session with retry mechanism
    const initializeAuth = async () => {
      try {
        console.log("[AUTH] Starting auth initialization...");

        // Try multiple times to get session
        let session = null;
        let attempts = 0;
        const maxAttempts = 3;

        while (!session && attempts < maxAttempts) {
          attempts++;
          console.log(
            `[AUTH] Attempt ${attempts}/${maxAttempts} to get session...`
          );

          const {
            data: { session: attemptSession },
            error: sessionError,
          } = await supabase.auth.getSession();

          if (attemptSession) {
            session = attemptSession;
            console.log("[AUTH] ✅ Session found on attempt", attempts);
          } else if (!sessionError) {
            console.log("[AUTH] No session found, attempting refresh...");
            const { data: refreshData } = await supabase.auth.refreshSession();
            if (refreshData.session) {
              session = refreshData.session;
              console.log("[AUTH] ✅ Session recovered via refresh");
            }
          }

          if (!session && attempts < maxAttempts) {
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        console.log(
          "[AUTH] Final session state:",
          session?.user?.email || "no user"
        );

        setSession(session);
        setUser(session?.user ?? null);

        // Set loading to false immediately - user state is now determined
        setLoading(false);

        // Profile will be fetched by auth state change listener
      } catch (error) {
        console.error("[AUTH] Error initializing auth:", error);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(
        "[AUTH] Auth state changed:",
        event,
        session?.user?.email || "no user"
      );

      // Handle specific auth events
      if (event === "TOKEN_REFRESHED") {
        console.log("[AUTH] Token refreshed successfully");
      } else if (event === "SIGNED_OUT") {
        console.log("[AUTH] User signed out");
        setSession(null);
        setUser(null);
        setUserProfile(null);
        setLoading(false);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);

      // Set loading to false immediately - user state is now determined
      setLoading(false);

      if (session?.user?.id) {
        // Only fetch profile if we don't have it or it's for a different user
        if (!userProfile || userProfile.id !== session.user.id) {
          console.log(
            "[AUTH] Auth state changed, fetching profile for:",
            session.user.id
          );
          fetchUserProfile(session.user.id);
        }
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, fetchUserProfile, userProfile]);

  // Periodic session check as fallback
  useEffect(() => {
    if (!user) return;

    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error || !session) {
          console.warn("[AUTH] Session lost, clearing user state");
          setUser(null);
          setUserProfile(null);
          setSession(null);
        }
      } catch (error) {
        console.warn("[AUTH] Session check failed:", error);
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkSession, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, supabase.auth]);

  const signIn = async (email: string, password: string) => {
    console.log("[AUTH] Attempting login with:", email);
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log("[AUTH] Login result:", {
      error: error?.message,
      user: data.user?.email,
    });

    if (!error) {
      // Force a refresh of the user state
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log("[AUTH] User after getUser:", user?.email);
      setUser(user);
      // Profile will be fetched by auth state change listener
      return {};
    }

    return { error };
  };

  const signUp = async (
    email: string,
    password: string,
    userData: {
      firstName: string;
      lastName: string;
      phone: string;
    }
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone,
        },
      },
    });

    // If signup is successful, create user profile
    if (data.user && !error) {
      try {
        await supabase.from("user_profiles").insert({
          id: data.user.id,
          display_name: `${userData.firstName} ${userData.lastName}`,
          preferred_language: "it",
          role: "user",
        });
      } catch (profileError) {
        console.error("Error creating user profile:", profileError);
        return { error: profileError as AuthError };
      }
      return { error: undefined };
    }

    return { error };
  };

  const signOut = async () => {
    console.log("[AUTH] Starting logout process...");
    try {
      // First, call Supabase signOut to invalidate server session
      console.log("[AUTH] Calling supabase.auth.signOut()...");
      try {
        await Promise.race([
          supabase.auth.signOut({ scope: "global" }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 2000)
          ),
        ]);
        console.log("[AUTH] Supabase signOut completed successfully");
      } catch (timeoutError) {
        console.warn(
          "[AUTH] SignOut timed out or failed, proceeding anyway:",
          timeoutError
        );
        return { error: timeoutError as AuthError };
      }

      // Clear local state
      console.log("[AUTH] Clearing local state...");
      setUser(null);
      setUserProfile(null);
      setSession(null);

      // Nuclear option: clear ALL storage
      if (typeof window !== "undefined") {
        console.log("[AUTH] Nuclear storage cleanup...");

        // Clear ALL localStorage
        localStorage.clear();

        // Clear ALL sessionStorage
        sessionStorage.clear();

        // Clear ALL cookies for this domain
        const cookies = document.cookie.split(";");
        cookies.forEach(cookie => {
          const [name] = cookie.trim().split("=");
          if (name) {
            // Clear for current domain and path
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            // Clear for subdomains
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.localhost;`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost;`;
            console.log("[AUTH] Cleared cookie:", name);
          }
        });

        // Also try to clear IndexedDB if it exists
        if ("indexedDB" in window) {
          try {
            const databases = await indexedDB.databases();
            for (const db of databases) {
              if (db.name && db.name.includes("supabase")) {
                console.log("[AUTH] Deleting IndexedDB:", db.name);
                indexedDB.deleteDatabase(db.name);
              }
            }
          } catch (e) {
            console.warn("[AUTH] Could not clear IndexedDB:", e);
          }
        }
      }

      // Force complete page reload
      if (typeof window !== "undefined") {
        console.log("[AUTH] Forcing complete page reload...");
        // Use location.href with timestamp to ensure fresh page load
        window.location.href = "/?t=" + Date.now();
      }
    } catch (error) {
      console.error("Unexpected error during logout:", error);
      // Force reload even on error
      if (typeof window !== "undefined") {
        window.location.href = "/?t=" + Date.now();
      }
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user)
      return { error: { message: "User not authenticated" } as AuthError };

    const { error } = await supabase
      .from("user_profiles")
      .update(updates)
      .eq("id", user.id);

    if (!error && userProfile) {
      setUserProfile({ ...userProfile, ...updates });
    }

    return {
      error: error
        ? ({
            message: error.message,
            name: error.name,
            status: parseInt(error.code),
          } as AuthError)
        : undefined,
    };
  };

  const forceSetUser = useCallback((newUser: User | null) => {
    console.log("[AUTH] 🔄 Force setting user:", newUser?.email || "null");
    setUser(newUser);
    if (!newUser) {
      setUserProfile(null);
      setLoading(false);
    }
    // Profile will be fetched by auth state change listener if newUser exists
  }, []);

  const value = {
    user,
    userProfile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    forceSetUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
