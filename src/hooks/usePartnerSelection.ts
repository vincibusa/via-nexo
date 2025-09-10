import { useState, useCallback, useMemo } from "react";
import type { PartnerData } from "@/types";

export interface PartnersByCategory {
  hotel: PartnerData[];
  restaurant: PartnerData[];
  tour: PartnerData[];
  shuttle: PartnerData[];
}

export interface SelectionStats {
  total: number;
  byCategory: {
    hotel: number;
    restaurant: number;
    tour: number;
    shuttle: number;
  };
}

export interface UsePartnerSelectionReturn {
  // Stato di selezione
  selectedPartners: PartnerData[];
  selectedPartnersByCategory: PartnersByCategory;
  selectionStats: SelectionStats;

  // Verifica selezione
  isSelected: (partnerId: string) => boolean;
  hasSelections: boolean;

  // Azioni di selezione
  togglePartner: (partner: PartnerData) => void;
  selectPartner: (partner: PartnerData) => void;
  deselectPartner: (partnerId: string) => void;

  // Selezioni di categoria
  selectAllInCategory: (
    category: PartnerData["type"],
    partners: PartnerData[]
  ) => void;
  deselectAllInCategory: (category: PartnerData["type"]) => void;

  // Gestione globale
  clearAllSelections: () => void;

  // Modalità planning
  startPlanning: () => void;
  isPlanningMode: boolean;
  exitPlanningMode: () => void;
}

export function usePartnerSelection(): UsePartnerSelectionReturn {
  const [selectedPartners, setSelectedPartners] = useState<PartnerData[]>([]);
  const [isPlanningMode, setIsPlanningMode] = useState(false);

  // Organizza partner selezionati per categoria
  const selectedPartnersByCategory = useMemo((): PartnersByCategory => {
    return {
      hotel: selectedPartners.filter(p => p.type === "hotel"),
      restaurant: selectedPartners.filter(p => p.type === "restaurant"),
      tour: selectedPartners.filter(p => p.type === "tour"),
      shuttle: selectedPartners.filter(p => p.type === "shuttle"),
    };
  }, [selectedPartners]);

  // Calcola statistiche di selezione
  const selectionStats = useMemo((): SelectionStats => {
    const byCategory = selectedPartnersByCategory;
    return {
      total: selectedPartners.length,
      byCategory: {
        hotel: byCategory.hotel.length,
        restaurant: byCategory.restaurant.length,
        tour: byCategory.tour.length,
        shuttle: byCategory.shuttle.length,
      },
    };
  }, [selectedPartners.length, selectedPartnersByCategory]);

  // Verifica se un partner è selezionato
  const isSelected = useCallback(
    (partnerId: string): boolean => {
      return selectedPartners.some(p => p.id === partnerId);
    },
    [selectedPartners]
  );

  // Verifica se ci sono selezioni
  const hasSelections = selectedPartners.length > 0;

  // Toggle selezione partner
  const togglePartner = useCallback((partner: PartnerData) => {
    setSelectedPartners(prev => {
      const isCurrentlySelected = prev.some(p => p.id === partner.id);
      if (isCurrentlySelected) {
        return prev.filter(p => p.id !== partner.id);
      } else {
        return [...prev, partner];
      }
    });
  }, []);

  // Seleziona partner
  const selectPartner = useCallback((partner: PartnerData) => {
    setSelectedPartners(prev => {
      if (prev.some(p => p.id === partner.id)) {
        return prev; // Già selezionato
      }
      return [...prev, partner];
    });
  }, []);

  // Deseleziona partner
  const deselectPartner = useCallback((partnerId: string) => {
    setSelectedPartners(prev => prev.filter(p => p.id !== partnerId));
  }, []);

  // Seleziona tutti i partner di una categoria
  const selectAllInCategory = useCallback(
    (category: PartnerData["type"], partners: PartnerData[]) => {
      const categoryPartners = partners.filter(p => p.type === category);
      setSelectedPartners(prev => {
        // Rimuovi partner esistenti di questa categoria e aggiungi i nuovi
        const withoutCategory = prev.filter(p => p.type !== category);
        return [...withoutCategory, ...categoryPartners];
      });
    },
    []
  );

  // Deseleziona tutti i partner di una categoria
  const deselectAllInCategory = useCallback((category: PartnerData["type"]) => {
    setSelectedPartners(prev => prev.filter(p => p.type !== category));
  }, []);

  // Pulisci tutte le selezioni
  const clearAllSelections = useCallback(() => {
    setSelectedPartners([]);
    setIsPlanningMode(false);
  }, []);

  // Avvia modalità planning
  const startPlanning = useCallback(() => {
    if (selectedPartners.length > 0) {
      setIsPlanningMode(true);
    }
  }, [selectedPartners.length]);

  // Esci dalla modalità planning
  const exitPlanningMode = useCallback(() => {
    setIsPlanningMode(false);
  }, []);

  return {
    // Stato
    selectedPartners,
    selectedPartnersByCategory,
    selectionStats,

    // Verifica
    isSelected,
    hasSelections,

    // Azioni
    togglePartner,
    selectPartner,
    deselectPartner,

    // Categoria
    selectAllInCategory,
    deselectAllInCategory,

    // Globale
    clearAllSelections,

    // Planning
    startPlanning,
    isPlanningMode,
    exitPlanningMode,
  };
}
