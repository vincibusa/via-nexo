import {
  getServerAuthUser,
  getServerUserProfile,
  ServerAuthUser,
} from "@/lib/server-auth-utils";
import { HeaderClient } from "./HeaderClient";
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

export async function HeaderWrapper() {
  console.log("[HEADER_WRAPPER] Server rendering header...");

  const { user: serverUser } = await getServerAuthUser();
  const user = serverUser ? convertToSupabaseUser(serverUser) : null;
  const userProfile = serverUser
    ? await getServerUserProfile(serverUser.id)
    : null;

  console.log(`[HEADER_WRAPPER] Server user: ${serverUser?.email || "null"}`);
  console.log(
    `[HEADER_WRAPPER] Server userProfile: ${userProfile?.display_name || "null"}`
  );

  return <HeaderClient initialUser={user} initialUserProfile={userProfile} />;
}
