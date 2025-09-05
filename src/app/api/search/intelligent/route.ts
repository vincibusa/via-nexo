import { NextRequest, NextResponse } from "next/server";
import { searchWithAgent } from "@/lib/agents";
import { z } from "zod";

const searchSchema = z.object({
  query: z.string().min(1, "Query is required"),
  partnerType: z.enum(["hotel", "restaurant", "tour", "shuttle"]).optional(),
  location: z.string().optional(),
  priceRange: z.string().optional(),
  minRating: z.number().min(1).max(5).optional(),
});

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100");
const RATE_LIMIT_WINDOW = parseInt(
  process.env.RATE_LIMIT_WINDOW_MS || "900000"
); // 15 minutes

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

    // Parse and validate request body
    const body = await request.json();
    const validation = searchSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { query, partnerType, location, priceRange, minRating } =
      validation.data;

    // Perform intelligent search using OpenAI Agent
    const result = await searchWithAgent({
      query,
      partnerType,
      location,
      priceRange,
      minRating,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Search failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.data,
      query: {
        original: query,
        filters: { partnerType, location, priceRange, minRating },
      },
    });
  } catch (error) {
    console.error("Intelligent search API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: "Via Nexo Intelligent Search API",
      version: "1.0.0",
      endpoints: {
        POST: {
          description: "Perform intelligent partner search",
          required: ["query"],
          optional: ["partnerType", "location", "priceRange", "minRating"],
        },
      },
    },
    { status: 200 }
  );
}
