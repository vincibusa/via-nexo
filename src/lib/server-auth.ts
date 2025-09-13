import { createClient } from "./supabase-auth";

export async function getServerUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.warn("[SERVER_AUTH] Error getting user:", error.message);
      return null;
    }

    return user;
  } catch (error) {
    console.error("[SERVER_AUTH] Unexpected error:", error);
    return null;
  }
}

export async function getServerSession() {
  try {
    const supabase = await createClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.warn("[SERVER_AUTH] Error getting session:", error.message);
      return null;
    }

    return session;
  } catch (error) {
    console.error("[SERVER_AUTH] Unexpected error:", error);
    return null;
  }
}
