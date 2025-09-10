/**
 * useChatDatabasePersistence Hook
 * Manages database persistence for chat conversations with Supabase
 * Includes localStorage fallback for offline support and performance
 */

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type {
  ChatMessage,
  ChatSession,
  ConversationsListResponse,
  ConversationDetailResponse,
  ConversationCreateResponse,
  CreateMessageRequest,
  MessageCreateResponse,
  ApiErrorResponse,
  PartnerData,
} from "@/types";

interface UseChatDatabasePersistenceReturn {
  // Session management
  sessions: ChatSession[];
  currentSessionId: string | null;
  loadSession: (sessionId: string) => Promise<ChatMessage[]>;
  saveSession: (
    sessionId: string,
    messages: ChatMessage[],
    title?: string
  ) => Promise<void>;
  createNewSession: (initialMessage?: ChatMessage) => Promise<string>;
  deleteSession: (sessionId: string) => Promise<void>;
  clearAllSessions: () => Promise<void>;

  // Conversation history
  saveMessages: (sessionId: string, messages: ChatMessage[]) => Promise<void>;
  getSessionTitle: (sessionId: string) => string;
  updateSessionTitle: (sessionId: string, title: string) => Promise<void>;

  // State
  loading: boolean;
  error: string | null;
  isOnline: boolean;
}

const FALLBACK_STORAGE_KEY = "via-nexo-chat-sessions-fallback";
const MAX_SESSIONS = 50;
const MAX_SESSION_AGE_DAYS = 30;

export function useChatDatabasePersistence(): UseChatDatabasePersistenceReturn {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  const { user } = useAuth();

  // Debug logging
  console.log("[CHAT_PERSISTENCE] User state:", user?.email || "null");

  const loadSessionsFromFallback = useCallback(() => {
    try {
      const stored = localStorage.getItem(FALLBACK_STORAGE_KEY);
      if (stored) {
        const parsedSessions: ChatSession[] = JSON.parse(stored);

        // Filter out old sessions
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - MAX_SESSION_AGE_DAYS);

        const validSessions = parsedSessions
          .filter(session => new Date(session.updatedAt) > cutoffDate)
          .sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
          .slice(0, MAX_SESSIONS);

        setSessions(validSessions);
      }
    } catch (err) {
      console.error("Failed to load fallback sessions:", err);
    }
  }, []);

  const saveFallbackSessions = useCallback((sessionsToSave: ChatSession[]) => {
    try {
      localStorage.setItem(
        FALLBACK_STORAGE_KEY,
        JSON.stringify(sessionsToSave)
      );
    } catch (err) {
      console.error("Failed to save fallback sessions:", err);
    }
  }, []);

  const loadSessionsFromDatabase = useCallback(async () => {
    if (!user || !isOnline) {
      loadSessionsFromFallback();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat/conversations");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ConversationsListResponse | ApiErrorResponse =
        await response.json();

      if (!data.success) {
        throw new Error((data as ApiErrorResponse).error);
      }

      const conversationsData = data as ConversationsListResponse;

      // Convert database conversations to ChatSession format
      const chatSessions: ChatSession[] = conversationsData.data.map(conv => ({
        id: conv.id,
        title: conv.title,
        messages: [], // Messages will be loaded when session is opened
        context: { query: "" }, // Will be updated when messages are loaded
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      }));

      setSessions(chatSessions);

      // Save to fallback storage for offline access
      saveFallbackSessions(chatSessions);
    } catch (err) {
      console.error("Failed to load sessions from database:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load conversations"
      );

      // Fallback to localStorage
      loadSessionsFromFallback();
    } finally {
      setLoading(false);
    }
  }, [user, isOnline, loadSessionsFromFallback, saveFallbackSessions]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load sessions on mount and when user changes
  useEffect(() => {
    if (user) {
      loadSessionsFromDatabase();
    } else {
      setSessions([]);
      setCurrentSessionId(null);
    }
  }, [user, loadSessionsFromDatabase]);

  const generateSessionTitle = (firstMessage?: ChatMessage): string => {
    if (!firstMessage?.content) {
      return `Chat ${new Date().toLocaleDateString("it-IT")}`;
    }

    const title = firstMessage.content.slice(0, 50).replace(/\s+/g, " ").trim();

    return title.length > 47 ? `${title}...` : title;
  };

  const saveMessageToDatabase = useCallback(
    async (conversationId: string, message: ChatMessage): Promise<void> => {
      if (!user || !isOnline) return;

      // Include partners in metadata when saving to database
      const metadata = {
        ...message.metadata,
        ...(message.partners && { partners: message.partners }),
      };

      const requestData: CreateMessageRequest = {
        conversationId,
        role: message.role,
        content: message.content,
        metadata,
      };

      try {
        const response = await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: MessageCreateResponse | ApiErrorResponse =
          await response.json();

        if (!data.success) {
          throw new Error((data as ApiErrorResponse).error);
        }
      } catch (err) {
        console.error("Failed to save message to database:", err);
        // Don't throw - let the message stay in localStorage
      }
    },
    [user, isOnline]
  );

  const createNewSession = useCallback(
    async (initialMessage?: ChatMessage): Promise<string> => {
      const title = generateSessionTitle(initialMessage);

      if (!user || !isOnline) {
        // Fallback to localStorage behavior
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const now = new Date().toISOString();

        const newSession: ChatSession = {
          id: sessionId,
          title,
          messages: initialMessage ? [initialMessage] : [],
          context: { query: initialMessage?.content || "" },
          createdAt: now,
          updatedAt: now,
        };

        setSessions(prev => {
          const updated = [newSession, ...prev].slice(0, MAX_SESSIONS);
          saveFallbackSessions(updated);
          return updated;
        });

        setCurrentSessionId(sessionId);
        return sessionId;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/chat/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ConversationCreateResponse | ApiErrorResponse =
          await response.json();

        if (!data.success) {
          throw new Error((data as ApiErrorResponse).error);
        }

        const conversationData = data as ConversationCreateResponse;

        const newSession: ChatSession = {
          id: conversationData.data.id,
          title: conversationData.data.title,
          messages: initialMessage ? [initialMessage] : [],
          context: { query: initialMessage?.content || "" },
          createdAt: conversationData.data.createdAt,
          updatedAt: conversationData.data.updatedAt,
        };

        setSessions(prev => {
          const updated = [newSession, ...prev].slice(0, MAX_SESSIONS);
          saveFallbackSessions(updated);
          return updated;
        });

        setCurrentSessionId(conversationData.data.id);

        // Save initial message if provided
        if (initialMessage) {
          await saveMessageToDatabase(conversationData.data.id, initialMessage);
        }

        return conversationData.data.id;
      } catch (err) {
        console.error("Failed to create new session:", err);
        setError(
          err instanceof Error ? err.message : "Failed to create conversation"
        );

        // Fallback to localStorage
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const now = new Date().toISOString();

        const newSession: ChatSession = {
          id: sessionId,
          title,
          messages: initialMessage ? [initialMessage] : [],
          context: { query: initialMessage?.content || "" },
          createdAt: now,
          updatedAt: now,
        };

        setSessions(prev => {
          const updated = [newSession, ...prev].slice(0, MAX_SESSIONS);
          saveFallbackSessions(updated);
          return updated;
        });

        setCurrentSessionId(sessionId);
        return sessionId;
      } finally {
        setLoading(false);
      }
    },
    [user, isOnline, saveFallbackSessions, saveMessageToDatabase]
  );

  const loadSession = useCallback(
    async (sessionId: string): Promise<ChatMessage[]> => {
      // Avoid duplicate session ID setting if already current
      if (currentSessionId !== sessionId) {
        setCurrentSessionId(sessionId);
      }

      // Check if session exists locally with messages
      const localSession = sessions.find(s => s.id === sessionId);
      if (localSession && localSession.messages.length > 0) {
        console.log(
          `[CHAT_PERSISTENCE] Using cached messages for session ${sessionId}`
        );
        return localSession.messages;
      }

      if (!user || !isOnline) {
        return localSession?.messages || [];
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/chat/conversations/${sessionId}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ConversationDetailResponse | ApiErrorResponse =
          await response.json();

        if (!data.success) {
          throw new Error((data as ApiErrorResponse).error);
        }

        const conversationData = data as ConversationDetailResponse;

        // Reconstruct messages with partners from metadata
        const messagesWithPartners = conversationData.data.messages.map(
          msg => ({
            ...msg,
            partners:
              ((msg.metadata as { partners?: unknown[] })
                ?.partners as PartnerData[]) || [],
          })
        );

        // Update local session with messages only if it's different to prevent unnecessary re-renders
        setSessions(prev => {
          const sessionIndex = prev.findIndex(s => s.id === sessionId);
          if (sessionIndex === -1) return prev;

          const currentSession = prev[sessionIndex];
          const updatedSession = {
            ...currentSession,
            messages: messagesWithPartners,
            context: {
              query:
                messagesWithPartners.find(m => m.role === "user")?.content ||
                currentSession.context.query,
            },
          };

          // Only update if there's actually a change
          if (
            JSON.stringify(currentSession.messages) !==
            JSON.stringify(messagesWithPartners)
          ) {
            const newSessions = [...prev];
            newSessions[sessionIndex] = updatedSession;
            return newSessions;
          }

          return prev;
        });

        return messagesWithPartners;
      } catch (err) {
        console.error("Failed to load session:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load conversation"
        );
        return localSession?.messages || [];
      } finally {
        setLoading(false);
      }
    },
    [user, isOnline, sessions, currentSessionId]
  );

  const saveMessages = useCallback(
    async (sessionId: string, messages: ChatMessage[]): Promise<void> => {
      // Update local state immediately
      setSessions(prev =>
        prev.map(session => {
          if (session.id === sessionId) {
            const updated = {
              ...session,
              messages,
              updatedAt: new Date().toISOString(),
            };
            return updated;
          }
          return session;
        })
      );

      // Save to fallback storage
      setSessions(prev => {
        saveFallbackSessions(prev);
        return prev;
      });

      // Save new messages to database
      if (user && isOnline) {
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
          const newMessages = messages.slice(session.messages.length);

          for (const message of newMessages) {
            await saveMessageToDatabase(sessionId, message);
          }
        }
      }
    },
    [user, isOnline, sessions, saveMessageToDatabase, saveFallbackSessions]
  );

  const updateSessionTitle = useCallback(
    async (sessionId: string, title: string): Promise<void> => {
      // Update local state immediately
      setSessions(prev =>
        prev.map(session => {
          if (session.id === sessionId) {
            return { ...session, title };
          }
          return session;
        })
      );

      if (!user || !isOnline) return;

      try {
        const response = await fetch(`/api/chat/conversations/${sessionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error);
        }
      } catch (err) {
        console.error("Failed to update session title:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to update conversation title"
        );
      }
    },
    [user, isOnline]
  );

  const saveSession = useCallback(
    async (
      sessionId: string,
      messages: ChatMessage[],
      title?: string
    ): Promise<void> => {
      await saveMessages(sessionId, messages);

      if (title) {
        await updateSessionTitle(sessionId, title);
      }
    },
    [saveMessages, updateSessionTitle]
  );

  const deleteSession = useCallback(
    async (sessionId: string): Promise<void> => {
      // Update local state immediately
      setSessions(prev => {
        const updated = prev.filter(s => s.id !== sessionId);
        saveFallbackSessions(updated);
        return updated;
      });

      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
      }

      if (!user || !isOnline) return;

      try {
        const response = await fetch(`/api/chat/conversations/${sessionId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error);
        }
      } catch (err) {
        console.error("Failed to delete session:", err);
        setError(
          err instanceof Error ? err.message : "Failed to delete conversation"
        );
      }
    },
    [user, isOnline, currentSessionId, saveFallbackSessions]
  );

  const clearAllSessions = useCallback(async (): Promise<void> => {
    setSessions([]);
    setCurrentSessionId(null);
    localStorage.removeItem(FALLBACK_STORAGE_KEY);

    // Note: We don't delete from database here as that would be destructive
    // Users should delete sessions individually if needed
  }, []);

  const getSessionTitle = useCallback(
    (sessionId: string): string => {
      const session = sessions.find(s => s.id === sessionId);
      return session?.title || `Chat ${sessionId.slice(-8)}`;
    },
    [sessions]
  );

  return {
    sessions,
    currentSessionId,
    loadSession,
    saveSession,
    createNewSession,
    deleteSession,
    clearAllSessions,
    saveMessages,
    getSessionTitle,
    updateSessionTitle,
    loading,
    error,
    isOnline,
  };
}
