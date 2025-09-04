/**
 * useSearch Hook
 * Manages search state and API calls for partner discovery
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import type { SearchParams, Partner, Status } from "@/types";
import { useDebounce } from "./useDebounce";
import { SEARCH_CONFIG } from "@/constants";

interface UseSearchReturn {
  // State
  results: Partner[];
  total: number;
  status: Status;
  error: string | null;
  suggestions: string[];

  // Actions
  search: (params: SearchParams) => Promise<void>;
  clearResults: () => void;
  loadMore: () => Promise<void>;

  // Computed
  hasMore: boolean;
  isLoading: boolean;
}

export function useSearch(): UseSearchReturn {
  const [results, setResults] = useState<Partner[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [currentParams, setCurrentParams] = useState<SearchParams | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const hasMore = results.length < total;
  const search = useCallback(async (params: SearchParams) => {
    if (!params.query || params.query.length < SEARCH_CONFIG.minQueryLength) {
      setResults([]);
      setTotal(0);
      setSuggestions([]);
      return;
    }

    setStatus("loading");
    setError(null);
    setCurrentParams(params);
    setCurrentPage(1);

    try {
      // TODO: Replace with actual API call when backend is ready
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 800));

      const mockResults: Partner[] = [
        {
          id: "1",
          name: "Hotel Example",
          type: "hotel",
          description: "A beautiful hotel in the heart of Rome",
          rating: 4.5,
          reviewCount: 123,
          priceRange: "mid-range",
          location: {
            address: "Via Example 123",
            city: "Rome",
            region: "Lazio",
            country: "Italy",
            coordinates: { lat: 41.9028, lng: 12.4964 },
            timezone: "Europe/Rome",
          },
          images: ["/placeholder-hotel.jpg"],
          features: ["WiFi", "Breakfast", "AC"],
          contact: {
            phone: "+39 06 1234567",
            email: "info@hotelexample.com",
            website: "https://hotelexample.com",
          },
          isVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      setResults(mockResults);
      setTotal(mockResults.length);
      setSuggestions(["rome hotels", "luxury hotels rome", "boutique hotels"]);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setStatus("error");
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setTotal(0);
    setError(null);
    setSuggestions([]);
    setCurrentParams(null);
    setCurrentPage(1);
    setStatus("idle");
  }, []);

  const loadMore = useCallback(async () => {
    if (!currentParams || status === "loading" || !hasMore) return;

    setStatus("loading");

    try {
      const nextPage = currentPage + 1;
      // TODO: Implement pagination with actual API
      // For now, just simulate loading more results
      await new Promise(resolve => setTimeout(resolve, 500));

      // Simulate no more results for demo
      setCurrentPage(nextPage);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load more");
      setStatus("error");
    }
  }, [currentParams, currentPage, status, hasMore]);

  // Computed properties

  const isLoading = status === "loading";

  return useMemo(
    () => ({
      // State
      results,
      total,
      status,
      error,
      suggestions,

      // Actions
      search,
      clearResults,
      loadMore,

      // Computed
      hasMore,
      isLoading,
    }),
    [
      results,
      total,
      status,
      error,
      suggestions,
      search,
      clearResults,
      loadMore,
      hasMore,
      isLoading,
    ]
  );
}

// Hook for debounced search - useful for search-as-you-type
export function useDebouncedSearch(
  delay: number = SEARCH_CONFIG.searchDebounceMs
) {
  const searchHook = useSearch();
  const { search, clearResults } = searchHook;
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, delay);

  useEffect(() => {
    if (debouncedQuery) {
      search({ query: debouncedQuery });
    } else {
      clearResults();
    }
  }, [debouncedQuery, search, clearResults]);

  return {
    ...searchHook,
    query,
    setQuery,
  };
}
