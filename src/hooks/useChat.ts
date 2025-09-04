/**
 * useChat Hook
 * Manages AI chat functionality for tourism recommendations
 */

import { useState, useCallback, useRef } from "react";
import type { ChatMessage, ChatSession, Status } from "@/types";
import { CHAT_CONFIG } from "@/constants";

interface UseChatReturn {
  // State
  messages: ChatMessage[];
  status: Status;
  error: string | null;
  isTyping: boolean;

  // Actions
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  retryLastMessage: () => Promise<void>;

  // Session management
  startNewSession: () => void;
  loadSession: (sessionId: string) => Promise<void>;

  // Computed
  isLoading: boolean;
  canSend: boolean;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null
  );

  const lastUserMessageRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generateMessageId = () =>
    `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || status === "loading") return;

      // Validate message length
      if (content.length > CHAT_CONFIG.maxMessageLength) {
        setError(
          `Message too long. Maximum ${CHAT_CONFIG.maxMessageLength} characters allowed.`
        );
        return;
      }

      // Check message limit
      if (messages.length >= CHAT_CONFIG.maxMessages) {
        setError("Message limit reached. Please start a new chat.");
        return;
      }

      const userMessage: ChatMessage = {
        id: generateMessageId(),
        role: "user",
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, userMessage]);
      setStatus("loading");
      setError(null);
      setIsTyping(true);
      lastUserMessageRef.current = content.trim();

      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        // Simulate typing delay
        await new Promise(resolve =>
          setTimeout(resolve, CHAT_CONFIG.typingIndicatorMs)
        );

        // TODO: Replace with actual AI API call when backend is ready
        // Simulate AI response for now
        const assistantMessage: ChatMessage = {
          id: generateMessageId(),
          role: "assistant",
          content: `Thank you for your message: "${content}". I'm here to help you discover amazing places in Italy! I can recommend hotels, restaurants, tours, and unique experiences. What type of recommendations are you looking for?`,
          timestamp: new Date().toISOString(),
          metadata: {
            searchQuery: content,
            partnersReturned: 0,
            confidence: 0.85,
          },
        };

        setMessages(prev => [...prev, assistantMessage]);
        setStatus("success");
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return; // Request was cancelled
        }

        const errorMessage =
          err instanceof Error ? err.message : "Failed to send message";
        setError(errorMessage);
        setStatus("error");

        // Remove the user message that failed to get a response
        setMessages(prev => prev.slice(0, -1));
      } finally {
        setIsTyping(false);
        abortControllerRef.current = null;
      }
    },
    [messages.length, status]
  );

  const clearChat = useCallback(() => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setMessages([]);
    setError(null);
    setStatus("idle");
    setIsTyping(false);
    setCurrentSession(null);
    lastUserMessageRef.current = null;
  }, []);

  const retryLastMessage = useCallback(async () => {
    if (!lastUserMessageRef.current) return;

    // Remove the last assistant message if it was an error
    setMessages(prev => {
      const lastMessage = prev[prev.length - 1];
      if (lastMessage?.role === "assistant") {
        return prev.slice(0, -1);
      }
      return prev;
    });

    await sendMessage(lastUserMessageRef.current);
  }, [sendMessage]);

  const startNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      messages: [],
      context: { query: "" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCurrentSession(newSession);
    clearChat();
  }, [clearChat]);

  const loadSession = useCallback(async (sessionId: string) => {
    setStatus("loading");

    try {
      // TODO: Load session from storage/API when backend is ready
      // For now, just simulate loading
      await new Promise(resolve => setTimeout(resolve, 500));

      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load session");
      setStatus("error");
    }
  }, []);

  // Computed properties
  const isLoading = status === "loading" || isTyping;
  const canSend = status !== "loading" && !isTyping;

  return {
    // State
    messages,
    status,
    error,
    isTyping,

    // Actions
    sendMessage,
    clearChat,
    retryLastMessage,

    // Session management
    startNewSession,
    loadSession,

    // Computed
    isLoading,
    canSend,
  };
}
