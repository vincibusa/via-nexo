import { NextRequest, NextResponse } from "next/server";
import { chatWithAgent } from "@/lib/agents";
import { z } from "zod";

const chatSchema = z.object({
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

    // Parse and validate request body
    const body = await request.json();
    const validation = chatSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { messages, userPreferences } = validation.data;

    // Chat with OpenAI Agent
    const result = await chatWithAgent({
      messages,
      userPreferences,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Chat failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      toolCalls: result.toolCalls,
      partners: result.partners || [],
      debug: result.debug,
      conversation: {
        messageCount: messages.length,
        lastMessage: messages[messages.length - 1],
      },
    });
  } catch (error) {
    console.error("Chat conversation API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: "Via Nexo Chat Conversation API",
      version: "1.0.0",
      endpoints: {
        POST: {
          description: "Have a conversation with Via Nexo AI assistant",
          required: ["messages"],
          optional: ["userPreferences"],
        },
      },
    },
    { status: 200 }
  );
}
