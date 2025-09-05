import { ChatMessage } from "@/types";
import { PartnerCard } from "./PartnerCard";

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.role === "user";

  const bubbleClasses = isUser
    ? "bg-primary-500 rounded-tr-none ml-auto"
    : "bg-neutral-800 rounded-tl-none mr-auto";

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
      className={`flex w-full flex-col gap-3 ${isUser ? "items-end" : "items-start"}`}
    >
      {/* Message bubble */}
      <div className="flex w-full">
        <div
          className={`max-w-3xl rounded-xl px-4 py-3 text-base leading-relaxed font-normal text-white ${bubbleClasses}`}
        >
          <div
            className="whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
          />
        </div>
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
