import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-auth";

interface DatabaseChatMessage {
  id: unknown;
  content: unknown;
  role: unknown;
  metadata: unknown;
  created_at: unknown;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
  try {
    const supabase = await createClient();
    // conversationId già destrutturato

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", success: false },
        { status: 401 }
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

    // Get conversation with all messages
    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .select(
        `
        id,
        title,
        created_at,
        updated_at,
        chat_messages (
          id,
          content,
          role,
          metadata,
          created_at
        )
      `
      )
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
      console.error("Database error fetching conversation:", conversationError);
      return NextResponse.json(
        { error: "Failed to fetch conversation", success: false },
        { status: 500 }
      );
    }

    // Format the response
    const formattedConversation = {
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at,
      messages:
        conversation.chat_messages
          ?.sort(
            (a: DatabaseChatMessage, b: DatabaseChatMessage) =>
              new Date(a.created_at as string).getTime() -
              new Date(b.created_at as string).getTime()
          )
          ?.map((msg: DatabaseChatMessage) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.created_at,
            metadata: msg.metadata || {},
          })) || [],
    };

    return NextResponse.json({
      success: true,
      data: formattedConversation,
    });
  } catch (error) {
    console.error("API error in GET /api/chat/conversations/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
  try {
    const supabase = await createClient();
    // conversationId già destrutturato

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", success: false },
        { status: 401 }
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

    // Parse request body
    const body = await request.json();
    const { title } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        {
          error: "Title is required and must be a non-empty string",
          success: false,
        },
        { status: 400 }
      );
    }

    // Validate title length
    if (title.trim().length > 200) {
      return NextResponse.json(
        { error: "Title must be 200 characters or less", success: false },
        { status: 400 }
      );
    }

    // Update conversation title
    const { data: conversation, error } = await supabase
      .from("conversations")
      .update({
        title: title.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .select("id, title, created_at, updated_at")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Conversation not found", success: false },
          { status: 404 }
        );
      }
      console.error("Database error updating conversation:", error);
      return NextResponse.json(
        { error: "Failed to update conversation", success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.created_at,
        updatedAt: conversation.updated_at,
      },
    });
  } catch (error) {
    console.error("API error in PUT /api/chat/conversations/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
  try {
    const supabase = await createClient();
    // conversationId già destrutturato

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", success: false },
        { status: 401 }
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

    // Delete conversation (messages will be deleted via CASCADE)
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", conversationId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Database error deleting conversation:", error);
      return NextResponse.json(
        { error: "Failed to delete conversation", success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    console.error("API error in DELETE /api/chat/conversations/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    );
  }
}
