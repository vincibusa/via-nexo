import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: { [key: string]: unknown }) {
          // Server components are read-only, so we can't set cookies
          // This is mainly for client-side operations
          try {
            cookieStore.set(name, value, options);
          } catch {
            // Ignore errors in server context
          }
        },
        remove(name: string, options: { [key: string]: unknown }) {
          try {
            cookieStore.set(name, "", {
              ...options,
              maxAge: 0,
            });
          } catch {
            // Ignore errors in server context
          }
        },
      },
    }
  );
}

/**
 * Get user from server-side cookies
 * This ensures consistent server/client rendering
 */
export async function getServerUser() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.warn("[SERVER_AUTH] Error fetching user:", error.message);
      return null;
    }

    return user;
  } catch (error) {
    console.warn("[SERVER_AUTH] Unexpected error:", error);
    return null;
  }
}

/**
 * Get user profile from server-side
 */
export async function getServerUserProfile(userId: string) {
  try {
    const supabase = await createServerSupabaseClient();
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
