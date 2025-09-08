/**
 * useChat Hook
 * Manages AI chat functionality for tourism recommendations
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { ChatMessage, ChatSession, Status } from "@/types";
import { CHAT_CONFIG } from "@/constants";
import { useChatDatabasePersistence } from "./useChatDatabasePersistence";

interface UseChatReturn {
  // State
  messages: ChatMessage[];
  status: Status;
  error: string | null;
  isTyping: boolean;

  // Actions
  sendMessage: (content: string) => Promise<void>;
  addMessage: (message: ChatMessage) => void;
  clearChat: () => void;
  clearMessages: () => void;
  retryLastMessage: () => Promise<void>;

  // Session management
  startNewSession: () => Promise<string>;
  loadSession: (sessionId: string) => Promise<void>;
  currentSessionId: string | null;
  sessions: ChatSession[];
  deleteSession: (sessionId: string) => Promise<void>;

  // Computed
  isLoading: boolean;
  canSend: boolean;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const lastUserMessageRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isLoadingSessionRef = useRef(false);

  // Persistence hooks
  const {
    sessions,
    currentSessionId,
    loadSession: loadSessionFromStorage,
    createNewSession,
    deleteSession,
    saveMessages,
  } = useChatDatabasePersistence();

  // Auto-save messages when they change (but not when loading a session)
  useEffect(() => {
    if (
      currentSessionId &&
      messages.length > 0 &&
      !isLoadingSessionRef.current
    ) {
      // Use a timeout to debounce saves and prevent excessive database writes
      const timeoutId = setTimeout(async () => {
        try {
          await saveMessages(currentSessionId, messages);
        } catch (err) {
          console.error("Failed to auto-save messages:", err);
        }
      }, 1000); // Increased timeout for database operations

      return () => clearTimeout(timeoutId);
    }
  }, [currentSessionId, messages, saveMessages]);

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

      // Create new session if none exists
      let sessionId = currentSessionId;
      if (!sessionId) {
        sessionId = await createNewSession(userMessage);
        // Don't add the message again since createNewSession already adds it
      } else {
        // Only add the message if we're using an existing session
        setMessages(prev => [...prev, userMessage]);
      }
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
        // Use AI Chat API for conversational responses
        const conversationHistory = messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        }));

        const response = await fetch("/api/chat/conversation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [
              ...conversationHistory,
              {
                role: "user",
                content: content.trim(),
              },
            ],
          }),
          signal: abortControllerRef.current?.signal,
        });

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error(
              "Too many requests. Please wait a moment and try again."
            );
          }
          throw new Error(`Chat request failed: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Chat request failed");
        }

        const assistantMessage: ChatMessage = {
          id: generateMessageId(),
          role: "assistant",
          content: data.message,
          timestamp: new Date().toISOString(),
          metadata: {
            searchQuery: content,
            partnersReturned: data.partners?.length || 0,
            confidence: 0.9,
          },
          partners: data.partners || [],
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
    [messages, status, currentSessionId, createNewSession]
  );

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const clearChat = useCallback(() => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setMessages([]);
    setError(null);
    setStatus("idle");
    setIsTyping(false);
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

  const startNewSession = useCallback(async () => {
    const sessionId = await createNewSession();
    setMessages([]);
    setError(null);
    setStatus("idle");
    setIsTyping(false);
    lastUserMessageRef.current = null;
    return sessionId;
  }, [createNewSession]);

  const loadSession = useCallback(
    async (sessionId: string) => {
      setStatus("loading");
      isLoadingSessionRef.current = true;

      try {
        const sessionMessages = await loadSessionFromStorage(sessionId);
        setMessages(sessionMessages);
        setError(null);
        setStatus("success");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load session");
        setStatus("error");
      } finally {
        // Allow saving again after a brief delay
        setTimeout(() => {
          isLoadingSessionRef.current = false;
        }, 100);
      }
    },
    [loadSessionFromStorage]
  );

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
    addMessage,
    clearChat,
    clearMessages,
    retryLastMessage,

    // Session management
    startNewSession,
    loadSession,
    currentSessionId,
    sessions,
    deleteSession,

    // Computed
    isLoading,
    canSend,
  };
}
