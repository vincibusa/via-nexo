import { getServerUser } from "@/lib/supabase-server-auth";
import { HeroClient } from "./HeroClient";

export async function HeroWrapper() {
  const user = await getServerUser();

  return <HeroClient initialUser={user} />;
}
