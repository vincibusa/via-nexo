"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
import { History, MessageSquare, Trash2, Clock, Calendar } from "lucide-react";
import type { ChatSession } from "@/types";
import { cn } from "@/lib/utils";

interface ChatHistoryProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onLoadSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onNewSession: () => void;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({
  sessions,
  currentSessionId,
  onLoadSession,
  onDeleteSession,
  onNewSession,
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

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

  const getMessageCount = (session: ChatSession) => {
    const userMessages = session.messages.filter(m => m.role === "user").length;
    return userMessages;
  };

  const handleDeleteClick = (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (sessionToDelete) {
      onDeleteSession(sessionToDelete);
      setSessionToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const handleLoadSession = (sessionId: string) => {
    onLoadSession(sessionId);
    setIsOpen(false);
  };

  const handleNewSession = () => {
    onNewSession();
    setIsOpen(false);
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

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 hover:bg-neutral-800"
            title="Cronologia chat"
          >
            <History className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-80 border-r border-neutral-700 bg-neutral-900/95 backdrop-blur-sm"
        >
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-white">
              <MessageSquare className="h-5 w-5" />
              Cronologia Chat
            </SheetTitle>
            <SheetDescription className="text-neutral-400">
              Le tue conversazioni recenti con Via Nexo AI
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 mb-4">
            <Button
              onClick={handleNewSession}
              className="bg-primary-600 hover:bg-primary-700 w-full text-white"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Nuova Chat
            </Button>
          </div>

          <ScrollArea className="h-[calc(100vh-150px)]">
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
                              <p className="line-clamp-2 text-sm leading-snug font-medium text-neutral-200">
                                {session.title}
                              </p>

                              <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
                                <Clock className="h-3 w-3" />
                                <span>{formatDate(session.updatedAt)}</span>
                                <span>•</span>
                                <span>{getMessageCount(session)} messaggi</span>
                              </div>
                            </div>

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
                        ))}
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

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
    </>
  );
};
