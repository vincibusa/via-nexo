/**
 * useChat Hook
 * Manages AI chat functionality for tourism recommendations
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { ChatMessage, ChatSession, Status, PartnerData } from "@/types";
import { CHAT_CONFIG } from "@/constants";
import { useChatDatabasePersistence } from "./useChatDatabasePersistence";

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

export interface UseChatReturn {
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
  renameSession: (sessionId: string, newTitle: string) => Promise<void>;

  // Progress tracking
  agentProgress: AgentProgress[];
  isStreamingResponse: boolean;

  // Computed
  isLoading: boolean;
  canSend: boolean;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [agentProgress, setAgentProgress] = useState<AgentProgress[]>([]);
  const [isStreamingResponse, setIsStreamingResponse] = useState(false);

  const lastUserMessageRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isLoadingSessionRef = useRef(false);
  const isManualSelectionRef = useRef(false);

  // Persistence hooks
  const {
    sessions,
    currentSessionId,
    loadSession: loadSessionFromStorage,
    createNewSession,
    deleteSession,
    updateSessionTitle,
    saveMessages,
  } = useChatDatabasePersistence();

  // Auto-save messages when they change (but not when loading a session)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (
      currentSessionId &&
      messages.length > 0 &&
      !isLoadingSessionRef.current
    ) {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce saves to prevent excessive database writes
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          console.log(
            `[CHAT] Auto-saving ${messages.length} messages for session ${currentSessionId}`
          );
          await saveMessages(currentSessionId, messages);
        } catch (err) {
          console.error("Failed to auto-save messages:", err);
        }
      }, 2000); // Increased timeout for database operations

      return () => {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
      };
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

      // ALWAYS add user message to UI immediately for instant visibility
      setMessages(prev => [...prev, userMessage]);

      // Create new session if none exists (without passing the message to avoid duplication)
      let sessionId = currentSessionId;
      if (!sessionId) {
        sessionId = await createNewSession();
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
        // Use streaming AI Chat API for real-time progress
        const conversationHistory = messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        }));

        setIsStreamingResponse(true);
        setAgentProgress([]);

        const response = await fetch("/api/chat/conversation/stream", {
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

        // Handle Server-Sent Events
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("Failed to read streaming response");
        }

        let finalMessage = "";
        let finalPartners: PartnerData[] = [];
        let planningMessageId: string | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const eventData = JSON.parse(line.slice(6));

                // Handle different event types
                if (
                  eventData.category === "progress" ||
                  eventData.type === "analyzing" ||
                  eventData.type === "agent_start" ||
                  eventData.type === "agent_complete" ||
                  eventData.type === "finalizing" ||
                  eventData.type === "chat_processing"
                ) {
                  // Persist planning steps as a distinct message
                  setMessages(prevMessages => {
                    if (!planningMessageId) {
                      // Create a new planning message
                      planningMessageId = generateMessageId();
                      const newPlanningMessage: ChatMessage = {
                        id: planningMessageId,
                        role: "assistant",
                        content: "", // No text content for this type
                        timestamp: new Date().toISOString(),
                        metadata: {
                          type: "planning",
                          progress: [eventData],
                        },
                      };
                      return [...prevMessages, newPlanningMessage];
                    }
                    // Update existing planning message
                    return prevMessages.map(msg => {
                      if (msg.id === planningMessageId) {
                        const currentProgress =
                          (msg.metadata?.progress as AgentProgress[]) || [];
                        return {
                          ...msg,
                          metadata: {
                            ...msg.metadata,
                            type: "planning",
                            progress: [...currentProgress, eventData],
                          },
                        };
                      }
                      return msg;
                    });
                  });

                  // Also update the temporary agentProgress state for any UI that uses it directly
                  setAgentProgress(prev => {
                    const newProgress = [...prev, eventData];
                    return newProgress.slice(-10); // Keep only last 10 progress updates
                  });
                } else if (eventData.type === "complete") {
                  finalMessage = eventData.message;
                  finalPartners = eventData.partners || [];
                } else if (eventData.type === "error") {
                  throw new Error(eventData.message);
                } else if (eventData.type === "end") {
                  // Stream completed
                  break;
                }
              } catch (parseError) {
                console.warn("[CHAT] Failed to parse SSE data:", parseError);
              }
            }
          }
        }

        if (!finalMessage) {
          throw new Error("No response received from chat API");
        }

        const assistantMessage: ChatMessage = {
          id: generateMessageId(),
          role: "assistant",
          content: finalMessage,
          timestamp: new Date().toISOString(),
          metadata: {
            searchQuery: content,
            partnersReturned: finalPartners?.length || 0,
            confidence: 0.9,
          },
          partners: finalPartners || [],
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
        setIsStreamingResponse(false);
        setAgentProgress([]);
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
    async (sessionId: string, isManualSelection = true) => {
      // Prevent duplicate loading if already loading the same session
      if (isLoadingSessionRef.current && currentSessionId === sessionId) {
        return;
      }

      setStatus("loading");
      isLoadingSessionRef.current = true;
      isManualSelectionRef.current = isManualSelection;

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
          isManualSelectionRef.current = false;
        }, 100);
      }
    },
    [loadSessionFromStorage, currentSessionId]
  );

  // Auto-load the most recent session only once on initial mount
  const hasAutoLoadedRef = useRef(false);
  useEffect(() => {
    console.log("[CHAT] Auto-load check:", {
      sessionsLength: sessions.length,
      messagesLength: messages.length,
      currentSessionId,
      isLoadingSession: isLoadingSessionRef.current,
      status,
      hasAutoLoaded: hasAutoLoadedRef.current,
    });

    if (
      sessions.length > 0 &&
      messages.length === 0 &&
      !currentSessionId &&
      !isLoadingSessionRef.current &&
      status === "idle" &&
      !hasAutoLoadedRef.current // Only auto-load once
    ) {
      hasAutoLoadedRef.current = true;
      const mostRecentSession = sessions[0]; // sessions are sorted by updatedAt desc
      console.log(
        "[CHAT] ✅ Auto-loading most recent session:",
        mostRecentSession.id,
        mostRecentSession.title
      );
      loadSession(mostRecentSession.id, false); // Auto-load, not manual selection
    }
  }, [sessions.length, currentSessionId, messages.length, status, loadSession]);

  const renameSession = useCallback(
    async (sessionId: string, newTitle: string) => {
      try {
        await updateSessionTitle(sessionId, newTitle);
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : "Failed to rename session"
        );
      }
    },
    [updateSessionTitle]
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
    renameSession,

    // Progress tracking
    agentProgress,
    isStreamingResponse,

    // Computed
    isLoading,
    canSend,
  };
}
