import {
  getServerUser,
  getServerUserProfile,
} from "@/lib/supabase-server-auth";
import { HeaderClient } from "./HeaderClient";

export async function HeaderWrapper() {
  console.log("[HEADER_WRAPPER] Server rendering header...");

  const user = await getServerUser();
  const userProfile = user ? await getServerUserProfile(user.id) : null;

  console.log(`[HEADER_WRAPPER] Server user: ${user?.email || "null"}`);
  console.log(
    `[HEADER_WRAPPER] Server userProfile: ${userProfile?.display_name || "null"}`
  );

  return <HeaderClient initialUser={user} initialUserProfile={userProfile} />;
}
