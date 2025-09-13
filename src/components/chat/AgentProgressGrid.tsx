"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Hotel,
  Users,
  Calendar,
  MapPin,
  Loader2,
  CheckCircle2,
  XCircle,
  Search,
} from "lucide-react";

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

interface AgentState {
  status: "idle" | "searching" | "complete" | "error";
  partnersFound?: number;
  message?: string;
}

interface AgentProgressGridProps {
  agentProgress: AgentProgress[];
  isVisible: boolean;
}

const agentConfig = {
  hotel: {
    icon: Hotel,
    label: "Hotels",
    color: "text-blue-400",
  },
  restaurant: {
    icon: Users,
    label: "Restaurants",
    color: "text-orange-400",
  },
  tour: {
    icon: Calendar,
    label: "Tours",
    color: "text-green-400",
  },
  shuttle: {
    icon: MapPin,
    label: "Transport",
    color: "text-purple-400",
  },
} as const;

export function AgentProgressGrid({
  agentProgress,
  isVisible,
}: AgentProgressGridProps) {
  const [agentStates, setAgentStates] = useState<Record<string, AgentState>>({
    hotel: { status: "idle" },
    restaurant: { status: "idle" },
    tour: { status: "idle" },
    shuttle: { status: "idle" },
  });

  const [currentPhase, setCurrentPhase] = useState<string>("");

  useEffect(() => {
    if (agentProgress.length === 0) {
      // Reset all states
      setAgentStates({
        hotel: { status: "idle" },
        restaurant: { status: "idle" },
        tour: { status: "idle" },
        shuttle: { status: "idle" },
      });
      setCurrentPhase("");
      return;
    }

    const latestProgress = agentProgress[agentProgress.length - 1];

    // Update current phase
    if (latestProgress.type === "analyzing") {
      setCurrentPhase("🔍 Analyzing your travel request...");
    } else if (latestProgress.type === "finalizing") {
      setCurrentPhase("✨ Creating personalized recommendations...");
    } else if (latestProgress.type === "chat_processing") {
      setCurrentPhase("💭 Generating response...");
    } else if (latestProgress.type === "complete") {
      setCurrentPhase("✅ All searches complete!");
    }

    // Update agent-specific states
    if (latestProgress.agent) {
      setAgentStates(prev => {
        const newStates = { ...prev };
        const agent = latestProgress.agent!;

        if (latestProgress.type === "agent_start") {
          newStates[agent] = {
            status: "searching",
            message: "Searching...",
          };
        } else if (latestProgress.type === "agent_complete") {
          newStates[agent] = {
            status:
              latestProgress.partnersFound !== undefined &&
              latestProgress.partnersFound > 0
                ? "complete"
                : "error",
            partnersFound: latestProgress.partnersFound,
            message:
              latestProgress.partnersFound !== undefined &&
              latestProgress.partnersFound > 0
                ? `Found ${latestProgress.partnersFound} partners`
                : "No results found",
          };
        }

        return newStates;
      });
    }
  }, [agentProgress]);

  const getStatusIcon = (status: AgentState["status"]) => {
    switch (status) {
      case "idle":
        return <div className="h-4 w-4 rounded-full bg-neutral-600" />;
      case "searching":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
      case "complete":
        return <CheckCircle2 className="h-4 w-4 text-green-400" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-neutral-600" />;
    }
  };

  const getStatusColor = (status: AgentState["status"]) => {
    switch (status) {
      case "idle":
        return "border-neutral-700 bg-neutral-800/50";
      case "searching":
        return "border-blue-600/50 bg-blue-900/20";
      case "complete":
        return "border-green-600/50 bg-green-900/20";
      case "error":
        return "border-red-600/50 bg-red-900/20";
      default:
        return "border-neutral-700 bg-neutral-800/50";
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="mx-auto mb-4 w-full max-w-4xl">
      <Card className="border-neutral-700 bg-neutral-900/50">
        <CardContent className="p-4">
          {/* Current Phase */}
          {currentPhase && (
            <div className="mb-4 text-center">
              <div className="text-primary-300 flex items-center justify-center gap-2">
                <Search className="h-4 w-4" />
                <span className="text-sm font-medium">{currentPhase}</span>
              </div>
            </div>
          )}

          {/* Agent Grid */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            {Object.entries(agentConfig).map(([agentKey, config]) => {
              const state = agentStates[agentKey];
              const IconComponent = config.icon;

              return (
                <Card
                  key={agentKey}
                  className={`transition-all duration-200 ${getStatusColor(state.status)}`}
                >
                  <CardContent className="p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <IconComponent className={`h-4 w-4 ${config.color}`} />
                      <span className="text-xs font-medium text-neutral-200">
                        {config.label}
                      </span>
                      <div className="ml-auto">
                        {getStatusIcon(state.status)}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs text-neutral-400">
                        {state.message || "Waiting..."}
                      </div>

                      {state.partnersFound !== undefined &&
                        state.partnersFound > 0 && (
                          <Badge
                            variant="secondary"
                            className="px-1.5 py-0.5 text-xs"
                          >
                            {state.partnersFound} results
                          </Badge>
                        )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
