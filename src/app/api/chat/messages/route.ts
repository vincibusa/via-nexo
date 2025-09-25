import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/server-auth-utils";
import { supabase } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Parse request body
    const body = await request.json();
    const { conversationId, role, content, metadata } = body;

    // Validate required fields
    if (!conversationId || typeof conversationId !== "string") {
      return NextResponse.json(
        {
          error: "Conversation ID is required and must be a string",
          success: false,
        },
        { status: 400 }
      );
    }

    if (!role || !["user", "assistant", "system"].includes(role)) {
      return NextResponse.json(
        {
          error:
            "Role is required and must be 'user', 'assistant', or 'system'",
          success: false,
        },
        { status: 400 }
      );
    }

    if (
      !content ||
      typeof content !== "string" ||
      content.trim().length === 0
    ) {
      return NextResponse.json(
        {
          error: "Content is required and must be a non-empty string",
          success: false,
        },
        { status: 400 }
      );
    }

    // Validate content length (50,000 characters max)
    if (content.trim().length > 50000) {
      return NextResponse.json(
        { error: "Content must be 50,000 characters or less", success: false },
        { status: 400 }
      );
    }

    // Validate conversation ID format (UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(conversationId)) {
      return NextResponse.json(
        { error: "Invalid conversation ID format", success: false },
        { status: 400 }
      );
    }

    // Verify the conversation exists and belongs to the user
    const { error: conversationError } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single();

    if (conversationError) {
      if (conversationError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Conversation not found", success: false },
          { status: 404 }
        );
      }
      console.error(
        "Database error verifying conversation:",
        conversationError
      );
      return NextResponse.json(
        { error: "Failed to verify conversation", success: false },
        { status: 500 }
      );
    }

    // Validate metadata if provided
    let validatedMetadata = {};
    if (metadata) {
      if (typeof metadata !== "object" || Array.isArray(metadata)) {
        return NextResponse.json(
          { error: "Metadata must be a JSON object", success: false },
          { status: 400 }
        );
      }
      validatedMetadata = metadata;
    }

    // Create new message
    const { data: message, error: messageError } = await supabase
      .from("chat_messages")
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        role,
        content: content.trim(),
        metadata: validatedMetadata,
      })
      .select("id, content, role, metadata, created_at")
      .single();

    if (messageError) {
      console.error("Database error creating message:", messageError);
      return NextResponse.json(
        { error: "Failed to create message", success: false },
        { status: 500 }
      );
    }

    // Update conversation's updated_at timestamp
    const { error: updateError } = await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId)
      .eq("user_id", user.id);

    if (updateError) {
      console.warn("Failed to update conversation timestamp:", updateError);
      // Don't fail the request for this
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: message.id,
          role: message.role,
          content: message.content,
          timestamp: message.created_at,
          metadata: message.metadata || {},
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("API error in POST /api/chat/messages:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
        success: false,
      },
      {
        status:
          error instanceof Error && error.message.startsWith("Unauthorized")
            ? 401
            : 500,
      }
    );
  }
}
