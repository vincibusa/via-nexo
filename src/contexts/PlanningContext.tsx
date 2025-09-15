"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { PartnerData, ChatMessage } from "@/types";

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

interface PlanningContextType {
  // Stato di pianificazione
  isPlanningMode: boolean;
  selectedPartners: PartnerData[];
  currentPlan: string | null;
  isGeneratingPlan: boolean;

  // Progress tracking
  planningProgress: PlanningProgress[];
  isStreamingPlanning: boolean;

  // Azioni
  startPlanning: (partners: PartnerData[], userQuery?: string) => Promise<void>;
  exitPlanningMode: () => void;
  regeneratePlan: (userQuery?: string) => Promise<void>;

  // Gestione partner
  addPartner: (partner: PartnerData) => void;
  removePartner: (partnerId: string) => void;
  updatePartnerSelection: (partners: PartnerData[]) => void;

  // Stato di errore
  error: string | null;
  clearError: () => void;
}

const PlanningContext = createContext<PlanningContextType | undefined>(
  undefined
);

export function usePlanning() {
  const context = useContext(PlanningContext);
  if (!context) {
    throw new Error("usePlanning must be used within a PlanningProvider");
  }
  return context;
}

interface PlanningProviderProps {
  children: React.ReactNode;
  addMessage: (message: ChatMessage) => void;
}

export function PlanningProvider({
  children,
  addMessage,
}: PlanningProviderProps) {
  const [isPlanningMode, setIsPlanningMode] = useState(false);
  const [selectedPartners, setSelectedPartners] = useState<PartnerData[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [planningProgress, setPlanningProgress] = useState<PlanningProgress[]>(
    []
  );
  const [isStreamingPlanning, setIsStreamingPlanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const startPlanning = useCallback(
    async (partners: PartnerData[], userQuery?: string) => {
      try {
        setError(null);
        setSelectedPartners(partners);
        setIsPlanningMode(true);
        setIsGeneratingPlan(true);

        console.log(
          "[PLANNING] Planning mode started - isPlanningMode set to true"
        );

        console.log(
          "[PLANNING] Starting planning with",
          partners.length,
          "partners"
        );

        // Add user message to show what the user is asking
        const userMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "user",
          content:
            userQuery || "Organizzami un itinerario con i partner selezionati",
          timestamp: new Date().toISOString(),
        };

        // Add the user message first
        addMessage(userMessage);

        // Start streaming planning with progress tracking
        setIsStreamingPlanning(true);
        setPlanningProgress([]);

        const response = await fetch("/api/planning/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            selectedPartners: partners,
            userQuery:
              userQuery ||
              "Crea un piano di viaggio ottimizzato con i partner selezionati",
            preferences: {
              // Potremmo estendere questo con preferenze dell'utente dal loro profilo
            },
          }),
        });

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error("Troppe richieste. Riprova più tardi.");
          }
          throw new Error(`Planning request failed: ${response.status}`);
        }

        // Handle Server-Sent Events
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("Failed to read streaming response");
        }

        let finalPlan = "";

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
                  eventData.category === "planning_progress" ||
                  [
                    "analyzing_partners",
                    "optimizing_geography",
                    "creating_itinerary",
                    "adding_recommendations",
                    "finalizing_plan",
                  ].includes(eventData.type)
                ) {
                  // Update planning progress
                  setPlanningProgress(prev => {
                    const newProgress = [...prev, eventData];
                    return newProgress.slice(-10); // Keep only last 10 progress updates
                  });
                } else if (eventData.type === "planning_complete") {
                  finalPlan = eventData.plan;
                } else if (eventData.type === "planning_error") {
                  throw new Error(eventData.message);
                } else if (eventData.type === "planning_end") {
                  // Stream completed
                  break;
                }
              } catch (parseError) {
                console.warn(
                  "[PLANNING] Failed to parse SSE data:",
                  parseError
                );
              }
            }
          }
        }

        if (!finalPlan) {
          throw new Error("No plan received from planning API");
        }

        console.log(
          "[PLANNING] Plan received from API:",
          finalPlan ? finalPlan.substring(0, 200) + "..." : "null"
        );

        // Crea un messaggio di chat con il piano generato
        const planMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `🎯 **Piano di Viaggio Creato**\n\nHo creato un piano personalizzato utilizzando i ${partners.length} partner selezionati.`,
          timestamp: new Date().toISOString(),
          metadata: {
            type: "itinerary_plan",
            plan: finalPlan,
            partnersReturned: partners.length,
            searchQuery: userQuery || "Piano di viaggio personalizzato",
          },
        };

        // Aggiungi il messaggio alla chat
        addMessage(planMessage);

        setCurrentPlan(finalPlan);

        console.log("[PLANNING] Plan generated successfully and added to chat");
      } catch (err) {
        console.error("[PLANNING] Error generating plan:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Errore durante la generazione del piano di viaggio"
        );
      } finally {
        setIsGeneratingPlan(false);
        setIsStreamingPlanning(false);
        setPlanningProgress([]);
      }
    },
    [addMessage]
  );

  const exitPlanningMode = useCallback(() => {
    setIsPlanningMode(false);
    setSelectedPartners([]);
    setCurrentPlan(null);
    setError(null);
    console.log("[PLANNING] Exited planning mode");
  }, []);

  const regeneratePlan = useCallback(
    async (userQuery?: string) => {
      if (selectedPartners.length === 0) {
        setError("Nessun partner selezionato per la pianificazione");
        return;
      }

      try {
        setError(null);
        setIsGeneratingPlan(true);
        // Start streaming planning with progress tracking
        setIsStreamingPlanning(true);
        setPlanningProgress([]);

        console.log("[PLANNING] Regenerating plan...");

        // Chiama lAPI per rigenerare il piano di viaggio in streaming
        const response = await fetch("/api/planning/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            selectedPartners,
            userQuery:
              userQuery ||
              "Rigenera il piano di viaggio con i partner selezionati",
            preferences: {
              // Estendibile con preferenze utente
            },
          }),
        });

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error("Troppe richieste. Riprova più tardi.");
          }
          throw new Error(`Planning regeneration failed: ${response.status}`);
        }

        // Handle Server-Sent Events
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("Failed to read streaming response for regeneration");
        }

        let finalPlan = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const eventData = JSON.parse(line.slice(6));

                if (
                  eventData.category === "planning_progress" ||
                  [
                    "analyzing_partners",
                    "optimizing_geography",
                    "creating_itinerary",
                    "adding_recommendations",
                    "finalizing_plan",
                  ].includes(eventData.type)
                ) {
                  setPlanningProgress(prev => [...prev, eventData].slice(-10));
                } else if (eventData.type === "planning_complete") {
                  finalPlan = eventData.plan;
                } else if (eventData.type === "planning_error") {
                  throw new Error(eventData.message);
                } else if (eventData.type === "planning_end") {
                  break;
                }
              } catch (parseError) {
                console.warn(
                  "[PLANNING] Failed to parse SSE data during regeneration:",
                  parseError
                );
              }
            }
          }
        }

        if (!finalPlan) {
          throw new Error("No plan received from regeneration API");
        }

        // Crea un messaggio di chat con il piano rigenerato
        const planMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `🔄 **Piano di Viaggio Aggiornato**\n\nHo rigenerato il piano utilizzando i ${selectedPartners.length} partner selezionati.`,
          timestamp: new Date().toISOString(),
          metadata: {
            type: "itinerary_plan",
            plan: finalPlan,
            partnersReturned: selectedPartners.length,
            searchQuery: userQuery || "Piano di viaggio rigenerato",
          },
        };

        // Aggiungi il messaggio alla chat
        addMessage(planMessage);

        setCurrentPlan(finalPlan);
        console.log(
          "[PLANNING] Plan regenerated successfully and added to chat"
        );
      } catch (err) {
        console.error("[PLANNING] Error regenerating plan:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Errore durante la rigenerazione del piano"
        );
      } finally {
        setIsGeneratingPlan(false);
        setIsStreamingPlanning(false);
        setPlanningProgress([]);
      }
    },
    [selectedPartners, addMessage]
  );

  const addPartner = useCallback((partner: PartnerData) => {
    setSelectedPartners(prev => {
      if (prev.some(p => p.id === partner.id)) {
        return prev; // Partner già presente
      }
      return [...prev, partner];
    });
  }, []);

  const removePartner = useCallback((partnerId: string) => {
    setSelectedPartners(prev => prev.filter(p => p.id !== partnerId));
  }, []);

  const updatePartnerSelection = useCallback((partners: PartnerData[]) => {
    setSelectedPartners(partners);
  }, []);

  const value: PlanningContextType = {
    // Stato
    isPlanningMode,
    selectedPartners,
    currentPlan,
    isGeneratingPlan,

    // Progress tracking
    planningProgress,
    isStreamingPlanning,

    // Azioni
    startPlanning,
    exitPlanningMode,
    regeneratePlan,

    // Gestione partner
    addPartner,
    removePartner,
    updatePartnerSelection,

    // Errori
    error,
    clearError,
  };

  return (
    <PlanningContext.Provider value={value}>
      {children}
    </PlanningContext.Provider>
  );
}
