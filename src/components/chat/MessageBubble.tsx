import { ChatMessage, PartnerData } from "@/types";
import { PartnersModal } from "./PartnersModal";
import { Clock, Copy, Check, MapPin } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePlanning } from "@/contexts/PlanningContext";

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [showPartnersModal, setShowPartnersModal] = useState(false);
  const { startPlanning } = usePlanning();

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

  const handleStartPlanning = async (selectedPartners: PartnerData[]) => {
    console.log(
      "[MESSAGE_BUBBLE] Starting planning with",
      selectedPartners.length,
      "partners"
    );
    try {
      await startPlanning(
        selectedPartners,
        message.content ||
          "Crea un piano di viaggio ottimizzato con i partner selezionati"
      );
    } catch (error) {
      console.error("[MESSAGE_BUBBLE] Error starting planning:", error);
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

      {/* Partner button (only for assistant messages) */}
      {!isUser && message.partners && message.partners.length > 0 && (
        <>
          <div className="mt-4 ml-14">
            <Button
              variant="outline"
              className="flex items-center gap-2 border-neutral-600 bg-neutral-800 text-neutral-200 hover:border-neutral-500 hover:bg-neutral-700"
              onClick={() => setShowPartnersModal(true)}
            >
              <MapPin className="text-primary-400 h-4 w-4" />
              <span>Vedi partner consigliati</span>
              <span className="bg-primary-500 rounded-full px-2 py-0.5 text-xs font-medium text-white">
                {message.partners.length}
              </span>
            </Button>
          </div>

          <PartnersModal
            partners={message.partners}
            open={showPartnersModal}
            onOpenChange={setShowPartnersModal}
            onStartPlanning={handleStartPlanning}
          />
        </>
      )}
    </div>
  );
};
