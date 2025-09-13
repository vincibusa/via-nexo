"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase-server-auth";
import type { ChatMessage, PartnerData } from "@/types";

// ===== TYPES =====

export interface CreateConversationResult {
  success: boolean;
  data?: {
    id: string;
    title: string;
    messageCount: number;
    createdAt: string;
    updatedAt: string;
  };
  error?: string;
}

export interface GetConversationsResult {
  success: boolean;
  data?: Array<{
    id: string;
    title: string;
    messageCount: number;
    createdAt: string;
    updatedAt: string;
  }>;
  error?: string;
}

export interface GetConversationResult {
  success: boolean;
  data?: {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: string;
    updatedAt: string;
  };
  error?: string;
}

export interface AddMessageResult {
  success: boolean;
  data?: ChatMessage;
  error?: string;
}

// ===== SERVER ACTIONS =====

/**
 * Get all conversations for the current user
 */
export async function getConversations(): Promise<GetConversationsResult> {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Unauthorized" };
    }

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
      return { success: false, error: "Failed to fetch conversations" };
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
          title: conv.title || "Untitled Chat",
          messageCount: conv.chat_messages?.[0]?.count || 0,
          createdAt: conv.created_at,
          updatedAt: conv.updated_at,
        })
      ) || [];

    return {
      success: true,
      data: formattedConversations,
    };
  } catch (error) {
    console.error("Server action error in getConversations:", error);
    return { success: false, error: "Internal server error" };
  }
}

/**
 * Create a new conversation
 */
export async function createConversation(
  title: string
): Promise<CreateConversationResult> {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate title
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return {
        success: false,
        error: "Title is required and must be a non-empty string",
      };
    }

    if (title.trim().length > 200) {
      return { success: false, error: "Title must be 200 characters or less" };
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
      return { success: false, error: "Failed to create conversation" };
    }

    const result = {
      id: conversation.id,
      title: conversation.title,
      messageCount: 0,
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at,
    };

    // Revalidate the conversations list
    revalidatePath("/chat");

    return { success: true, data: result };
  } catch (error) {
    console.error("Server action error in createConversation:", error);
    return { success: false, error: "Internal server error" };
  }
}

/**
 * Get a specific conversation with all messages
 */
export async function getConversation(
  conversationId: string
): Promise<GetConversationResult> {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate conversation ID format (UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(conversationId)) {
      return { success: false, error: "Invalid conversation ID format" };
    }

    // Get conversation with messages
    const { data: conversation, error } = await supabase
      .from("conversations")
      .select(
        `
        id,
        title,
        created_at,
        updated_at,
        chat_messages (
          id,
          role,
          content,
          metadata,
          created_at
        )
      `
      )
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { success: false, error: "Conversation not found" };
      }
      console.error("Database error fetching conversation:", error);
      return { success: false, error: "Failed to fetch conversation" };
    }

    // Format messages
    const messages: ChatMessage[] = (conversation.chat_messages || [])
      .map(
        (msg: {
          id: string;
          role: "user" | "assistant" | "system";
          content: string;
          created_at: string;
          metadata?: Record<string, unknown>;
        }) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.created_at,
          metadata: msg.metadata || {},
          partners:
            (msg.metadata as { partners?: PartnerData[] })?.partners || [],
        })
      )
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

    return {
      success: true,
      data: {
        id: conversation.id,
        title: conversation.title,
        messages,
        createdAt: conversation.created_at,
        updatedAt: conversation.updated_at,
      },
    };
  } catch (error) {
    console.error("Server action error in getConversation:", error);
    return { success: false, error: "Internal server error" };
  }
}

/**
 * Add a message to a conversation
 */
export async function addMessage(
  conversationId: string,
  role: "user" | "assistant" | "system",
  content: string,
  metadata?: Record<string, unknown>
): Promise<AddMessageResult> {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate inputs
    if (!conversationId || typeof conversationId !== "string") {
      return { success: false, error: "Conversation ID is required" };
    }

    if (!role || !["user", "assistant", "system"].includes(role)) {
      return {
        success: false,
        error: "Role must be 'user', 'assistant', or 'system'",
      };
    }

    if (
      !content ||
      typeof content !== "string" ||
      content.trim().length === 0
    ) {
      return {
        success: false,
        error: "Content is required and must be a non-empty string",
      };
    }

    if (content.trim().length > 50000) {
      return {
        success: false,
        error: "Content must be 50,000 characters or less",
      };
    }

    // Validate conversation ID format (UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(conversationId)) {
      return { success: false, error: "Invalid conversation ID format" };
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
        return { success: false, error: "Conversation not found" };
      }
      console.error(
        "Database error verifying conversation:",
        conversationError
      );
      return { success: false, error: "Failed to verify conversation" };
    }

    // Validate metadata if provided
    let validatedMetadata = {};
    if (metadata) {
      if (typeof metadata !== "object" || Array.isArray(metadata)) {
        return { success: false, error: "Metadata must be a JSON object" };
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
      return { success: false, error: "Failed to create message" };
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

    const chatMessage: ChatMessage = {
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: message.created_at,
      metadata: message.metadata || {},
      partners:
        (message.metadata as { partners?: PartnerData[] })?.partners || [],
    };

    // Revalidate the conversation and conversations list
    revalidatePath("/chat");
    revalidatePath(`/chat/${conversationId}`);

    return { success: true, data: chatMessage };
  } catch (error) {
    console.error("Server action error in addMessage:", error);
    return { success: false, error: "Internal server error" };
  }
}

/**
 * Delete a conversation
 */
export async function deleteConversation(
  conversationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate conversation ID format (UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(conversationId)) {
      return { success: false, error: "Invalid conversation ID format" };
    }

    // Delete conversation (messages will be deleted by CASCADE)
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", conversationId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Database error deleting conversation:", error);
      return { success: false, error: "Failed to delete conversation" };
    }

    // Revalidate the conversations list
    revalidatePath("/chat");

    return { success: true };
  } catch (error) {
    console.error("Server action error in deleteConversation:", error);
    return { success: false, error: "Internal server error" };
  }
}

/**
 * Update conversation title
 */
export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate inputs
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return {
        success: false,
        error: "Title is required and must be a non-empty string",
      };
    }

    if (title.trim().length > 200) {
      return { success: false, error: "Title must be 200 characters or less" };
    }

    // Validate conversation ID format (UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(conversationId)) {
      return { success: false, error: "Invalid conversation ID format" };
    }

    // Update conversation title
    const { error } = await supabase
      .from("conversations")
      .update({
        title: title.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Database error updating conversation title:", error);
      return { success: false, error: "Failed to update conversation title" };
    }

    // Revalidate the conversations list and conversation detail
    revalidatePath("/chat");
    revalidatePath(`/chat/${conversationId}`);

    return { success: true };
  } catch (error) {
    console.error("Server action error in updateConversationTitle:", error);
    return { success: false, error: "Internal server error" };
  }
}
