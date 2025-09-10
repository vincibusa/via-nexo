"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { PartnerData, ChatMessage } from "@/types";

interface PlanningContextType {
  // Stato di pianificazione
  isPlanningMode: boolean;
  selectedPartners: PartnerData[];
  currentPlan: string | null;
  isGeneratingPlan: boolean;

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

        // Chiama l'API per generare il piano di viaggio
        const response = await fetch("/api/planning/create", {
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
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Errore durante la creazione del piano"
          );
        }

        const data = await response.json();
        const plan = data.plan;

        console.log(
          "[PLANNING] Plan received from API:",
          plan ? plan.substring(0, 200) + "..." : "null"
        );

        // Crea un messaggio di chat con il piano generato
        const planMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `🎯 **Piano di Viaggio Creato**\n\nHo creato un piano personalizzato utilizzando i ${partners.length} partner selezionati:\n\n${plan}`,
          timestamp: new Date().toISOString(),
          metadata: {
            partnersReturned: partners.length,
            searchQuery: userQuery || "Piano di viaggio personalizzato",
          },
        };

        // Aggiungi il messaggio alla chat
        addMessage(planMessage);

        setCurrentPlan(plan);
        setIsPlanningMode(false); // Esci dalla modalità planning dopo aver creato il messaggio
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

        console.log("[PLANNING] Regenerating plan...");

        // Chiama l'API per rigenerare il piano di viaggio
        const response = await fetch("/api/planning/create", {
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
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Errore durante la rigenerazione del piano"
          );
        }

        const data = await response.json();
        const plan = data.plan;

        // Crea un messaggio di chat con il piano rigenerato
        const planMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `🔄 **Piano di Viaggio Aggiornato**\n\nHo rigenerato il piano utilizzando i ${selectedPartners.length} partner selezionati:\n\n${plan}`,
          timestamp: new Date().toISOString(),
          metadata: {
            partnersReturned: selectedPartners.length,
            searchQuery: userQuery || "Piano di viaggio rigenerato",
          },
        };

        // Aggiungi il messaggio alla chat
        addMessage(planMessage);

        setCurrentPlan(plan);
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
