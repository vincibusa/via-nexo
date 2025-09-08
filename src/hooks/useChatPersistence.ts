/**
 * useChatPersistence Hook
 * Manages localStorage persistence for chat conversations
 */

import { useEffect, useState, useCallback } from "react";
import type { ChatMessage, ChatSession } from "@/types";

interface UseChatPersistenceReturn {
  // Session management
  sessions: ChatSession[];
  currentSessionId: string | null;
  loadSession: (sessionId: string) => ChatMessage[];
  saveSession: (
    sessionId: string,
    messages: ChatMessage[],
    title?: string
  ) => void;
  createNewSession: (initialMessage?: ChatMessage) => string;
  deleteSession: (sessionId: string) => void;
  clearAllSessions: () => void;

  // Conversation history
  saveMessages: (sessionId: string, messages: ChatMessage[]) => void;
  getSessionTitle: (sessionId: string) => string;
  updateSessionTitle: (sessionId: string, title: string) => void;
}

const STORAGE_KEY = "via-nexo-chat-sessions";
const MAX_SESSIONS = 50;
const MAX_SESSION_AGE_DAYS = 30;

export function useChatPersistence(): UseChatPersistenceReturn {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Load sessions from localStorage on mount
  useEffect(() => {
    const loadSessions = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsedSessions: ChatSession[] = JSON.parse(stored);

          // Filter out old sessions
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - MAX_SESSION_AGE_DAYS);

          const validSessions = parsedSessions.filter(
            session => new Date(session.updatedAt) > cutoffDate
          );

          // Limit number of sessions
          const limitedSessions = validSessions
            .sort(
              (a, b) =>
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime()
            )
            .slice(0, MAX_SESSIONS);

          setSessions(limitedSessions);

          // Update localStorage if we filtered anything
          if (limitedSessions.length !== parsedSessions.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedSessions));
          }
        }
      } catch (error) {
        console.error("Failed to load chat sessions:", error);
        localStorage.removeItem(STORAGE_KEY);
      }
    };

    loadSessions();
  }, []);

  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  };

  const generateSessionTitle = (firstMessage?: ChatMessage): string => {
    if (!firstMessage?.content) {
      return `Chat ${new Date().toLocaleDateString("it-IT")}`;
    }

    // Create a title from the first user message
    const title = firstMessage.content
      .slice(0, 50) // Limit length
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();

    return title.length > 47 ? `${title}...` : title;
  };

  const createNewSession = useCallback(
    (initialMessage?: ChatMessage): string => {
      const sessionId = generateSessionId();
      const now = new Date().toISOString();

      const newSession: ChatSession = {
        id: sessionId,
        title: generateSessionTitle(initialMessage),
        messages: initialMessage ? [initialMessage] : [],
        context: {
          query: initialMessage?.content || "",
        },
        createdAt: now,
        updatedAt: now,
      };

      setSessions(currentSessions => {
        const updatedSessions = [newSession, ...currentSessions]
          .sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
          .slice(0, MAX_SESSIONS);

        // Save to localStorage
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
        } catch (error) {
          console.error("Failed to save chat sessions:", error);
        }

        return updatedSessions;
      });

      setCurrentSessionId(sessionId);

      return sessionId;
    },
    []
  );

  const saveSession = useCallback(
    (sessionId: string, messages: ChatMessage[], title?: string) => {
      const now = new Date().toISOString();

      setSessions(currentSessions => {
        const updatedSessions = currentSessions.map(session => {
          if (session.id === sessionId) {
            return {
              ...session,
              title:
                title || session.title || generateSessionTitle(messages[0]),
              messages,
              updatedAt: now,
              context: {
                ...session.context,
                query:
                  messages.find(m => m.role === "user")?.content ||
                  session.context.query,
              },
            };
          }
          return session;
        });

        // If session doesn't exist, create it
        if (!currentSessions.find(s => s.id === sessionId)) {
          const newSession: ChatSession = {
            id: sessionId,
            title: title || generateSessionTitle(messages[0]),
            messages,
            context: {
              query: messages.find(m => m.role === "user")?.content || "",
            },
            createdAt: now,
            updatedAt: now,
          };
          updatedSessions.unshift(newSession);
        }

        const sortedSessions = updatedSessions
          .sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
          .slice(0, MAX_SESSIONS);

        // Save to localStorage
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sortedSessions));
        } catch (error) {
          console.error("Failed to save chat sessions:", error);
        }

        return sortedSessions;
      });
    },
    []
  );

  const loadSession = useCallback(
    (sessionId: string): ChatMessage[] => {
      const session = sessions.find(s => s.id === sessionId);
      setCurrentSessionId(sessionId);
      return session?.messages || [];
    },
    [sessions]
  );

  const deleteSession = useCallback(
    (sessionId: string) => {
      setSessions(currentSessions => {
        const updatedSessions = currentSessions.filter(s => s.id !== sessionId);

        // Save to localStorage
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
        } catch (error) {
          console.error("Failed to save chat sessions:", error);
        }

        return updatedSessions;
      });

      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
      }
    },
    [currentSessionId]
  );

  const clearAllSessions = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSessions([]);
    setCurrentSessionId(null);
  }, []);

  const saveMessages = useCallback(
    (sessionId: string, messages: ChatMessage[]) => {
      saveSession(sessionId, messages);
    },
    [saveSession]
  );

  const getSessionTitle = useCallback(
    (sessionId: string): string => {
      const session = sessions.find(s => s.id === sessionId);
      return session?.title || `Chat ${sessionId.slice(-8)}`;
    },
    [sessions]
  );

  const updateSessionTitle = useCallback((sessionId: string, title: string) => {
    setSessions(currentSessions => {
      const updatedSessions = currentSessions.map(session => {
        if (session.id === sessionId) {
          return { ...session, title };
        }
        return session;
      });

      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
      } catch (error) {
        console.error("Failed to save chat sessions:", error);
      }

      return updatedSessions;
    });
  }, []);

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
  };
}
