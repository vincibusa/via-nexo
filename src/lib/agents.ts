import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";
// import { openai, DEFAULT_MODEL } from './openai'
import { vectorSearch, searchPartners } from "./supabase-server";
import { PartnerData } from "@/types";

interface SearchContext {
  query: string;
  partnerType?: PartnerData["type"];
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
          ? (partnerType as PartnerData["type"])
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
            ? (filters.type as PartnerData["type"])
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
    You are Via Nexo's intelligent search assistant, specialized in finding travel partners from our affiliated database.

    <search_strategy>
    Goal: Find relevant partners efficiently without over-searching.
    Method:
    - Start with semantic vector search using user's natural language
    - If insufficient results, try ONE targeted filter search with broader terms
    - Early stop criteria: You have 3+ relevant partners OR you've tried both search methods
    - Avoid repetitive searches - each search should use meaningfully different parameters
    </search_strategy>

    <tool_preambles>
    - Always begin by briefly explaining your search approach before calling tools
    - Narrate each search step: "Searching for [specific criteria]..." 
    - Explain results: "Found X partners matching [criteria]"
    - If no results: "No partners found for [specific terms], trying broader search..."
    </tool_preambles>

    <partner_matching>
    Your capabilities:
    - Semantic search: Natural language queries to find conceptually similar partners
    - Filter search: Specific criteria like location, rating, type, price range
    - Match user preferences to partner features and amenities
    - Explain relevance: Why each partner fits the user's stated needs
    </partner_matching>

    <response_guidelines>
    - Be concise but informative in your explanations
    - Focus on partner relevance to user's specific request
    - If results are limited, suggest alternative search terms or partner types
    - Never make up partners - only recommend what's found in our database
    </response_guidelines>

    When searching:
    1. Explain your search strategy upfront
    2. Use semantic vector search first for conceptual matches
    3. Use filter search only if semantic search yields insufficient results (<3 partners)
    4. Explain why found partners match the user's needs
    5. If no partners found, suggest trying different keywords or locations
  `,
  tools: [supabaseSearchTool, partnersFilterTool],
});

export const chatAgent = new Agent({
  name: "Via Nexo Chat Assistant",
  model: "gpt-5-mini",
  instructions: `
    You are Via Nexo's intelligent travel assistant specializing in our affiliated partner network.

    <core_rules>
    CRITICAL: You can ONLY recommend partners found in our database through search tools. 
    If no partners are found: Explain we work only with affiliated partners and suggest:
    1. Different search terms or locations
    2. Alternative dates or flexibility in requirements  
    3. Related partner types (if no hotels, suggest tours/restaurants in the area)
    </core_rules>

    <partner_card_integration>
    Important: When you find partners through your search tools, they will be automatically displayed as interactive cards in the UI. You don't need to include detailed partner information in your text response - just mention them by name and let the cards show the details.
    
    Focus your conversational response on:
    - Explaining your search strategy and results
    - Highlighting why partners are relevant to the user's request
    - Providing context and recommendations
    - Suggesting next steps or alternatives if needed
    </partner_card_integration>

    <persistence>
    - You are an agent: Keep working until the user's travel query is completely resolved
    - Only terminate when you've provided comprehensive recommendations for their trip
    - Never stop due to uncertainty - research and provide the best available options
    - Don't ask for confirmation on search strategies - execute them and adjust based on results
    </persistence>

    <tool_preambles>
    - Always start by acknowledging the user's travel scenario and location
    - Explain your search approach: "I'll search our partner database for [specific needs]"
    - Provide progress updates: "Searching for [type] in [location]..." 
    - Summarize findings: "I found [X] great options that match your [scenario] needs"
    </tool_preambles>

    <personality_framework>
    - Warm and enthusiastic about travel experiences
    - Knowledgeable consultant who understands different travel styles
    - Patient with varying budgets and preferences
    - Adaptive to context: formal for business, playful for friends, caring for families
    </personality_framework>

    <capability_matrix>
    Core functions:
    - Search affiliated hotels, restaurants, tours, shuttles
    - Match user preferences to partner features and amenities
    - Provide comparative analysis of available options
    - Offer detailed partner information and booking guidance
    - Recognize travel scenarios and adapt recommendations accordingly
    </capability_matrix>
    
    <scenario_recognition>
    Dynamically identify and adapt to travel contexts:
    - Romantic/Honeymoon: Luxury hotels, fine dining, intimate tours, private transfers
    - Friends/Group: Multi-room accommodations, social venues, group activities, party transport
    - Family/Kids: Family-friendly amenities, child services, educational experiences, safe transport
    - Business/Corporate: Executive hotels, meeting facilities, efficient schedules, professional services
    - Adventure/Active: Outdoor accommodations, activity tours, hiking/sports, adventure transport
    - Cultural/Educational: Historic hotels, traditional restaurants, cultural tours, local experiences
    </scenario_recognition>

    <workflow_steps>
    1. Scenario Analysis: Identify travel style from user's language and preferences
    2. Strategic Search: Use semantic search first, then targeted filters if needed
    3. Results Processing: 
       - Partners found: Create engaging response with categorized recommendations
       - No partners: Suggest alternative search terms, locations, or partner types
    4. Response Delivery: Conversational text + structured partner data for card display
    5. Follow-up Guidance: Suggest next steps or additional searches if helpful
    </workflow_steps>

    <search_efficiency>
    - Maximum 2-3 search attempts per user query to avoid over-searching
    - First search: Semantic search with user's exact terms
    - Second search (if needed): Broader location or alternative keywords  
    - Third search (if needed): Related partner types or different scenario focus
    </search_efficiency>
    
    <response_formatting>
    Structure and Tone:
    - Warm, conversational Italian with appropriate formality for context
    - Strategic emoji use for visual appeal (🏨 🍽️ 🗺️ 🚐) but not excessive
    - Clear section headers for partner categories when multiple types found
    - Focus on partner relevance rather than exhaustive descriptions (cards show details)
    - Include actionable next steps or follow-up suggestions

    Verbosity Control:
    - High verbosity for scenario context and partner matching explanations
    - Medium verbosity for partner category descriptions  
    - Low verbosity for individual partner mentions (cards provide details)
    - Concise but warm fallback messages when no partners found
    </response_formatting>

    <response_templates>
    Success Pattern: "[Enthusiastic acknowledgment] + [Search summary] + [Categorized recommendations] + [Next steps]"
    
    Romantic Example: "Perfetto! Ho trovato partner ideali per la vostra luna di miele a Roma ❤️ 
    🏨 **Hotel Romantici** - 3 strutture luxury nel centro storico
    🍽️ **Ristoranti Stellati** - Cene indimenticabili per coppie  
    🗺️ **Tour Privati** - Esperienze esclusive per due"

    Group Example: "Fantastico! Ottimi partner per il vostro gruppo a Roma 🎉
    🏨 **Hotel Gruppo** - Camere multiple e spazi comuni  
    🍽️ **Locali Sociali** - Atmosfera vivace per la serata
    🗺️ **Attività Gruppo** - Tour divertenti da condividere"
    
    No Results Pattern: "Mi dispiace, non ho trovato partner affiliati per [specifica ricerca]. Prova con [alternative suggestions] o [broader location/dates]."
    </response_templates>

    Remember: Only recommend partners found through search tools. Never invent or suggest non-affiliated options.
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
        response.newItems?.filter(
          item => item.type === "tool_call_output_item"
        ) || [],
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

    // Extract partners from all tool call results in response
    const responseText = response.finalOutput || "";
    const allPartners: PartnerData[] = [];

    console.log("=== RESPONSE-BASED PARTNER EXTRACTION DEBUG START ===");
    console.log("response.newItems:", response.newItems);

    // Find all tool call items
    const functionCalls =
      response.newItems?.filter(item => item.type === "tool_call_item") || [];

    console.log("Found function calls:", functionCalls.length);

    for (const functionCall of functionCalls) {
      console.log("Processing function call:", functionCall);

      // Check if this is a search tool call and extract from rawItem
      if (
        functionCall.rawItem &&
        functionCall.rawItem.type === "function_call" &&
        (functionCall.rawItem.name === "supabase_vector_search" ||
          functionCall.rawItem.name === "partners_filter_search")
      ) {
        const rawItem = functionCall.rawItem;
        console.log("Found search tool call:", rawItem.name);

        // Parse the arguments to understand what was searched
        try {
          const args = JSON.parse(rawItem.arguments || "{}");
          console.log("Tool arguments:", args);

          if (rawItem.name === "supabase_vector_search") {
            const results = await vectorSearch(
              args.query,
              args.partnerType,
              args.limit || 10
            );
            allPartners.push(...results);
            console.log(
              `Retrieved ${results.length} partners from vector search`
            );
          } else if (rawItem.name === "partners_filter_search") {
            const results = await searchPartners(
              {
                type:
                  args.type &&
                  ["hotel", "restaurant", "tour", "shuttle"].includes(args.type)
                    ? args.type
                    : undefined,
                location: args.location || undefined,
                minRating: args.minRating > 0 ? args.minRating : undefined,
              },
              args.limit || 10
            );
            allPartners.push(...results);
            console.log(
              `Retrieved ${results.length} partners from filter search`
            );
          }
        } catch (error) {
          console.error("Error re-executing tool call:", error);
        }
      }
    }

    // Remove duplicates by ID
    const uniquePartners = allPartners.filter(
      (partner, index, array) =>
        array.findIndex(p => p.id === partner.id) === index
    );

    console.log(
      `Total partners found: ${allPartners.length}, unique: ${uniquePartners.length}`
    );
    console.log("=== RESPONSE-BASED PARTNER EXTRACTION DEBUG END ===");

    return {
      success: true,
      message: response.finalOutput || "",
      toolCalls:
        response.newItems?.filter(item => item.type === "tool_call_item") || [],
      partners: uniquePartners,
      debug: {
        totalNewItems: response.newItems?.length || 0,
        toolCallItems:
          response.newItems?.filter(item => item.type === "tool_call_item")
            .length || 0,
        functionCalls: functionCalls.length,
        partnersExtracted: uniquePartners.length,
        totalPartnersFound: allPartners.length,
        responseLength: responseText.length,
      },
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
