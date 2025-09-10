"use client";

import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatLayout } from "@/components/chat/ChatLayout";
import { useChat } from "@/hooks/useChat";
import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { NavigationBreadcrumb } from "@/components/page/NavigationBreadcrumb";
import { useAuth } from "@/contexts/AuthContext";
import { PlanningProvider } from "@/contexts/PlanningContext";
import type { User } from "@supabase/supabase-js";

interface ChatPageClientProps {
  initialUser: User | null;
}

export function ChatPageClient({ initialUser }: ChatPageClientProps) {
  console.log(
    "[CHAT_PAGE_CLIENT] Received initial user:",
    initialUser?.email || "null"
  );

  const { forceSetUser, user: contextUser } = useAuth();

  // Force set the user from server if context user is null but we have initialUser
  useEffect(() => {
    if (initialUser && !contextUser) {
      console.log("[CHAT_PAGE_CLIENT] 🔄 Forcing AuthContext user from server");
      forceSetUser(initialUser);
    }
  }, [initialUser, contextUser, forceSetUser]);

  const {
    messages,
    sendMessage,
    addMessage,
    isLoading,
    error,
    retryLastMessage,
    sessions,
    currentSessionId,
    loadSession,
    deleteSession,
    renameSession,
    startNewSession,
  } = useChat();

  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query");
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (initialQuery && messages.length === 0 && !hasInitialized.current) {
      // Only send if no messages yet and not already initialized
      hasInitialized.current = true;
      sendMessage(initialQuery);
    }
  }, [initialQuery, sendMessage, messages.length]); // Keep dependencies for proper cleanup

  return (
    <PlanningProvider addMessage={addMessage}>
      <ChatLayout
        sessions={sessions}
        currentSessionId={currentSessionId}
        onLoadSession={loadSession}
        onDeleteSession={deleteSession}
        onRenameSession={renameSession}
        onNewSession={startNewSession}
      >
        <div className="flex min-h-screen flex-col">
          <NavigationBreadcrumb />

          <main className="flex flex-1 flex-col items-center overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex w-full max-w-4xl flex-1 flex-col">
              <ChatMessages
                messages={messages}
                error={error}
                onRetry={retryLastMessage}
                isLoading={isLoading}
                onSendMessage={sendMessage}
              />
              <ChatInput
                onSendMessage={sendMessage}
                isLoading={isLoading}
                error={error}
                onRetry={retryLastMessage}
              />
            </div>
          </main>
        </div>
      </ChatLayout>
    </PlanningProvider>
  );
}
