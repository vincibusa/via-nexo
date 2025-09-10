"use client";

import { useEffect } from "react";
import { createClientComponentClient } from "@/lib/supabase-client-unified";

export function useSupabaseCookieSync() {
  console.log("[COOKIE_SYNC] 🚀 Hook initializing...");
  const supabase = createClientComponentClient();

  useEffect(() => {
    console.log("[COOKIE_SYNC] 📋 useEffect executing...");
    // Force cookie synchronization on mount
    const syncCookies = async () => {
      try {
        console.log("[COOKIE_SYNC] Starting cookie synchronization...");

        // Check if we have Supabase cookies
        const hasCookies =
          typeof document !== "undefined" &&
          document.cookie.includes("sb-") &&
          document.cookie.includes("auth-token");

        console.log("[COOKIE_SYNC] Cookies detected:", hasCookies);

        // Get current session to ensure cookies are set
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (session && !error) {
          console.log(
            "[COOKIE_SYNC] ✅ Session found, cookies should be synchronized"
          );

          // Trigger a refresh to ensure cookies are properly set
          const refreshResult = await supabase.auth.refreshSession();
          if (refreshResult.data.session) {
            console.log(
              "[COOKIE_SYNC] ✅ Session refreshed and cookies synchronized"
            );
          } else {
            console.warn("[COOKIE_SYNC] ⚠️ Session refresh failed");
          }
        } else if (hasCookies && !session) {
          console.warn(
            "[COOKIE_SYNC] ⚠️ Cookies exist but no session. Attempting forced refresh..."
          );

          // Force multiple refresh attempts
          for (let i = 0; i < 3; i++) {
            const refreshResult = await supabase.auth.refreshSession();
            if (refreshResult.data.session) {
              console.log(
                "[COOKIE_SYNC] ✅ Session recovered via forced refresh attempt",
                i + 1
              );
              break;
            }
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } else {
          console.log("[COOKIE_SYNC] No active session to sync");
        }
      } catch (error) {
        console.error("[COOKIE_SYNC] ❌ Cookie sync failed:", error);
      }
    };

    syncCookies();

    // Listen for auth changes and sync cookies
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[COOKIE_SYNC] Auth state changed:", event);

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        // Ensure cookies are properly set after sign in or token refresh
        if (session) {
          console.log(
            "[COOKIE_SYNC] ✅ Auth event with session - cookies should be synchronized"
          );
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);
}
