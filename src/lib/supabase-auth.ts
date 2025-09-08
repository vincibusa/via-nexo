import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable"
    );
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

export interface UserProfile {
  id: string;
  created_at: string;
  updated_at: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  preferred_language?: string;
  preferred_currency?: string;
  travel_style?: string[];
  preferred_locations?: string[];
  budget_range?: number;
  dietary_restrictions?: string[];
  email_notifications?: boolean;
  push_notifications?: boolean;
  marketing_emails?: boolean;
  profile_public?: boolean;
  share_search_data?: boolean;
  total_bookings?: number;
  total_searches?: number;
  last_active_at?: string;
  role: "user" | "admin" | "partner";
}

export interface Conversation {
  id: string;
  user_id: string;
  title?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  role: "user" | "assistant" | "system";
  metadata?: Record<string, unknown>;
  created_at: string;
}

export async function getUser() {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const user = await getUser();

  if (!user) return null;

  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

export async function createUserProfile(
  userId: string,
  profileData: {
    display_name?: string;
    preferred_language?: string;
    role?: "user" | "admin" | "partner";
  }
): Promise<UserProfile | null> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .insert({
        id: userId,
        display_name: profileData.display_name,
        preferred_language: profileData.preferred_language || "it",
        role: profileData.role || "user",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating user profile:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error creating user profile:", error);
    return null;
  }
}
