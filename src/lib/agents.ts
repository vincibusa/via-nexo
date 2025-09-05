import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";
// import { openai, DEFAULT_MODEL } from './openai'
import { vectorSearch, searchPartners, Partner } from "./supabase-server";

interface SearchContext {
  query: string;
  partnerType?: Partner["type"];
  location?: string;
  priceRange?: string;
  minRating?: number;
}

interface ChatContext {
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }>;
  userPreferences?: {
    budget?: string;
    interests?: string[];
    travelStyle?: string;
  };
}

const supabaseSearchTool = tool({
  name: "supabase_vector_search",
  description:
    "Search for partners using semantic vector search in Supabase database",
  parameters: z.object({
    query: z.string().describe("The search query to find relevant partners"),
    partnerType: z
      .string()
      .describe(
        "Type of partner to search for (hotel, restaurant, tour, shuttle) or empty string"
      ),
    limit: z
      .number()
      .default(10)
      .describe("Maximum number of results to return"),
  }),
  execute: async ({
    query,
    partnerType,
    limit = 10,
  }: {
    query: string;
    partnerType: string;
    limit?: number;
  }) => {
    try {
      const validPartnerType =
        partnerType &&
        ["hotel", "restaurant", "tour", "shuttle"].includes(partnerType)
          ? (partnerType as Partner["type"])
          : undefined;
      const results = await vectorSearch(query, validPartnerType, limit);
      return {
        success: true,
        data: results,
        message: `Found ${results.length} partners matching "${query}"`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Search failed",
        data: [],
      };
    }
  },
});

const partnersFilterTool = tool({
  name: "partners_filter_search",
  description:
    "Search partners with specific filters like location, rating, price",
  parameters: z.object({
    type: z
      .string()
      .describe("Type of partner (hotel, restaurant, tour, shuttle) or empty"),
    location: z.string().describe("Location to search in or empty"),
    minRating: z
      .number()
      .min(0)
      .max(5)
      .describe("Minimum rating (0-5, 0 means no filter)"),
    limit: z.number().default(20).describe("Maximum results"),
  }),
  execute: async (filters: {
    type: string;
    location: string;
    minRating: number;
    limit?: number;
  }) => {
    try {
      const validFilters = {
        type:
          filters.type &&
          ["hotel", "restaurant", "tour", "shuttle"].includes(filters.type)
            ? (filters.type as Partner["type"])
            : undefined,
        location: filters.location || undefined,
        minRating: filters.minRating > 0 ? filters.minRating : undefined,
      };
      const results = await searchPartners(validFilters, filters.limit);
      return {
        success: true,
        data: results,
        message: `Found ${results.length} partners with the specified filters`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Filter search failed",
        data: [],
      };
    }
  },
});

export const searchAgent = new Agent({
  name: "Via Nexo Search Agent",
  model: "gpt-5-mini",
  instructions: `
    You are Via Nexo's intelligent search assistant, specialized in finding the perfect travel partners (hotels, restaurants, tours, shuttles) for users.
    
    Your capabilities:
    - Use semantic search to find partners based on natural language queries
    - Filter partners by type, location, rating, and other criteria
    - Provide personalized recommendations based on user preferences
    - Explain why specific partners match the user's needs
    
    Always:
    - Be helpful and friendly in your responses
    - Provide specific details about found partners
    - Suggest alternatives if initial search doesn't yield good results
    - Ask clarifying questions when the search query is too vague
    
    When searching:
    1. First try semantic vector search for the best matches
    2. If needed, use filtered search for more specific criteria
    3. Always explain the results and why they match the user's needs
  `,
  tools: [supabaseSearchTool, partnersFilterTool],
});

export const chatAgent = new Agent({
  name: "Via Nexo Chat Assistant",
  model: "gpt-5-mini",
  instructions: `
    You are Via Nexo's friendly travel chat assistant. You help users plan their trips using ONLY our affiliated partners in the database.
    
    CRITICAL RULE: You can ONLY provide recommendations for partners that are found in our database through the search tools. If no partners are found, you must politely explain that you can only recommend affiliated partners and suggest the user try different search terms or locations.
    
    RESPONSE FORMAT: Always structure your response with clear, engaging text for the user, while keeping partner details organized for easy card display.
    
    Your personality:
    - Warm, enthusiastic, and knowledgeable about travel
    - Always ready to help with travel planning and recommendations
    - Patient and understanding of different travel styles and budgets
    
    Your capabilities:
    - Search for hotels, restaurants, tours, and shuttle services in our partner database
    - Provide detailed information about our affiliated partners
    - Help users compare available options
    - Answer questions about partners and services we work with
    
    When helping users:
    1. ALWAYS use search tools first to find relevant partners in our database
    2. If partners are found: 
       - Create an engaging, conversational response explaining what you found
       - Group recommendations by category (Hotels, Restaurants, Tours, Shuttles)
       - Include helpful context and suggestions for next steps
       - The partner details will be displayed as visual cards alongside your message
    3. If NO partners are found: Politely explain you can only recommend our affiliated partners and suggest trying different search terms
    
    Response Formatting Guidelines:
    - Write in a warm, conversational tone
    - Use emojis to make responses more engaging (❤️ 🏨 🍽️ 🗺️ 🚐)
    - Structure your response with clear sections for different types of partners
    - Include helpful suggestions for what the user might want to do next
    - Keep text readable with proper line breaks and spacing
    - Don't repeat all the partner details in text since they'll appear as cards
    
    Example response structure:
    "Perfetto! Ho trovato fantastici partner affiliati per la vostra luna di miele a Roma (14-18 novembre) ❤️
    
    🏨 **Hotel di Lusso**
    Ho selezionato 3 hotel perfetti per una luna di miele, dal lusso assoluto alle opzioni più romantiche del centro storico.
    
    🍽️ **Ristoranti Romantici** 
    Per le vostre cene speciali, dalla cucina stellata alle autentiche trattorie romane.
    
    🗺️ **Tour Indimenticabili**
    Esperienze uniche per rendere magici i vostri giorni insieme.
    
    🚐 **Transfer Comodi**
    Servizi di trasporto per muovervi senza pensieri.
    
    Vuoi che controlli disponibilità per date specifiche o hai preferenze particolari?"
    
    Never provide generic travel advice without specific partner recommendations from our database.
  `,
  tools: [supabaseSearchTool, partnersFilterTool],
});

export async function searchWithAgent(context: SearchContext) {
  try {
    const prompt = `Find travel partners for: "${context.query}"${
      context.partnerType ? ` (specifically ${context.partnerType}s)` : ""
    }${context.location ? ` in ${context.location}` : ""}${
      context.minRating ? ` with rating ${context.minRating}+` : ""
    }.`;

    const response = await run(searchAgent, prompt, {
      maxTurns: 5, // Limit agent turns for safety
    });

    return {
      success: true,
      message: response.finalOutput || "",
      data:
        response.newItems?.filter(item => item.type === "tool_call_item") || [],
    };
  } catch (error) {
    console.error("Search agent error:", error);

    // Robust error handling based on DOC.md patterns
    if (error instanceof Error) {
      if (error.message.includes("timeout")) {
        return {
          success: false,
          error: "Request timed out",
          message: "Search timed out. Please try a simpler query.",
        };
      } else if (error.message.includes("rate limit")) {
        return {
          success: false,
          error: "Rate limited",
          message: "Service is busy. Please try again in a moment.",
        };
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Search agent failed",
      message:
        "Sorry, I encountered an error while searching. Please try again.",
    };
  }
}

export async function chatWithAgent(context: ChatContext) {
  try {
    // For conversation, we'll use the last message as the prompt
    const lastMessage =
      context.messages[context.messages.length - 1]?.content || "";

    // Add conversation context for better responses
    const conversationContext = context.messages.slice(-5); // Last 5 messages
    const contextualPrompt =
      conversationContext.length > 1
        ? `Conversation context: ${conversationContext.map(m => `${m.role}: ${m.content}`).join("\n")}\n\nCurrent query: ${lastMessage}`
        : lastMessage;

    const response = await run(chatAgent, contextualPrompt, {
      maxTurns: 5,
      context: {
        userPreferences: context.userPreferences,
        conversationHistory: conversationContext,
      },
    });

    // Extract partner data from tool calls
    // For now, we'll return empty array and let the API handle partner extraction
    // TODO: Implement proper partner extraction from OpenAI Agents SDK response
    const partners: Partner[] = [];

    return {
      success: true,
      message: response.finalOutput || "",
      toolCalls:
        response.newItems?.filter(item => item.type === "tool_call_item") || [],
      partners: partners,
    };
  } catch (error) {
    console.error("Chat agent error:", error);

    // Robust error handling
    if (error instanceof Error) {
      if (error.message.includes("timeout")) {
        return {
          success: false,
          error: "Request timed out",
          message: "Chat timed out. Please try again.",
        };
      } else if (error.message.includes("rate limit")) {
        return {
          success: false,
          error: "Rate limited",
          message: "Service is busy. Please try again in a moment.",
        };
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Chat agent failed",
      message: "Sorry, I encountered an error. Please try again.",
    };
  }
}
