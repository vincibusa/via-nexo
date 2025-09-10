// src/app/chat/page.tsx
import { Suspense } from "react";
import { getServerUser } from "@/lib/server-auth";
import { ChatPageClient } from "./ChatPageClient";

export default async function ChatPage() {
  const user = await getServerUser();
  console.log("[CHAT_PAGE] Server user:", user?.email || "null");

  return (
    <Suspense fallback={<div>Loading chat...</div>}>
      <div className="bg-neutral-900 text-neutral-100">
        <ChatPageClient initialUser={user} />
      </div>
    </Suspense>
  );
}
