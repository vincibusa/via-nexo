import { ChatMessage } from "@/types";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { ConversationStarters } from "./ConversationStarters";
import { AgentProgressGrid } from "./AgentProgressGrid";
import { PlanningProgressGrid } from "./PlanningProgressGrid";
import { useEffect, useRef } from "react";

interface AgentProgress {
  type:
    | "analyzing"
    | "agent_start"
    | "agent_complete"
    | "finalizing"
    | "chat_processing"
    | "complete"
    | "error"
    | "end";
  agent?: "hotel" | "restaurant" | "tour" | "shuttle";
  partnersFound?: number;
  message: string;
  timestamp: number;
}

interface PlanningProgress {
  type:
    | "analyzing_partners"
    | "optimizing_geography"
    | "creating_itinerary"
    | "adding_recommendations"
    | "finalizing_plan"
    | "planning_complete"
    | "planning_error"
    | "planning_end";
  message: string;
  timestamp: number;
  partnersProcessed?: number;
  totalPartners?: number;
}

interface ChatMessagesProps {
  messages: ChatMessage[];
  error?: string | null;
  onRetry?: () => void;
  isLoading?: boolean;
  onSendMessage?: (message: string) => void;
  agentProgress?: AgentProgress[];
  isStreamingResponse?: boolean;
  planningProgress?: PlanningProgress[];
  isStreamingPlanning?: boolean;
}

export const ChatMessages = ({
  messages,
  error,
  onRetry,
  isLoading,
  onSendMessage,
  agentProgress = [],
  isStreamingResponse = false,
  planningProgress = [],
  isStreamingPlanning = false,
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
      {/* Show conversation starters if no messages */}
      {messages.length === 0 && !isLoading && onSendMessage && (
        <ConversationStarters onSelectStarter={onSendMessage} />
      )}

      {messages.map(message => {
        // If the message is a planning message, render the progress grid
        if (message.metadata?.type === "planning") {
          const progress = message.metadata.progress as
            | AgentProgress[]
            | undefined;
          if (!progress || progress.length === 0) return null;

          // We only want to show the grid, not a bubble
          return (
            <AgentProgressGrid
              key={message.id}
              agentProgress={progress}
              isVisible={true}
            />
          );
        }

        // Otherwise, render the standard message bubble
        return <MessageBubble key={message.id} message={message} />;
      })}

      {/* Planning progress grid when streaming planning */}
      <PlanningProgressGrid
        planningProgress={planningProgress}
        isVisible={isStreamingPlanning && planningProgress.length > 0}
      />

      {/* Typing indicator when loading (but not during streaming) */}
      {isLoading && !error && !isStreamingResponse && !isStreamingPlanning && (
        <TypingIndicator />
      )}

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
