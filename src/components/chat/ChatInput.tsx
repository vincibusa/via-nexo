import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendIcon } from "@/components/page/Icons";
import { useAutoResize } from "@/hooks/useAutoResize";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const ChatInput = ({
  onSendMessage,
  isLoading,
  error,
  onRetry,
}: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize the textarea based on content
  useAutoResize(textareaRef, message, 1, 4);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading && !error) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter without Shift = submit message
    // Shift+Enter = new line (default behavior)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (message.trim() && !isLoading && !error) {
        onSendMessage(message);
        setMessage("");
      }
    }
  };

  return (
    <div className="mt-auto pt-4">
      <div className="mb-4 grid grid-cols-2 gap-2 text-center text-sm sm:grid-cols-4 sm:gap-4">
        <Button
          className="glass-light hover:bg-primary-800 rounded-lg p-3"
          variant="ghost"
        >
          Popular cities
        </Button>
        <Button
          className="glass-light hover:bg-primary-800 rounded-lg p-3"
          variant="ghost"
        >
          Hidden gems
        </Button>
        <Button
          className="glass-light hover:bg-primary-800 rounded-lg p-3"
          variant="ghost"
        >
          Best beaches
        </Button>
        <Button
          className="glass-light hover:bg-primary-800 rounded-lg p-3"
          variant="ghost"
        >
          Budget travel
        </Button>
      </div>
      {/* Input area con stato di errore */}
      <div
        className={`rounded-xl p-2 ${error ? "border border-red-500/20 bg-red-500/5" : "glass-light"}`}
      >
        {error ? (
          // Stato di errore - mostra retry
          <div className="flex items-center gap-3 p-3">
            <div className="flex-1 text-red-200">
              <span className="text-sm">
                ❌ Impossibile inviare il messaggio
              </span>
            </div>
            <Button
              onClick={handleRetry}
              className="border border-red-500/40 bg-red-500/20 text-red-200 transition-colors hover:bg-red-500/30 hover:text-red-100"
              variant="ghost"
            >
              🔄 Riprova
            </Button>
            <Button
              onClick={() => window.location.reload()}
              className="bg-neutral-700 text-neutral-200 hover:bg-neutral-600"
              variant="ghost"
            >
              ↻ Reset Chat
            </Button>
          </div>
        ) : (
          // Stato normale - input form
          <form className="flex items-start gap-2" onSubmit={handleSubmit}>
            <Textarea
              ref={textareaRef}
              className="focus:ring-primary-500 min-h-[2.75rem] flex-1 resize-none rounded-lg border-none bg-neutral-700 px-4 py-3 text-base font-normal text-neutral-100 placeholder-neutral-400 focus:ring-2 focus:outline-none"
              placeholder={
                isLoading
                  ? "Elaborando..."
                  : "Scrivi il tuo messaggio... (Shift+Enter per andare a capo)"
              }
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={1}
            />
            <Button
              type="submit"
              className="bg-primary-500 hover:bg-primary-700 flex h-10 w-10 items-center justify-center rounded-lg text-white transition-colors disabled:opacity-50 sm:w-auto sm:px-4 sm:text-sm sm:leading-normal sm:font-medium"
              disabled={isLoading || !message.trim()}
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <SendIcon className="h-6 w-6 sm:hidden" />
                  <span className="hidden sm:inline">Send</span>
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
