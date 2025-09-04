// src/app/chat/page.tsx
"use client"; // This is a client component

import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { useChat } from "@/hooks/useChat";
import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

export default function ChatPage() {
  const { messages, sendMessage, isLoading } = useChat();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query");

  useEffect(() => {
    if (initialQuery && messages.length === 0) {
      // Only send if no messages yet
      sendMessage(initialQuery);
    }
  }, [initialQuery, sendMessage, messages.length]); // Add messages.length to dependencies

  return (
    <Suspense fallback={<div>Loading chat...</div>}>
      <div className="relative flex size-full min-h-screen flex-col overflow-x-hidden bg-neutral-900 text-neutral-100">
        <main className="mt-20 flex flex-1 flex-col items-center px-4 py-8 sm:px-6 lg:px-8">
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
            <ChatMessages messages={messages} />
            <ChatInput onSendMessage={sendMessage} isLoading={isLoading} />
          </div>
        </main>
      </div>
    </Suspense>
  );
}
