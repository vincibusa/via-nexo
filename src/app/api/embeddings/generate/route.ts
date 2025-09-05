import { NextRequest, NextResponse } from "next/server";
import { generateEmbeddings } from "@/lib/openai";
import { z } from "zod";

const embeddingsSchema = z.object({
  text: z.string().min(1, "Text is required").max(8000, "Text too long"),
  model: z.string().optional().default("text-embedding-3-small"),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = embeddingsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { text } = validation.data;

    // Generate embeddings
    const embeddings = await generateEmbeddings(text);

    if (!embeddings || embeddings.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate embeddings" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        embeddings,
        dimensions: embeddings.length,
        text: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
      },
    });
  } catch (error) {
    console.error("Embeddings API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: "Via Nexo Embeddings Generation API",
      version: "1.0.0",
      endpoints: {
        POST: {
          description: "Generate embeddings for text",
          required: ["text"],
          optional: ["model"],
        },
      },
    },
    { status: 200 }
  );
}
