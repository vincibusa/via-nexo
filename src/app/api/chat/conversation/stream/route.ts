import { NextRequest } from "next/server";
import { z } from "zod";
import { runAgentOrchestration } from "@/lib/agents/orchestrator";
import { chatAgent } from "@/lib/agents";
import { run } from "@openai/agents";

const streamChatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().min(1),
      })
    )
    .min(1),
  userPreferences: z
    .object({
      budget: z.string().optional(),
      interests: z.array(z.string()).optional(),
      travelStyle: z.string().optional(),
    })
    .optional(),
});

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "50");
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
    const validation = streamChatSchema.safeParse(body);

    if (!validation.success) {
      return new Response("Invalid request data", { status: 400 });
    }

    const { messages, userPreferences } = validation.data;
    const lastMessage = messages[messages.length - 1]?.content || "";
    const conversationHistory = messages.slice(-5);

    console.log(
      "[STREAM_API] Starting streaming orchestration for:",
      lastMessage
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

    // Start orchestration with progress callbacks
    (async () => {
      try {
        const orchestrationResult = await runAgentOrchestration(
          lastMessage,
          conversationHistory,
          progressUpdate => {
            console.log("[STREAM_API] Progress update:", progressUpdate);
            sendSSE({
              ...progressUpdate,
              category: "progress",
            });
          }
        );

        console.log(
          "[STREAM_API] Orchestration completed:",
          orchestrationResult.executionSummary
        );

        if (!orchestrationResult.success) {
          sendSSE({
            type: "error",
            message: orchestrationResult.message || "Orchestration failed",
            timestamp: Date.now(),
          });
          return;
        }

        // Send progress update for chat agent processing
        sendSSE({
          type: "chat_processing",
          message: "Generating response...",
          timestamp: Date.now(),
        });

        // Create context for chat agent
        const contextForAgent = `
        User Query: "${lastMessage}"

        Search Results Summary:
        ${orchestrationResult.agentResults
          .map(
            result =>
              `- ${result.agentType}: ${result.success ? `${result.partners.length} partners found` : "failed"}`
          )
          .join("\n")}

        Total Partners Found: ${orchestrationResult.partners.length}

        Partner Details:
        ${orchestrationResult.partners
          .slice(0, 10) // Limit to first 10 for context
          .map(
            partner =>
              `- ${partner.name} (${partner.type}) in ${partner.location}`
          )
          .join("\n")}

        User Preferences: ${userPreferences ? JSON.stringify(userPreferences) : "None specified"}

        Please provide a conversational response that acknowledges their request and presents these travel recommendations in an engaging way.
        `;

        // Run chat agent
        const chatResponse = await run(chatAgent, contextForAgent);
        const finalMessage =
          chatResponse.finalOutput ||
          "I found some great travel options for you!";

        // Send final response
        sendSSE({
          type: "complete",
          message: finalMessage,
          partners: orchestrationResult.partners,
          executionSummary: orchestrationResult.executionSummary,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error("[STREAM_API] Error:", error);
        sendSSE({
          type: "error",
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
          timestamp: Date.now(),
        });
      } finally {
        // Close the stream
        sendSSE({
          type: "end",
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
    console.error("[STREAM_API] Error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
