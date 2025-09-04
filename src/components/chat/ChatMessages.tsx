import { ChatMessage } from "@/types";
import { MessageBubble } from "./MessageBubble";
import { useEffect, useRef } from "react";

interface ChatMessagesProps {
  messages: ChatMessage[];
}

export const ChatMessages = ({ messages }: ChatMessagesProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 space-y-6 overflow-y-auto scroll-smooth p-4">
      {messages.map(message => (
        <MessageBubble key={message.id} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};
