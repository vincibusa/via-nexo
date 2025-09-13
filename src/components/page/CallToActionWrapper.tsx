import { getServerUser } from "@/lib/supabase-server-auth";
import { CallToActionClient } from "./CallToActionClient";

export async function CallToActionWrapper() {
  const user = await getServerUser();

  return <CallToActionClient initialUser={user} />;
}
