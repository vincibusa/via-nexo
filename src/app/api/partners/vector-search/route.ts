import { NextRequest, NextResponse } from "next/server";
import { vectorSearch, searchPartners } from "@/lib/supabase-server";
import { z } from "zod";

const vectorSearchSchema = z.object({
  query: z.string().min(1, "Query is required"),
  partnerType: z.enum(["hotel", "restaurant", "tour", "shuttle"]).optional(),
  limit: z.number().min(1).max(50).default(10),
  threshold: z.number().min(0).max(1).default(0.5),
});

const filterSearchSchema = z.object({
  type: z.enum(["hotel", "restaurant", "tour", "shuttle"]).optional(),
  location: z.string().optional(),
  minRating: z.number().min(1).max(5).optional(),
  maxPrice: z.number().optional(),
  amenities: z.array(z.string()).optional(),
  limit: z.number().min(1).max(50).default(20),
});

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100");
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
    // Rate limiting
    const ip =
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const searchType = body.searchType || "vector"; // 'vector' or 'filter'

    if (searchType === "vector") {
      // Vector search validation
      const validation = vectorSearchSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          {
            error: "Invalid vector search data",
            details: validation.error.errors,
          },
          { status: 400 }
        );
      }

      const { query, partnerType, limit, threshold } = validation.data;

      // Perform vector search
      const results = await vectorSearch(query, partnerType, limit, threshold);

      return NextResponse.json({
        success: true,
        searchType: "vector",
        query: query,
        results: results,
        count: results.length,
        filters: { partnerType, limit, threshold },
      });
    } else if (searchType === "filter") {
      // Filter search validation
      const validation = filterSearchSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          {
            error: "Invalid filter search data",
            details: validation.error.errors,
          },
          { status: 400 }
        );
      }

      const { type, location, minRating, maxPrice, amenities, limit } =
        validation.data;

      // Perform filter search
      const results = await searchPartners(
        { type, location, minRating, maxPrice, amenities },
        limit
      );

      return NextResponse.json({
        success: true,
        searchType: "filter",
        results: results,
        count: results.length,
        filters: { type, location, minRating, maxPrice, amenities, limit },
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid searchType. Must be "vector" or "filter"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Partners vector search API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: "Via Nexo Partners Vector Search API",
      version: "1.0.0",
      endpoints: {
        POST: {
          description: "Search partners using vector search or filters",
          searchTypes: {
            vector: {
              required: ["query"],
              optional: ["partnerType", "limit", "threshold"],
            },
            filter: {
              optional: [
                "type",
                "location",
                "minRating",
                "maxPrice",
                "amenities",
                "limit",
              ],
            },
          },
        },
      },
      examples: {
        vectorSearch: {
          searchType: "vector",
          query: "luxury beachfront hotel with spa",
          partnerType: "hotel",
          limit: 5,
        },
        filterSearch: {
          searchType: "filter",
          type: "restaurant",
          location: "Rome",
          minRating: 4,
          limit: 10,
        },
      },
    },
    { status: 200 }
  );
}
