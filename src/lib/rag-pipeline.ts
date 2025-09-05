import { vectorSearch, searchPartners } from "./supabase-server";
import { PartnerData } from "@/types";
// import { generateEmbeddings } from './openai'
import { searchWithAgent, chatWithAgent } from "./agents";
import {
  embeddingsCache,
  searchCache,
  agentCache,
  createCacheKey,
  withCache,
  hashString,
} from "./cache";

// RAG Pipeline Configuration
export interface RAGConfig {
  maxResults: number;
  embeddingsCacheTTL: number;
  searchCacheTTL: number;
  agentCacheTTL: number;
  similarityThreshold: number;
  useCache: boolean;
}

const DEFAULT_RAG_CONFIG: RAGConfig = {
  maxResults: 10,
  embeddingsCacheTTL: 30 * 60 * 1000, // 30 minutes
  searchCacheTTL: 15 * 60 * 1000, // 15 minutes
  agentCacheTTL: 5 * 60 * 1000, // 5 minutes
  similarityThreshold: 0.5,
  useCache: true,
};

// RAG Query Interface
export interface RAGQuery {
  query: string;
  partnerType?: PartnerData["type"];
  location?: string;
  context?: {
    userPreferences?: {
      budget?: string;
      interests?: string[];
      travelStyle?: string;
    };
    conversationHistory?: Array<{ role: string; content: string }>;
  };
  config?: Partial<RAGConfig>;
}

// RAG Response Interface
export interface RAGResponse {
  success: boolean;
  query: string;
  response: string;
  sources: PartnerData[];
  metadata: {
    retrievalTime: number;
    generationTime: number;
    totalTime: number;
    cachedResults: boolean;
    sourceCount: number;
    config: RAGConfig;
  };
  error?: string;
}

/**
 * Enhanced RAG Pipeline with GPT-5-mini
 * Combines vector search, traditional search, and AI generation
 */
export class RAGPipeline {
  private config: RAGConfig;

  constructor(config?: Partial<RAGConfig>) {
    this.config = { ...DEFAULT_RAG_CONFIG, ...config };
  }

  /**
   * Main RAG pipeline entry point
   */
  async query(ragQuery: RAGQuery): Promise<RAGResponse> {
    const startTime = Date.now();
    const config = { ...this.config, ...ragQuery.config };

    try {
      console.log(`RAG Pipeline: Processing query "${ragQuery.query}"`);

      // Step 1: Retrieve relevant partners
      const retrievalStartTime = Date.now();
      const sources = await this.retrieve(ragQuery, config);
      const retrievalTime = Date.now() - retrievalStartTime;

      console.log(
        `RAG Pipeline: Retrieved ${sources.length} sources in ${retrievalTime}ms`
      );

      // Step 2: Generate response using AI
      const generationStartTime = Date.now();
      const response = await this.generate(ragQuery, sources, config);
      const generationTime = Date.now() - generationStartTime;

      const totalTime = Date.now() - startTime;

      console.log(
        `RAG Pipeline: Generated response in ${generationTime}ms (total: ${totalTime}ms)`
      );

      // Combine retrieved sources with agent-found partners
      const allPartners = [...sources, ...response.partners];
      const uniquePartners = allPartners.filter(
        (partner, index, array) =>
          array.findIndex(p => p.id === partner.id) === index
      );

      return {
        success: true,
        query: ragQuery.query,
        response: response.message,
        sources: uniquePartners,
        metadata: {
          retrievalTime,
          generationTime,
          totalTime,
          cachedResults: response.cached,
          sourceCount: uniquePartners.length,
          config,
        },
      };
    } catch (error) {
      console.error("RAG Pipeline error:", error);

      return {
        success: false,
        query: ragQuery.query,
        response:
          "Sorry, I encountered an error processing your request. Please try again.",
        sources: [],
        metadata: {
          retrievalTime: 0,
          generationTime: 0,
          totalTime: Date.now() - startTime,
          cachedResults: false,
          sourceCount: 0,
          config,
        },
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Retrieve relevant partners using multiple search strategies
   */
  private async retrieve(
    ragQuery: RAGQuery,
    config: RAGConfig
  ): Promise<PartnerData[]> {
    const cacheKey = createCacheKey(
      "retrieve",
      hashString(ragQuery.query),
      ragQuery.partnerType,
      ragQuery.location,
      config.maxResults,
      config.similarityThreshold
    );

    if (config.useCache) {
      return await withCache(
        searchCache,
        cacheKey,
        () => this.performRetrieval(ragQuery, config),
        config.searchCacheTTL
      );
    }

    return await this.performRetrieval(ragQuery, config);
  }

  private async performRetrieval(
    ragQuery: RAGQuery,
    config: RAGConfig
  ): Promise<PartnerData[]> {
    const results = new Map<string, PartnerData>();

    try {
      // Strategy 1: Vector search with semantic similarity
      console.log("RAG Retrieval: Starting vector search");
      const vectorResults = await vectorSearch(
        ragQuery.query,
        ragQuery.partnerType,
        Math.ceil(config.maxResults * 0.7), // 70% from vector search
        config.similarityThreshold
      );

      // Add vector search results
      vectorResults.forEach(partner => {
        results.set(partner.id, partner);
      });

      // Strategy 2: Traditional filter-based search for additional context
      if (ragQuery.location || ragQuery.partnerType) {
        console.log("RAG Retrieval: Starting filter search");
        const filterResults = await searchPartners(
          {
            type: ragQuery.partnerType,
            location: ragQuery.location,
            minRating: 3, // Minimum quality threshold
          },
          Math.ceil(config.maxResults * 0.5) // 50% from filter search
        );

        // Add filter search results (don't overwrite vector results)
        filterResults.forEach(partner => {
          if (!results.has(partner.id)) {
            results.set(partner.id, partner);
          }
        });
      }
    } catch (error) {
      console.error("Retrieval error:", error);
      // If vector search fails, fall back to filter search
      if (ragQuery.partnerType || ragQuery.location) {
        const fallbackResults = await searchPartners(
          {
            type: ragQuery.partnerType,
            location: ragQuery.location,
          },
          config.maxResults
        );

        fallbackResults.forEach(partner => {
          results.set(partner.id, partner);
        });
      }
    }

    // Convert to array and limit results
    const finalResults = Array.from(results.values()).slice(
      0,
      config.maxResults
    );

    console.log(
      `RAG Retrieval: Final results - ${finalResults.length} partners`
    );
    return finalResults;
  }

  /**
   * Generate response using AI with retrieved context
   */
  private async generate(
    ragQuery: RAGQuery,
    sources: PartnerData[],
    config: RAGConfig
  ): Promise<{ message: string; partners: PartnerData[]; cached: boolean }> {
    const cacheKey = createCacheKey(
      "generate",
      hashString(ragQuery.query),
      hashString(JSON.stringify(sources.map(s => s.id).sort())),
      ragQuery.context
        ? hashString(JSON.stringify(ragQuery.context))
        : undefined
    );

    if (config.useCache) {
      const cached = agentCache.get<string>(cacheKey);
      if (cached) {
        console.log("RAG Generation: Using cached response");
        return { message: cached, partners: [], cached: true };
      }
    }

    console.log("RAG Generation: Generating new response");
    const response = await this.performGeneration(ragQuery, sources);

    if (config.useCache) {
      agentCache.set(cacheKey, response.message, config.agentCacheTTL);
    }

    return {
      message: response.message,
      partners: response.partners || [],
      cached: false,
    };
  }

  private async performGeneration(
    ragQuery: RAGQuery,
    sources: PartnerData[]
  ): Promise<{ message: string; partners?: PartnerData[] }> {
    // Prepare context from retrieved sources
    const context = this.prepareContext(sources);

    // Use conversation context if available
    if (ragQuery.context?.conversationHistory) {
      const result = await chatWithAgent({
        messages: [
          ...ragQuery.context.conversationHistory.map(msg => ({
            role: msg.role as "user" | "assistant" | "system",
            content: msg.content,
          })),
          {
            role: "user" as const,
            content: `${ragQuery.query}\n\nRelevant partners found:\n${context}`,
          },
        ],
        userPreferences: ragQuery.context.userPreferences,
      });

      if (result.success) {
        return { message: result.message, partners: result.partners };
      } else {
        throw new Error(result.error || "Chat agent failed");
      }
    }

    // Use search agent for single queries
    const result = await searchWithAgent({
      query: `${ragQuery.query}\n\nBased on these relevant partners:\n${context}`,
      partnerType: ragQuery.partnerType,
      location: ragQuery.location,
    });

    if (result.success) {
      return { message: result.message, partners: [] };
    } else {
      throw new Error(result.error || "Search agent failed");
    }
  }

  /**
   * Prepare context from retrieved partners for AI generation
   */
  private prepareContext(sources: PartnerData[]): string {
    if (sources.length === 0) {
      return "No relevant partners found.";
    }

    return sources
      .map((partner, index) => {
        const amenities = partner.amenities?.length
          ? ` Amenities: ${partner.amenities.join(", ")}.`
          : "";

        const contact = partner.contact_info
          ? ` Contact: ${partner.contact_info.phone || partner.contact_info.email || "Available"}.`
          : "";

        return `${index + 1}. ${partner.name} (${partner.type})
   Location: ${partner.location}
   Description: ${partner.description}
   Rating: ${partner.rating}/5
   Price Range: ${partner.price_range}${amenities}${contact}`;
      })
      .join("\n\n");
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    embeddingsCache.clear();
    searchCache.clear();
    agentCache.clear();
    console.log("RAG Pipeline: All caches cleared");
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { embeddings: number; search: number; agent: number } {
    return {
      embeddings: embeddingsCache.size(),
      search: searchCache.size(),
      agent: agentCache.size(),
    };
  }
}

// Singleton instance
export const ragPipeline = new RAGPipeline();

// Utility functions for direct use
export async function performRAGQuery(query: RAGQuery): Promise<RAGResponse> {
  return ragPipeline.query(query);
}

export async function simpleRAGQuery(
  query: string,
  partnerType?: PartnerData["type"],
  location?: string
): Promise<RAGResponse> {
  return ragPipeline.query({
    query,
    partnerType,
    location,
  });
}
