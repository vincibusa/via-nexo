"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatSession } from "@/types";
import { ChatSidebar } from "./ChatSidebar";

interface ChatLayoutProps {
  children: React.ReactNode;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onLoadSession: (sessionId: string) => Promise<void>;
  onDeleteSession: (sessionId: string) => Promise<void>;
  onNewSession: () => Promise<string>;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({
  children,
  sessions,
  currentSessionId,
  onLoadSession,
  onDeleteSession,
  onNewSession,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Default to closed

  // Check if we're on mobile/tablet and set initial state
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobile = window.innerWidth < 1024; // lg breakpoint
      setSidebarCollapsed(isMobile);
    };

    // Set initial state
    checkScreenSize();

    // Listen for resize events
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return (
    <div className="flex h-screen">
      {/* Mobile Overlay */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Fixed Sidebar */}
      <div
        className={cn(
          "top-[] fixed left-0 z-30 flex h-screen flex-col border-r border-neutral-700 bg-neutral-900/95 transition-all duration-300",
          sidebarCollapsed ? "w-0" : "w-80"
        )}
      >
        <div
          className={cn(
            "flex h-full flex-col transition-opacity duration-300",
            sidebarCollapsed ? "pointer-events-none opacity-0" : "opacity-100"
          )}
        >
          <ChatSidebar
            sessions={sessions}
            currentSessionId={currentSessionId}
            onLoadSession={onLoadSession}
            onDeleteSession={onDeleteSession}
            onNewSession={onNewSession}
            collapsed={sidebarCollapsed}
          />
        </div>
      </div>

      {/* Toggle Button */}
      <div
        className={cn(
          "fixed top-1/2 z-40 -translate-y-1/2 transition-all duration-300",
          sidebarCollapsed ? "left-0" : "left-80"
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="h-10 w-8 rounded-l-none rounded-r-lg border border-l-0 border-neutral-700 bg-neutral-800/50 backdrop-blur-sm hover:bg-neutral-700"
          title={sidebarCollapsed ? "Apri sidebar" : "Chiudi sidebar"}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Main Content */}
      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-300",
          sidebarCollapsed ? "ml-0" : "ml-0 lg:ml-80"
        )}
      >
        {children}
      </div>
    </div>
  );
};
