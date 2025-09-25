import { getServerAuthUser, ServerAuthUser } from "@/lib/server-auth-utils";
import { CallToActionClient } from "./CallToActionClient";
import type { User as SupabaseUser } from "@supabase/supabase-js";

// Convert ServerAuthUser to Supabase User format for compatibility
function convertToSupabaseUser(serverUser: ServerAuthUser): SupabaseUser {
  return {
    id: serverUser.id,
    aud: "authenticated",
    role: "",
    email: serverUser.email,
    email_confirmed_at: serverUser.emailConfirmed
      ? serverUser.createdAt
      : undefined,
    phone: "",
    confirmed_at: serverUser.emailConfirmed ? serverUser.createdAt : undefined,
    last_sign_in_at: serverUser.lastSignInAt || undefined,
    app_metadata: {},
    user_metadata: serverUser.userMetadata || {},
    identities: [],
    created_at: serverUser.createdAt,
    updated_at: serverUser.createdAt,
    is_anonymous: false,
  };
}

export async function CallToActionWrapper() {
  const { user: serverUser } = await getServerAuthUser();
  const user = serverUser ? convertToSupabaseUser(serverUser) : null;

  return <CallToActionClient initialUser={user} />;
}
