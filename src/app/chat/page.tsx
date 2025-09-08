// src/app/chat/page.tsx
"use client"; // This is a client component

import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatLayout } from "@/components/chat/ChatLayout";
import { useChat } from "@/hooks/useChat";
import { useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { NavigationBreadcrumb } from "@/components/page/NavigationBreadcrumb";

export default function ChatPage() {
  const {
    messages,
    sendMessage,
    isLoading,
    error,
    retryLastMessage,
    sessions,
    currentSessionId,
    loadSession,
    deleteSession,
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
    <Suspense fallback={<div>Loading chat...</div>}>
      <div className="bg-neutral-900 text-neutral-100">
        <ChatLayout
          sessions={sessions}
          currentSessionId={currentSessionId}
          onLoadSession={loadSession}
          onDeleteSession={deleteSession}
          onNewSession={startNewSession}
        >
          <div className="flex min-h-screen flex-col">
            <NavigationBreadcrumb />

            <main className="flex flex-1 flex-col items-center overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Ask me anything
                </h2>
                <p className="mt-2 text-lg leading-8 text-neutral-400">
                  I can help you plan your next trip. Ask me anything about
                  destinations, activities, or travel tips.
                </p>
              </div>
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
      </div>
    </Suspense>
  );
}
