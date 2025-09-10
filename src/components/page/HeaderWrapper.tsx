import { getServerUser } from "@/lib/server-auth";
import { HeaderClient } from "./HeaderClient";

export async function HeaderWrapper() {
  const user = await getServerUser();
  console.log("[HEADER_WRAPPER] Server user:", user?.email || "null");

  return <HeaderClient initialUser={user} />;
}
