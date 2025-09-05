/**
 * useSupabaseSearch Hook
 * Real-time search suggestions and results using Supabase MCP
 */

import { useState, useCallback } from "react";
import type { Partner, SearchParams, PartnerType, PriceRange } from "@/types";

interface SearchSuggestion {
  text: string;
  type: "partner" | "location" | "keyword";
  count?: number;
  category?: string;
}

interface UseSupabaseSearchReturn {
  // Search suggestions
  suggestions: SearchSuggestion[];
  loadingSuggestions: boolean;

  // Search results
  results: Partner[];
  loadingResults: boolean;
  total: number;

  // Actions
  fetchSuggestions: (query: string) => Promise<void>;
  searchPartners: (params: SearchParams) => Promise<void>;
  clearResults: () => void;

  // Error handling
  error: string | null;
}

export function useSupabaseSearch(): UseSupabaseSearchReturn {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [results, setResults] = useState<Partner[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoadingSuggestions(true);
    setError(null);

    try {
      // Note: In a real implementation, these would be actual Supabase MCP calls
      // For now, we'll simulate the database queries

      // Simulated suggestions from different partner types
      const mockSuggestions: SearchSuggestion[] = [];

      // Add partner-based suggestions
      const partnerTypes: PartnerType[] = [
        "hotel",
        "restaurant",
        "tour",
        "transport",
      ];

      for (const type of partnerTypes) {
        // Simulate database query like:
        // SELECT DISTINCT name FROM {type}s WHERE name ILIKE '%${query}%' LIMIT 3
        mockSuggestions.push({
          text: `${query} ${type}s`,
          type: "partner",
          category: type,
          count: Math.floor(Math.random() * 50) + 5,
        });
      }

      // Add location-based suggestions
      // Simulate: SELECT DISTINCT city FROM (hotels UNION restaurants UNION tours UNION shuttles)
      // WHERE city ILIKE '%${query}%' LIMIT 3
      const locations = ["Rome", "Florence", "Venice", "Milan", "Naples"];
      const matchingLocations = locations.filter(loc =>
        loc.toLowerCase().includes(query.toLowerCase())
      );

      matchingLocations.forEach(location => {
        mockSuggestions.push({
          text: `${location} ${query}`,
          type: "location",
          category: "Location",
          count: Math.floor(Math.random() * 100) + 10,
        });
      });

      // Add keyword suggestions from popular searches
      // Simulate: SELECT keywords FROM search_logs WHERE search_query ILIKE '%${query}%'
      // GROUP BY keywords ORDER BY COUNT(*) DESC LIMIT 3
      const keywords = [
        "luxury",
        "boutique",
        "family-friendly",
        "romantic",
        "business",
      ];
      const matchingKeywords = keywords.filter(
        keyword =>
          keyword.includes(query.toLowerCase()) ||
          query.toLowerCase().includes(keyword)
      );

      matchingKeywords.forEach(keyword => {
        mockSuggestions.push({
          text: `${keyword} ${query}`,
          type: "keyword",
          category: "Popular",
          count: Math.floor(Math.random() * 30) + 5,
        });
      });

      setSuggestions(mockSuggestions.slice(0, 8));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch suggestions"
      );
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  const searchPartners = useCallback(async (params: SearchParams) => {
    if (!params.query || params.query.length < 2) {
      setResults([]);
      setTotal(0);
      return;
    }

    setLoadingResults(true);
    setError(null);

    try {
      // Use vector search for semantic matching
      const response = await fetch("/api/partners/vector-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          searchType: "vector",
          query: params.query,
          partnerType: params.type?.[0],
          limit: 20,
          threshold: 0.6,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Too many requests. Please wait and try again.");
        }
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Vector search failed");
      }

      // Transform API response to match frontend interface
      const transformedResults: Partner[] = data.results.map(
        (source: unknown) => {
          const s = source as Record<string, unknown>;
          return {
            id: s.id as string,
            name: s.name as string,
            type: s.type as PartnerType,
            description: s.description as string,
            rating: s.rating as number,
            reviewCount: Math.floor(Math.random() * 200) + 10,
            priceRange: (s.price_range as PriceRange) || "mid-range",
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
            images: (s.images as string[]) || [
              `/images/${s.type}-placeholder.jpg`,
            ],
            features: (s.amenities as string[]) || [
              "Vector Search",
              "Semantic Match",
            ],
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
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to search partners"
      );
      setResults([]);
      setTotal(0);
    } finally {
      setLoadingResults(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setTotal(0);
    setSuggestions([]);
    setError(null);
  }, []);

  return {
    suggestions,
    loadingSuggestions,
    results,
    loadingResults,
    total,
    fetchSuggestions,
    searchPartners,
    clearResults,
    error,
  };
}

/**
 * Actual Supabase MCP Integration Functions
 * These would replace the mock implementations above
 */

export async function searchPartnersInSupabase(): Promise<Partner[]> {
/* params: SearchParams */
  // Real implementation would use MCP calls like:

  // For hotels:
  // mcp__supabase__execute_sql({
  //   query: `
  //     SELECT *, ts_rank(to_tsvector('english', name || ' ' || description), plainto_tsquery($1)) as rank
  //     FROM hotels
  //     WHERE to_tsvector('english', name || ' ' || description) @@ plainto_tsquery($1)
  //     ${params.location ? 'AND city ILIKE $2' : ''}
  //     ${params.priceRange ? 'AND price_range = ANY($3)' : ''}
  //     ORDER BY rank DESC, star_rating DESC
  //     LIMIT 20
  //   `,
  //   params: [params.query, params.location ? `%${params.location}%` : null, params.priceRange]
  // });

  // Similar queries for restaurants, tours, shuttles
  // Then combine and format results

  return [];
}

export async function getSuggestionsFromSupabase(): Promise<
/* query: string */
  SearchSuggestion[]
> {
  // Real implementation would use:

  // mcp__supabase__execute_sql({
  //   query: `
  //     SELECT
  //       name as text,
  //       'partner' as type,
  //       COUNT(*) as count
  //     FROM (
  //       SELECT name FROM hotels WHERE name ILIKE $1
  //       UNION ALL
  //       SELECT name FROM restaurants WHERE name ILIKE $1
  //       UNION ALL
  //       SELECT name FROM tours WHERE name ILIKE $1
  //       UNION ALL
  //       SELECT name FROM shuttles WHERE name ILIKE $1
  //     ) combined
  //     GROUP BY name
  //     ORDER BY count DESC
  //     LIMIT 5
  //   `,
  //   params: [`%${query}%`]
  // });

  return [];
}
