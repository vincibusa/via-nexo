/**
 * useRAG Hook
 * Comprehensive RAG (Retrieval-Augmented Generation) functionality
 * Integrates intelligent search, chat, and vector operations
 */

import { useState, useCallback } from "react";
import type { Partner, PartnerType, PriceRange, Status } from "@/types";

interface RAGQuery {
  query: string;
  partnerType?: PartnerType;
  location?: string;
  context?: {
    userPreferences?: {
      budget?: string;
      interests?: string[];
      travelStyle?: string;
    };
    conversationHistory?: Array<{
      role: "user" | "assistant" | "system";
      content: string;
    }>;
  };
  config?: {
    maxResults?: number;
    useCache?: boolean;
    similarityThreshold?: number;
  };
}

interface RAGResponse {
  success: boolean;
  query: string;
  response: string;
  sources: Partner[];
  metadata: {
    retrievalTime: number;
    generationTime: number;
    totalTime: number;
    cachedResults: boolean;
    sourceCount: number;
  };
}

interface UseRAGReturn {
  // State
  response: RAGResponse | null;
  status: Status;
  error: string | null;

  // Actions
  queryRAG: (query: RAGQuery) => Promise<void>;
  clearResponse: () => void;

  // Computed
  isLoading: boolean;
  hasResponse: boolean;
  sources: Partner[];
}

export function useRAG(): UseRAGReturn {
  const [response, setResponse] = useState<RAGResponse | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const queryRAG = useCallback(async (ragQuery: RAGQuery) => {
    if (!ragQuery.query.trim()) {
      setError("Query is required");
      return;
    }

    setStatus("loading");
    setError(null);
    setResponse(null);

    try {
      const response = await fetch("/api/rag/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ragQuery),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Too many RAG requests. Please wait and try again.");
        } else if (response.status === 504) {
          throw new Error("RAG query timed out. Please try a simpler query.");
        }
        throw new Error(`RAG query failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "RAG query failed");
      }

      const ragResponse: RAGResponse = {
        success: true,
        query: data.query,
        response: data.response,
        sources: data.sources.map((source: unknown) => {
          const s = source as Record<string, unknown>;
          return {
            id: s.id as string,
            name: s.name as string,
            type: s.type as PartnerType,
            description: s.description as string,
            rating: s.rating as number,
            reviewCount: Math.floor(Math.random() * 500) + 50,
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
            images: (s.images as string[]) || ["/placeholder-rag.jpg"],
            features: (s.amenities as string[]) || [
              "RAG Powered",
              "AI Selected",
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
        }),
        metadata: data.metadata,
      };

      setResponse(ragResponse);
      setStatus("success");

      console.log("RAG Response:", {
        query: ragResponse.query,
        responseLength: ragResponse.response.length,
        sourceCount: ragResponse.sources.length,
        totalTime: ragResponse.metadata.totalTime,
        cached: ragResponse.metadata.cachedResults,
      });
    } catch (err) {
      console.error("RAG query error:", err);
      setError(err instanceof Error ? err.message : "RAG query failed");
      setStatus("error");
    }
  }, []);

  const clearResponse = useCallback(() => {
    setResponse(null);
    setError(null);
    setStatus("idle");
  }, []);

  // Computed properties
  const isLoading = status === "loading";
  const hasResponse = response !== null && response.success;
  const sources = response?.sources || [];

  return {
    // State
    response,
    status,
    error,

    // Actions
    queryRAG,
    clearResponse,

    // Computed
    isLoading,
    hasResponse,
    sources,
  };
}

// Utility hook for simple RAG queries
export function useSimpleRAG() {
  const { queryRAG, response, isLoading, error } = useRAG();

  const ask = useCallback(
    async (query: string, partnerType?: PartnerType, location?: string) => {
      await queryRAG({
        query,
        partnerType,
        location,
        config: {
          maxResults: 10,
          useCache: true,
        },
      });
    },
    [queryRAG]
  );

  return {
    ask,
    response: response?.response,
    sources: response?.sources || [],
    isLoading,
    error,
    metadata: response?.metadata,
  };
}
