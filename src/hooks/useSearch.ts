/**
 * useSearch Hook
 * Manages search state and API calls for partner discovery
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import type {
  SearchParams,
  Partner,
  Status,
  PartnerType,
  PriceRange,
} from "@/types";
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
      // Use RAG Pipeline for intelligent search
      const response = await fetch("/api/rag/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: params.query,
          partnerType: params.type?.[0], // Use first type if multiple
          location: params.location,
          config: {
            maxResults: 20,
            useCache: true,
          },
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(
            "Too many requests. Please wait a moment and try again."
          );
        }
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Search failed");
      }

      // Transform API response to match frontend interface
      const transformedResults: Partner[] = data.sources.map(
        (source: unknown) => {
          const s = source as Record<string, unknown>;
          return {
            id: s.id as string,
            name: s.name as string,
            type: s.type as PartnerType,
            description: s.description as string,
            rating: s.rating as number,
            reviewCount: Math.floor(Math.random() * 500) + 50, // Mock review count
            priceRange: s.price_range as PriceRange,
            location: {
              address: s.location as string,
              city:
                (s.location as string).split(",")[0] || (s.location as string),
              region: (s.location as string).split(",")[1]?.trim() || "",
              country: "Italy",
              coordinates: (s.coordinates as { lat: number; lng: number }) || {
                lat: 41.9028,
                lng: 12.4964,
              },
              timezone: "Europe/Rome",
            },
            images: (s.images as string[]) || ["/placeholder-hotel.jpg"],
            features: (s.amenities as string[]) || [],
            contact: {
              phone: (s.contact_info as Record<string, string>)?.phone || "",
              email: (s.contact_info as Record<string, string>)?.email || "",
              website:
                (s.contact_info as Record<string, string>)?.website || "",
            },
            isVerified: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
      );

      setResults(transformedResults);
      setTotal(transformedResults.length);
      setSuggestions([
        `${params.query} recommendations`,
        `best ${params.type?.[0] || "places"} ${params.location || ""}`.trim(),
        `${params.type?.[0] || "partner"} reviews`,
      ]);
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
