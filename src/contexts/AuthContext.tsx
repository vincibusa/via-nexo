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
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  const fetchUserProfile = useCallback(
    async (userId: string) => {
      // Don't fetch profile if we don't have a valid userId
      if (!userId) {
        console.warn("[AUTH] No userId provided to fetchUserProfile");
        setUserProfile(null);
        setLoading(false);
        return;
      }

      try {
        console.log("[AUTH] Fetching user profile for:", userId);
        const { data, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", userId)
          .single();

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
        setLoading(false);
      }
    },
    [supabase]
  );

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log(
        "[AUTH] Initial session loaded:",
        session?.user?.email || "no user"
      );
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user?.id) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(
        "[AUTH] Auth state changed:",
        event,
        session?.user?.email || "no user"
      );
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user?.id) {
        await fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, fetchUserProfile]);

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
      if (user) {
        await fetchUserProfile(user.id);
      }
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

  const value = {
    user,
    userProfile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
