import { ChatMessage } from "@/types";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { useEffect, useRef } from "react";

interface ChatMessagesProps {
  messages: ChatMessage[];
  error?: string | null;
  onRetry?: () => void;
  isLoading?: boolean;
}

export const ChatMessages = ({
  messages,
  error,
  onRetry,
  isLoading,
}: ChatMessagesProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex-1 space-y-6 overflow-y-auto scroll-smooth p-4">
      {messages.map(message => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {/* Typing indicator when loading */}
      {isLoading && !error && <TypingIndicator />}

      {/* Messaggio di errore con pulsante retry */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm font-medium text-red-400">
                ⚠️ Errore
              </span>
            </div>
            <p className="text-sm leading-relaxed text-red-200">{error}</p>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/20 px-4 py-2 text-sm font-medium text-red-200 transition-colors hover:bg-red-500/30 hover:text-red-100"
            >
              🔄 Riprova
            </button>
          )}
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};
