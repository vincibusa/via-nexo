import { ChatMessage } from "@/types";
import { PartnerCard } from "./PartnerCard";
import { Clock, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const bubbleClasses = isUser
    ? "bg-primary-500 rounded-tr-none ml-auto"
    : "bg-neutral-800 rounded-tl-none mr-auto";

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) {
      return "Ora";
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m fa`;
    } else if (diffMinutes < 1440) {
      // 24 hours
      const diffHours = Math.floor(diffMinutes / 60);
      return `${diffHours}h fa`;
    } else {
      return date.toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  // Parse markdown-style formatting for better display
  const formatMessage = (content: string) => {
    // Convert **text** to bold
    let formatted = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Convert URLs to clickable links
    formatted = formatted.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline">$1</a>'
    );

    return formatted;
  };

  return (
    <div
      className={`group flex w-full flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}
    >
      {/* Message bubble */}
      <div
        className={`flex w-full items-start gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
      >
        <div
          className={`max-w-3xl rounded-xl px-4 py-3 text-base leading-relaxed font-normal text-white ${bubbleClasses}`}
        >
          <div
            className="whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
          />
        </div>

        {/* Action buttons */}
        <div
          className={`flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${isUser ? "mr-2" : "ml-2"} mt-2`}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-neutral-700"
            onClick={copyToClipboard}
            title="Copia messaggio"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-400" />
            ) : (
              <Copy className="h-3 w-3 text-neutral-400" />
            )}
          </Button>
        </div>
      </div>

      {/* Timestamp */}
      <div
        className={`flex items-center gap-1 text-xs text-neutral-500 ${isUser ? "mr-14" : "ml-14"}`}
      >
        <Clock className="h-3 w-3" />
        <span>{formatTimestamp(message.timestamp)}</span>
      </div>

      {/* Partner cards (only for assistant messages) */}
      {!isUser && message.partners && message.partners.length > 0 && (
        <div className="mt-4 w-full">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {message.partners.map(partner => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
