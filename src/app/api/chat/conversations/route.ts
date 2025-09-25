import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/server-auth-utils";
import { supabase } from "@/lib/supabase-server";

export async function GET() {
  try {
    const user = await requireAuth();

    // Get user's conversations with message count
    const { data: conversations, error } = await supabase
      .from("conversations")
      .select(
        `
        id,
        title,
        created_at,
        updated_at,
        chat_messages(count)
      `
      )
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Database error fetching conversations:", error);
      return NextResponse.json(
        { error: "Failed to fetch conversations", success: false },
        { status: 500 }
      );
    }

    // Format the response
    const formattedConversations =
      conversations?.map(
        (conv: {
          id: string;
          title: string | null;
          created_at: string;
          updated_at: string;
          chat_messages: { count: number }[];
        }) => ({
          id: conv.id,
          title: conv.title,
          messageCount: conv.chat_messages?.[0]?.count || 0,
          createdAt: conv.created_at,
          updatedAt: conv.updated_at,
        })
      ) || [];

    return NextResponse.json({
      success: true,
      data: formattedConversations,
      total: formattedConversations.length,
    });
  } catch (error) {
    console.error("API error in GET /api/chat/conversations:", error);
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

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

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

    // Create new conversation
    const { data: conversation, error } = await supabase
      .from("conversations")
      .insert({
        user_id: user.id,
        title: title.trim(),
      })
      .select("id, title, created_at, updated_at")
      .single();

    if (error) {
      console.error("Database error creating conversation:", error);
      return NextResponse.json(
        { error: "Failed to create conversation", success: false },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: conversation.id,
          title: conversation.title,
          messageCount: 0,
          createdAt: conversation.created_at,
          updatedAt: conversation.updated_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("API error in POST /api/chat/conversations:", error);
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
