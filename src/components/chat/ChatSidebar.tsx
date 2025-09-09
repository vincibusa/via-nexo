"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  Trash2,
  Clock,
  Calendar,
  Plus,
  Edit3,
  Check,
  X,
} from "lucide-react";
import type { ChatSession } from "@/types";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onLoadSession: (sessionId: string) => Promise<void>;
  onDeleteSession: (sessionId: string) => Promise<void>;
  onRenameSession: (sessionId: string, newTitle: string) => Promise<void>;
  onNewSession: () => Promise<string>;
  collapsed?: boolean;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sessions,
  currentSessionId,
  onLoadSession,
  onDeleteSession,
  onRenameSession,
  onNewSession,
  collapsed = false,
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Oggi ${date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`;
    } else if (diffDays === 1) {
      return `Ieri ${date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`;
    } else if (diffDays < 7) {
      return `${diffDays} giorni fa`;
    } else {
      return date.toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      });
    }
  };

  const handleDeleteClick = (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (sessionToDelete) {
      try {
        await onDeleteSession(sessionToDelete);
        setSessionToDelete(null);
        setDeleteDialogOpen(false);
      } catch (error) {
        console.error("Failed to delete session:", error);
      }
    }
  };

  const handleLoadSession = async (sessionId: string) => {
    try {
      await onLoadSession(sessionId);
    } catch (error) {
      console.error("Failed to load session:", error);
    }
  };

  const handleNewSession = async () => {
    try {
      await onNewSession();
    } catch (error) {
      console.error("Failed to create new session:", error);
    }
  };

  const handleEditClick = (
    sessionId: string,
    currentTitle: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    setEditingSessionId(sessionId);
    setEditingTitle(currentTitle);
  };

  const handleSaveEdit = async (sessionId: string) => {
    if (!editingTitle.trim()) return;

    try {
      await onRenameSession(sessionId, editingTitle.trim());
      setEditingSessionId(null);
      setEditingTitle("");
    } catch (error) {
      console.error("Failed to rename session:", error);
      // Keep edit mode open on error so user can retry
    }
  };

  const handleCancelEdit = () => {
    setEditingSessionId(null);
    setEditingTitle("");
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    sessionId: string
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSaveEdit(sessionId);
    } else if (event.key === "Escape") {
      handleCancelEdit();
    }
  };

  // Group sessions by date
  const groupedSessions = sessions.reduce(
    (groups, session) => {
      const date = new Date(session.updatedAt);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      let groupKey;
      if (date.toDateString() === today.toDateString()) {
        groupKey = "Oggi";
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = "Ieri";
      } else if (date.getTime() > today.getTime() - 7 * 24 * 60 * 60 * 1000) {
        groupKey = "Questa settimana";
      } else {
        groupKey = "Più vecchie";
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(session);
      return groups;
    },
    {} as Record<string, ChatSession[]>
  );

  if (collapsed) return null;

  return (
    <div className="flex h-full flex-col p-4">
      {/* Header */}
      <div className="mb-6 flex items-center gap-2">
        <MessageSquare className="text-primary-400 h-5 w-5" />
        <h2 className="text-lg font-semibold text-white">Cronologia Chat</h2>
      </div>

      {/* New Chat Button */}
      <Button
        onClick={handleNewSession}
        className="bg-primary-600 hover:bg-primary-700 mb-4 flex items-center gap-2 text-white"
      >
        <Plus className="h-4 w-4" />
        Nuova Chat
      </Button>

      {/* Sessions List */}
      <ScrollArea className="flex-1">
        <div className="space-y-1">
          {Object.keys(groupedSessions).length === 0 ? (
            <div className="py-8 text-center text-neutral-500">
              <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">Nessuna chat salvata</p>
              <p className="mt-1 text-xs">Inizia una nuova conversazione</p>
            </div>
          ) : (
            Object.entries(groupedSessions).map(
              ([groupName, groupSessions]) => (
                <div key={groupName} className="mb-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
                    <Calendar className="h-3 w-3" />
                    {groupName}
                  </div>
                  <div className="space-y-1">
                    {groupSessions.map(session => (
                      <div
                        key={session.id}
                        className={cn(
                          "group flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-all duration-200 hover:bg-neutral-800/60",
                          currentSessionId === session.id
                            ? "bg-primary-900/30 border-primary-700/50 border"
                            : "hover:bg-neutral-800"
                        )}
                        onClick={() => handleLoadSession(session.id)}
                      >
                        <MessageSquare className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-500" />

                        <div className="min-w-0 flex-1">
                          {editingSessionId === session.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editingTitle}
                                onChange={e => setEditingTitle(e.target.value)}
                                onKeyDown={e => handleKeyDown(e, session.id)}
                                onBlur={() => handleSaveEdit(session.id)}
                                className="focus:border-primary-500 h-7 border-neutral-600 bg-neutral-800 text-sm text-neutral-200"
                                autoFocus
                                maxLength={100}
                                onClick={e => e.stopPropagation()}
                              />
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 hover:bg-green-900/30 hover:text-green-400"
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleSaveEdit(session.id);
                                  }}
                                  title="Salva"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 hover:bg-red-900/30 hover:text-red-400"
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleCancelEdit();
                                  }}
                                  title="Annulla"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="line-clamp-2 text-sm leading-snug font-medium text-neutral-200">
                              {session.title}
                            </p>
                          )}

                          <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(session.updatedAt)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 hover:bg-blue-900/30 hover:text-blue-400"
                            onClick={e =>
                              handleEditClick(session.id, session.title, e)
                            }
                            title="Rinomina chat"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 hover:bg-red-900/30 hover:text-red-400"
                            onClick={e => handleDeleteClick(session.id, e)}
                            title="Elimina chat"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )
          )}
        </div>
      </ScrollArea>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="border-neutral-700 bg-neutral-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Elimina conversazione
            </AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              Sei sicuro di voler eliminare questa conversazione? Questa azione
              non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-neutral-600 bg-neutral-800 text-neutral-200 hover:bg-neutral-700">
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
