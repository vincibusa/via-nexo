// src/app/chat/page.tsx
import { Suspense } from "react";
import { getServerAuthUser, ServerAuthUser } from "@/lib/server-auth-utils";
import { ChatPageClient } from "./ChatPageClient";
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

export default async function ChatPage() {
  const { user: serverUser } = await getServerAuthUser();
  const user = serverUser ? convertToSupabaseUser(serverUser) : null;
  console.log("[CHAT_PAGE] Server user:", serverUser?.email || "null");

  return (
    <Suspense fallback={<div>Loading chat...</div>}>
      <div className="bg-neutral-900 text-neutral-100">
        <ChatPageClient initialUser={user} />
      </div>
    </Suspense>
  );
}
