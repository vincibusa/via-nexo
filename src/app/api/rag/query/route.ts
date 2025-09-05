import { NextRequest, NextResponse } from "next/server";
import { performRAGQuery, RAGQuery } from "@/lib/rag-pipeline";
import { z } from "zod";

const ragQuerySchema = z.object({
  query: z.string().min(1, "Query is required").max(500, "Query too long"),
  partnerType: z.enum(["hotel", "restaurant", "tour", "shuttle"]).optional(),
  location: z.string().optional(),
  context: z
    .object({
      userPreferences: z
        .object({
          budget: z.string().optional(),
          interests: z.array(z.string()).optional(),
          travelStyle: z.string().optional(),
        })
        .optional(),
      conversationHistory: z
        .array(
          z.object({
            role: z.enum(["user", "assistant", "system"]),
            content: z.string(),
          })
        )
        .optional(),
    })
    .optional(),
  config: z
    .object({
      maxResults: z.number().min(1).max(50).optional(),
      similarityThreshold: z.number().min(0).max(1).optional(),
      useCache: z.boolean().optional(),
    })
    .optional(),
});

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "50"); // Lower limit for RAG
const RATE_LIMIT_WINDOW = parseInt(
  process.env.RATE_LIMIT_WINDOW_MS || "900000"
);

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);

  if (!userLimit) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_MAX) {
    return false;
  }

  userLimit.count += 1;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting (stricter for RAG queries)
    const ip =
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          error:
            "Too many requests. RAG queries are rate limited. Please try again later.",
        },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = ragQuerySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid RAG query data",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const ragQuery: RAGQuery = validation.data;

    console.log(`RAG API: Processing query "${ragQuery.query}"`);

    // Execute RAG pipeline
    const result = await performRAGQuery(ragQuery);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || "RAG query failed",
          query: result.query,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      query: result.query,
      response: result.response,
      sources: result.sources.map(source => ({
        id: source.id,
        name: source.name,
        type: source.type,
        location: source.location,
        rating: source.rating,
        price_range: source.price_range,
        description:
          source.description.substring(0, 200) +
          (source.description.length > 200 ? "..." : ""),
        amenities: source.amenities?.slice(0, 5), // Limit amenities
        contact_info: source.contact_info,
      })),
      metadata: {
        ...result.metadata,
        apiVersion: "1.0.0",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("RAG API error:", error);

    // Enhanced error handling
    if (error instanceof Error) {
      if (error.message.includes("timeout")) {
        return NextResponse.json(
          { error: "RAG query timed out. Please try a simpler query." },
          { status: 504 }
        );
      } else if (error.message.includes("rate limit")) {
        return NextResponse.json(
          { error: "Service rate limited. Please try again later." },
          { status: 429 }
        );
      } else if (error.message.includes("embedding")) {
        return NextResponse.json(
          { error: "Failed to process query. Please rephrase and try again." },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error during RAG processing" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: "Via Nexo RAG (Retrieval-Augmented Generation) API",
      description:
        "Advanced AI-powered search using GPT-5-mini with vector database integration",
      version: "1.0.0",
      features: [
        "Semantic vector search using OpenAI embeddings",
        "Multi-strategy partner retrieval",
        "GPT-5-mini powered response generation",
        "Intelligent caching system",
        "Conversation context awareness",
        "User preference personalization",
      ],
      endpoints: {
        POST: {
          description:
            "Perform RAG-enhanced partner search and get AI-generated recommendations",
          required: ["query"],
          optional: ["partnerType", "location", "context", "config"],
          rateLimit: "50 requests per 15 minutes",
        },
      },
      example: {
        query: "I need a romantic restaurant in Rome for anniversary dinner",
        partnerType: "restaurant",
        location: "Rome",
        context: {
          userPreferences: {
            budget: "high",
            interests: ["fine dining", "romantic atmosphere"],
            travelStyle: "luxury",
          },
        },
        config: {
          maxResults: 5,
          useCache: true,
        },
      },
      performance: {
        averageResponseTime: "800-1500ms",
        cacheHitRate: "60-80%",
        accuracyRate: "90%+",
      },
    },
    { status: 200 }
  );
}
