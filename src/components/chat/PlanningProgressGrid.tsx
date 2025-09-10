"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  MapPin,
  Calendar,
  Lightbulb,
  CheckCircle2,
  Loader2,
  Users,
} from "lucide-react";

interface PlanningProgress {
  type:
    | "analyzing_partners"
    | "optimizing_geography"
    | "creating_itinerary"
    | "adding_recommendations"
    | "finalizing_plan"
    | "planning_complete"
    | "planning_error"
    | "planning_end";
  message: string;
  timestamp: number;
  partnersProcessed?: number;
  totalPartners?: number;
}

interface PlanningState {
  status: "idle" | "processing" | "complete" | "error";
  message?: string;
  progress?: number;
}

interface PlanningProgressGridProps {
  planningProgress: PlanningProgress[];
  isVisible: boolean;
}

const planningPhases = {
  analyzing_partners: {
    icon: Search,
    label: "Analisi Partner",
    description: "Analizzando partner selezionati",
    color: "text-blue-400",
  },
  optimizing_geography: {
    icon: MapPin,
    label: "Ottimizzazione",
    description: "Ottimizzando geografia e logistica",
    color: "text-orange-400",
  },
  creating_itinerary: {
    icon: Calendar,
    label: "Itinerario",
    description: "Creazione itinerario dettagliato",
    color: "text-green-400",
  },
  adding_recommendations: {
    icon: Lightbulb,
    label: "Consigli Esperti",
    description: "Aggiungendo consigli personalizzati",
    color: "text-purple-400",
  },
  finalizing_plan: {
    icon: CheckCircle2,
    label: "Finalizzazione",
    description: "Completamento piano di viaggio",
    color: "text-emerald-400",
  },
} as const;

export function PlanningProgressGrid({
  planningProgress,
  isVisible,
}: PlanningProgressGridProps) {
  const [phaseStates, setPhaseStates] = useState<Record<string, PlanningState>>(
    {
      analyzing_partners: { status: "idle" },
      optimizing_geography: { status: "idle" },
      creating_itinerary: { status: "idle" },
      adding_recommendations: { status: "idle" },
      finalizing_plan: { status: "idle" },
    }
  );

  const [currentPhase, setCurrentPhase] = useState<string>("");
  const [partnersCount, setPartnersCount] = useState<number>(0);

  useEffect(() => {
    if (planningProgress.length === 0) {
      // Reset all states
      setPhaseStates({
        analyzing_partners: { status: "idle" },
        optimizing_geography: { status: "idle" },
        creating_itinerary: { status: "idle" },
        adding_recommendations: { status: "idle" },
        finalizing_plan: { status: "idle" },
      });
      setCurrentPhase("");
      setPartnersCount(0);
      return;
    }

    const latestProgress = planningProgress[planningProgress.length - 1];

    // Update current phase message
    setCurrentPhase(latestProgress.message);

    // Track partners count
    if (latestProgress.totalPartners) {
      setPartnersCount(latestProgress.totalPartners);
    }

    // Update phase states
    if (latestProgress.type in planningPhases) {
      setPhaseStates(prev => {
        const newStates = { ...prev };

        // Mark current phase as processing
        newStates[latestProgress.type] = {
          status: "processing",
          message: latestProgress.message,
          progress:
            latestProgress.partnersProcessed && latestProgress.totalPartners
              ? Math.round(
                  (latestProgress.partnersProcessed /
                    latestProgress.totalPartners) *
                    100
                )
              : undefined,
        };

        // Mark previous phases as complete
        const phaseOrder = Object.keys(planningPhases);
        const currentIndex = phaseOrder.indexOf(latestProgress.type);

        for (let i = 0; i < currentIndex; i++) {
          if (newStates[phaseOrder[i]].status !== "complete") {
            newStates[phaseOrder[i]] = {
              status: "complete",
              message: "Completato",
            };
          }
        }

        return newStates;
      });
    } else if (latestProgress.type === "planning_complete") {
      // Mark all phases as complete
      setPhaseStates(prev => {
        const newStates = { ...prev };
        Object.keys(planningPhases).forEach(phase => {
          newStates[phase] = {
            status: "complete",
            message: "Completato",
          };
        });
        return newStates;
      });
      setCurrentPhase("✅ Piano di viaggio creato con successo!");
    } else if (latestProgress.type === "planning_error") {
      // Mark current phase as error
      const currentProcessingPhase = Object.entries(phaseStates).find(
        ([, state]) => state.status === "processing"
      )?.[0];
      if (currentProcessingPhase) {
        setPhaseStates(prev => ({
          ...prev,
          [currentProcessingPhase]: {
            status: "error",
            message: "Errore durante l'elaborazione",
          },
        }));
      }
    }
  }, [planningProgress]);

  const getStatusIcon = (
    status: PlanningState["status"],
    PhaseIcon: typeof Search
  ) => {
    switch (status) {
      case "idle":
        return <div className="h-4 w-4 rounded-full bg-neutral-600" />;
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
      case "complete":
        return <CheckCircle2 className="h-4 w-4 text-green-400" />;
      case "error":
        return <PhaseIcon className="h-4 w-4 text-red-400" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-neutral-600" />;
    }
  };

  const getStatusColor = (status: PlanningState["status"]) => {
    switch (status) {
      case "idle":
        return "border-neutral-700 bg-neutral-800/50";
      case "processing":
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
          {/* Current Phase Status */}
          {currentPhase && (
            <div className="mb-4 text-center">
              <div className="text-primary-300 flex items-center justify-center gap-2">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">{currentPhase}</span>
              </div>
              {partnersCount > 0 && (
                <div className="mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {partnersCount} partner selezionati
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Planning Phases Grid */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            {Object.entries(planningPhases).map(([phaseKey, config]) => {
              const state = phaseStates[phaseKey];
              const IconComponent = config.icon;

              return (
                <Card
                  key={phaseKey}
                  className={`transition-all duration-200 ${getStatusColor(state.status)}`}
                >
                  <CardContent className="p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <IconComponent className={`h-4 w-4 ${config.color}`} />
                      <span className="text-xs font-medium text-neutral-200">
                        {config.label}
                      </span>
                      <div className="ml-auto">
                        {getStatusIcon(state.status, IconComponent)}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs text-neutral-400">
                        {state.message || config.description}
                      </div>

                      {state.progress !== undefined && (
                        <div className="h-1.5 w-full rounded-full bg-neutral-700">
                          <div
                            className="h-1.5 rounded-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${state.progress}%` }}
                          />
                        </div>
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
