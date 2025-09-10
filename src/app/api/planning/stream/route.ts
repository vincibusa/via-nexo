import { NextRequest } from "next/server";
import { z } from "zod";
import { createTravelPlanWithProgress } from "@/lib/agents/travel-planning-agent";

const streamPlanningSchema = z.object({
  selectedPartners: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        location: z.string(),
        type: z.enum(["hotel", "restaurant", "tour", "shuttle"]),
        rating: z.number(),
        price_range: z.string(),
        images: z.array(z.string()).optional(),
        contact_info: z
          .object({
            phone: z.string().optional(),
            email: z.string().optional(),
            website: z.string().optional(),
          })
          .optional(),
        amenities: z.array(z.string()).optional(),
        coordinates: z
          .object({
            lat: z.number(),
            lng: z.number(),
          })
          .optional(),
      })
    )
    .min(1, "Almeno un partner deve essere selezionato"),
  userQuery: z.string().min(1, "Query utente è richiesta"),
  preferences: z
    .object({
      duration: z.number().optional(),
      budget: z.string().optional(),
      travelStyle: z.string().optional(),
      groupSize: z.number().optional(),
      dates: z
        .object({
          start: z.string().optional(),
          end: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "20");
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
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    if (!checkRateLimit(ip)) {
      return new Response("Rate limit exceeded", { status: 429 });
    }

    // Parse request body
    const body = await request.json();
    const validation = streamPlanningSchema.safeParse(body);

    if (!validation.success) {
      return new Response("Invalid request data", { status: 400 });
    }

    const { selectedPartners, userQuery, preferences } = validation.data;

    console.log(
      "[PLANNING_STREAM] Starting streaming planning for:",
      userQuery
    );
    console.log(
      "[PLANNING_STREAM] Selected partners:",
      selectedPartners.length
    );

    // Create a TransformStream for Server-Sent Events
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // Function to send SSE data
    const sendSSE = (data: Record<string, unknown>) => {
      const message = `data: ${JSON.stringify(data)}\n\n`;
      writer.write(encoder.encode(message));
    };

    // Start planning with progress callbacks
    (async () => {
      try {
        const travelPlan = await createTravelPlanWithProgress(
          {
            selectedPartners,
            userQuery,
            preferences: preferences || {},
          },
          progressUpdate => {
            console.log("[PLANNING_STREAM] Progress update:", progressUpdate);
            sendSSE({
              ...progressUpdate,
              category: "planning_progress",
            });
          }
        );

        console.log("[PLANNING_STREAM] Planning completed successfully");

        // Send final response
        sendSSE({
          type: "planning_complete",
          plan: travelPlan,
          partnersCount: selectedPartners.length,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error("[PLANNING_STREAM] Error:", error);
        sendSSE({
          type: "planning_error",
          message:
            error instanceof Error
              ? error.message
              : "Unknown error occurred during planning",
          timestamp: Date.now(),
        });
      } finally {
        // Close the stream
        sendSSE({
          type: "planning_end",
          timestamp: Date.now(),
        });
        writer.close();
      }
    })();

    // Return the readable stream with proper headers for SSE
    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("[PLANNING_STREAM] Error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
