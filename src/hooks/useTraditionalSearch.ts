/**
 * useTraditionalSearch Hook
 * Server-side search using /api/search/traditional endpoint
 * Migrated from client-side Supabase queries for better performance and reliability
 */

import { useState, useCallback } from "react";
import type { Partner } from "@/types";

export interface TraditionalSearchFilters {
  query: string;
  partnerTypes: string[]; // 'hotel', 'restaurant', 'tour', 'shuttle'
  priceRange: [number, number];
  locations: string[];
  cuisineTypes?: string[]; // for restaurants
  tourTypes?: string[]; // for tours
  serviceTypes?: string[]; // for shuttles
  sortBy?: string;
}

interface UseTraditionalSearchReturn {
  // Results
  results: Partner[];
  loading: boolean;
  total: number;

  // Available filter options (loaded from DB)
  availableLocations: string[];
  availableCuisineTypes: string[];
  availableTourTypes: string[];
  availableServiceTypes: string[];
  loadingOptions: boolean;

  // Actions
  searchPartners: (filters: TraditionalSearchFilters) => Promise<void>;
  loadFilterOptions: () => Promise<void>;
  clearResults: () => void;

  // Error handling
  error: string | null;
}

export function useTraditionalSearch(): UseTraditionalSearchReturn {
  const [results, setResults] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Log hook initialization
  console.log("🎯 useTraditionalSearch hook initialized (API-based)");

  // Filter options state
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [availableCuisineTypes, setAvailableCuisineTypes] = useState<string[]>(
    []
  );
  const [availableTourTypes, setAvailableTourTypes] = useState<string[]>([]);
  const [availableServiceTypes, setAvailableServiceTypes] = useState<string[]>(
    []
  );
  const [loadingOptions, setLoadingOptions] = useState(false);

  const searchPartners = useCallback(
    async (filters: TraditionalSearchFilters) => {
      console.group("🔍 useTraditionalSearch - API-based search");
      console.log("📥 Received filters:", filters);
      console.log("📊 Filter analysis:", {
        hasQuery: !!filters.query.trim(),
        queryLength: filters.query.trim().length,
        partnerTypesCount: filters.partnerTypes.length,
        locationsCount: filters.locations.length,
        priceRange: filters.priceRange,
      });

      if (
        !filters.query.trim() &&
        filters.partnerTypes.length === 0 &&
        filters.locations.length === 0
      ) {
        console.log("❌ Early return: no search criteria");
        console.groupEnd();
        setResults([]);
        setTotal(0);
        return;
      }

      console.log("✅ Making API request to /api/search/traditional");
      setLoading(true);
      setError(null);

      try {
        const requestBody = {
          query: filters.query || "",
          partnerTypes: filters.partnerTypes,
          priceRange: filters.priceRange as [number, number],
          locations: filters.locations,
          cuisineTypes: filters.cuisineTypes,
          tourTypes: filters.tourTypes,
          serviceTypes: filters.serviceTypes,
          sortBy: filters.sortBy || "relevance",
        };

        console.log("📤 API request payload:", requestBody);

        const response = await fetch("/api/search/traditional", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        console.log("📡 API response status:", response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("❌ API error response:", errorData);
          throw new Error(
            errorData.error ||
              `API request failed with status ${response.status}`
          );
        }

        const data = await response.json();
        console.log("✅ API response data:", {
          success: data.success,
          resultsCount: data.results?.length || 0,
          total: data.total,
        });

        if (!data.success) {
          throw new Error(data.error || "API request failed");
        }

        console.log("🎯 Final results sample:", data.results?.slice(0, 2));
        console.groupEnd();

        setResults(data.results || []);
        setTotal(data.total || 0);
      } catch (err) {
        console.error("❌ Search error:", err);
        console.groupEnd();
        setError(
          err instanceof Error ? err.message : "Failed to search partners"
        );
        setResults([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const loadFilterOptions = useCallback(async () => {
    console.log("📋 Loading filter options...");
    setLoadingOptions(true);

    try {
      // Per ora usiamo opzioni hardcoded. In futuro si può creare un'API specifica
      // TODO: Creare /api/search/filter-options per caricare dinamicamente le opzioni

      const mockLocations = [
        "Roma",
        "Milano",
        "Venezia",
        "Firenze",
        "Napoli",
        "Torino",
        "Bologna",
        "Palermo",
        "Genova",
        "Verona",
        "Padova",
        "Trieste",
        "Brescia",
        "Modena",
        "Parma",
        "Reggio Emilia",
        "Perugia",
        "Livorno",
      ];

      const mockCuisineTypes = [
        "Italiana",
        "Mediterranea",
        "Romana",
        "Toscana",
        "Siciliana",
        "Napoletana",
        "Vegetariana",
        "Vegana",
        "Pesce",
        "Pizza",
        "Internazionale",
        "Fusion",
        "Gourmet",
        "Tradizionale",
      ];

      const mockTourTypes = [
        "Culturale",
        "Storico",
        "Artistico",
        "Gastronomico",
        "Avventura",
        "Naturalistico",
        "Archeologico",
        "Religioso",
        "Enologico",
        "Fotografico",
      ];

      const mockServiceTypes = [
        "Aeroporto",
        "Stazione",
        "Hotel",
        "Privato",
        "Condiviso",
        "Lusso",
        "Economico",
        "Navetta",
        "Transfer",
      ];

      setAvailableLocations(mockLocations);
      setAvailableCuisineTypes(mockCuisineTypes);
      setAvailableTourTypes(mockTourTypes);
      setAvailableServiceTypes(mockServiceTypes);

      console.log("✅ Filter options loaded successfully");
    } catch (err) {
      console.error("❌ Failed to load filter options:", err);
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setTotal(0);
    setError(null);
  }, []);

  return {
    results,
    loading,
    total,
    availableLocations,
    availableCuisineTypes,
    availableTourTypes,
    availableServiceTypes,
    loadingOptions,
    searchPartners,
    loadFilterOptions,
    clearResults,
    error,
  };
}
