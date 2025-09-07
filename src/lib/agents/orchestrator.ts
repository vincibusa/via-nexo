import { run } from "@openai/agents";
import { hotelAgent } from "./hotel-agent";
import { restaurantAgent } from "./restaurant-agent";
import { tourAgent } from "./tour-agent";
import { shuttleAgent } from "./shuttle-agent";
import type { PartnerData } from "@/types";

interface QueryAnalysis {
  detectedTypes: PartnerData["type"][];
  confidence: Record<PartnerData["type"], number>;
  isGeneral: boolean;
  primaryType?: PartnerData["type"];
  searchTerms: {
    location?: string;
    timeframe?: string;
    occasion?: string;
    budget?: string;
    groupSize?: string;
    generalTravelConfidence?: number;
    hasDateRange?: boolean;
    isGeneralTripPlanning?: boolean;
  };
}

interface AgentResult {
  agentType: PartnerData["type"];
  success: boolean;
  message: string;
  partners: PartnerData[];
  executionTime: number;
  error?: string;
}

interface OrchestratorResult {
  success: boolean;
  message: string;
  partners: PartnerData[];
  agentResults: AgentResult[];
  executionSummary: {
    totalAgentsUsed: number;
    totalExecutionTime: number;
    totalPartnersFound: number;
    analysisConfidence: number;
  };
}

/**
 * Analizza la query dell'utente per determinare quali agenti attivare
 */
export function analyzeUserQuery(query: string): QueryAnalysis {
  const queryLower = query.toLowerCase();

  // Pattern recognition per tipi di partner
  const hotelPatterns = [
    "hotel",
    "albergo",
    "dormire",
    "notte",
    "camera",
    "prenotare",
    "soggiorno",
    "pernottare",
    "bed",
    "accommodation",
    "suite",
    "resort",
    "stelle",
    "lusso",
    "budget",
    "economico",
  ];

  const restaurantPatterns = [
    "ristorante",
    "mangiare",
    "cena",
    "pranzo",
    "cucina",
    "menu",
    "piatto",
    "tavola",
    "food",
    "dining",
    "restaurant",
    "trattoria",
    "osteria",
    "pizzeria",
    "michelin",
    "stellato",
    "gourmet",
    "locale",
    "tipico",
    "specialità",
    "vino",
    "aperitivo",
  ];

  const tourPatterns = [
    "tour",
    "visita",
    "escursione",
    "gita",
    "esperienza",
    "attività",
    "vedere",
    "tourist",
    "sightseeing",
    "walking",
    "guided",
    "culturale",
    "storico",
    "museo",
    "arte",
    "architettura",
    "natura",
    "avventura",
    "trekking",
    "hiking",
    "bike",
  ];

  const shuttlePatterns = [
    "trasporto",
    "navetta",
    "transfer",
    "aeroporto",
    "stazione",
    "muovere",
    "shuttle",
    "transport",
    "bus",
    "taxi",
    "car",
    "pick up",
    "drop off",
    "arrivare",
    "partire",
    "collegamento",
    "spostamento",
  ];

  // General travel planning patterns (high priority for multi-agent activation)
  const generalTravelPatterns = [
    "viaggio",
    "organizza",
    "pianifica",
    "programma",
    "itinerario",
    "vacanza",
    "trip",
    "organize",
    "plan",
    "vacation",
    "holiday",
    "weekend",
    "settimana",
    "completo",
    "tutto",
    "per due",
    "coppia",
    "famiglia",
    "gruppo",
    "dal",
    "al",
    "giorni",
    "settimane",
    "mesi",
  ];

  // Check for general travel planning patterns first
  const generalTravelConfidence = calculatePatternConfidence(
    queryLower,
    generalTravelPatterns
  );
  const hasDateRange =
    /\b(dal|from)\b.*\b(al|to)\b/.test(queryLower) ||
    /\b\d{1,2}\s*(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\b/.test(
      queryLower
    );

  // Calcola confidence scores
  const confidence: Record<PartnerData["type"], number> = {
    hotel: calculatePatternConfidence(queryLower, hotelPatterns),
    restaurant: calculatePatternConfidence(queryLower, restaurantPatterns),
    tour: calculatePatternConfidence(queryLower, tourPatterns),
    shuttle: calculatePatternConfidence(queryLower, shuttlePatterns),
  };

  // Determina se è una query generale per trip planning
  const maxConfidence = Math.max(...Object.values(confidence));
  const isGeneralTripPlanning =
    generalTravelConfidence > 0.2 ||
    hasDateRange ||
    (maxConfidence < 0.2 && generalTravelConfidence > 0.1);

  // Se è general trip planning, attiva tutti gli agenti
  let detectedTypes: PartnerData["type"][];
  if (isGeneralTripPlanning) {
    detectedTypes = ["hotel", "restaurant", "tour", "shuttle"];
  } else {
    // Determina tipi rilevati (soglia minima 0.15 per essere più selettivi)
    detectedTypes = Object.entries(confidence)
      .filter(([, score]) => score > 0.15)
      .map(([type]) => type as PartnerData["type"])
      .sort((a, b) => confidence[b] - confidence[a]);
  }

  // Fallback se nessun tipo rilevato ma c'è una location
  if (detectedTypes.length === 0 && extractSearchTerms(query).location) {
    detectedTypes = ["hotel", "restaurant", "tour", "shuttle"];
  }

  // Determina se è una query generale
  const isGeneral =
    isGeneralTripPlanning ||
    detectedTypes.length > 2 ||
    (detectedTypes.length > 1 && maxConfidence < 0.4);

  // Estrai termini di ricerca contestuali
  const searchTerms = extractSearchTerms(query);

  return {
    detectedTypes:
      detectedTypes.length > 0
        ? detectedTypes
        : ["hotel", "restaurant", "tour", "shuttle"],
    confidence,
    isGeneral,
    primaryType: detectedTypes[0],
    searchTerms: {
      ...searchTerms,
      generalTravelConfidence,
      hasDateRange,
      isGeneralTripPlanning,
    },
  };
}

/**
 * Calcola confidence score per pattern matching
 */
function calculatePatternConfidence(query: string, patterns: string[]): number {
  let score = 0;
  let matches = 0;

  patterns.forEach(pattern => {
    if (query.includes(pattern)) {
      matches++;
      // Pattern più lunghi hanno peso maggiore
      score += pattern.length / 10;
    }
  });

  // Normalizza il punteggio
  return Math.min(score / patterns.length + matches * 0.1, 1);
}

/**
 * Estrae termini contestuali dalla query
 */
function extractSearchTerms(query: string): QueryAnalysis["searchTerms"] {
  const terms: QueryAnalysis["searchTerms"] = {};

  // Location patterns
  const locationPatterns = [
    "roma",
    "milan",
    "firenze",
    "venezia",
    "napoli",
    "torino",
    "bologna",
    "centro",
    "centro storico",
    "near",
    "vicino",
    "zona",
    "quartiere",
  ];

  // Budget patterns
  const budgetPatterns = [
    "economico",
    "budget",
    "cheap",
    "lusso",
    "luxury",
    "premium",
    "costoso",
    "expensive",
  ];

  // Group size patterns
  const groupPatterns = [
    "famiglia",
    "family",
    "coppia",
    "couple",
    "gruppo",
    "group",
    "solo",
    "bambini",
    "kids",
  ];

  // Occasion patterns
  const occasionPatterns = [
    "romantico",
    "romantic",
    "business",
    "lavoro",
    "anniversario",
    "anniversary",
    "compleanno",
    "birthday",
    "celebrazione",
    "celebration",
    "matrimonio",
    "wedding",
  ];

  const queryLower = query.toLowerCase();

  if (locationPatterns.some(loc => queryLower.includes(loc))) {
    terms.location = locationPatterns.find(loc => queryLower.includes(loc));
  }

  if (budgetPatterns.some(budget => queryLower.includes(budget))) {
    terms.budget = budgetPatterns.find(budget => queryLower.includes(budget));
  }

  if (groupPatterns.some(group => queryLower.includes(group))) {
    terms.groupSize = groupPatterns.find(group => queryLower.includes(group));
  }

  if (occasionPatterns.some(occasion => queryLower.includes(occasion))) {
    terms.occasion = occasionPatterns.find(occasion =>
      queryLower.includes(occasion)
    );
  }

  return terms;
}

/**
 * Esegue gli agenti in parallelo o sequenziale in base alla query
 */
export async function runAgentOrchestration(
  query: string,
  conversationHistory: Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }> = []
): Promise<OrchestratorResult> {
  const startTime = Date.now();

  // Analizza la query
  const analysis = analyzeUserQuery(query);

  // Prepara il contesto conversazionale
  const contextualPrompt =
    conversationHistory.length > 0
      ? `Conversation context: ${conversationHistory
          .slice(-3)
          .map(m => `${m.role}: ${m.content}`)
          .join("\n")}\n\nCurrent query: ${query}`
      : query;

  // Strategia di esecuzione
  const shouldRunInParallel =
    analysis.isGeneral || analysis.detectedTypes.length > 2;

  console.log(`[ORCHESTRATOR] Query analysis:`, analysis);
  console.log(
    `[ORCHESTRATOR] Execution strategy: ${shouldRunInParallel ? "PARALLEL" : "SEQUENTIAL"}`
  );
  console.log(
    `[ORCHESTRATOR] Agents to run: ${analysis.detectedTypes.join(", ")}`
  );

  let agentResults: AgentResult[] = [];

  if (shouldRunInParallel) {
    // Esecuzione parallela per query generali
    agentResults = await runAgentsInParallel(
      contextualPrompt,
      analysis.detectedTypes
    );
  } else {
    // Esecuzione sequenziale per query specifiche
    agentResults = await runAgentsSequentially(
      contextualPrompt,
      analysis.detectedTypes
    );
  }

  // Aggrega i risultati
  const allPartners = agentResults.flatMap(result => result.partners);
  const totalExecutionTime = Date.now() - startTime;

  // Rimuovi duplicati per ID
  const uniquePartners = allPartners.filter(
    (partner, index, array) =>
      array.findIndex(p => p.id === partner.id) === index
  );

  // Genera messaggio di risposta aggregato
  const responseMessage = generateAggregatedResponse(agentResults, analysis);

  return {
    success: agentResults.some(result => result.success),
    message: responseMessage,
    partners: uniquePartners,
    agentResults,
    executionSummary: {
      totalAgentsUsed: agentResults.length,
      totalExecutionTime,
      totalPartnersFound: uniquePartners.length,
      analysisConfidence: Math.max(...Object.values(analysis.confidence)),
    },
  };
}

/**
 * Esegue gli agenti in parallelo
 */
async function runAgentsInParallel(
  query: string,
  agentTypes: PartnerData["type"][]
): Promise<AgentResult[]> {
  const agentMap = {
    hotel: hotelAgent,
    restaurant: restaurantAgent,
    tour: tourAgent,
    shuttle: shuttleAgent,
  };

  const agentPromises = agentTypes.map(async (type): Promise<AgentResult> => {
    const startTime = Date.now();
    try {
      const agent = agentMap[type];
      // Increase maxTurns for agents that make multiple tool calls
      const maxTurns = type === "tour" || type === "shuttle" ? 6 : 3;
      const response = await run(agent, query, { maxTurns });

      console.log(`[ORCHESTRATOR] About to extract partners for ${type}`);
      const partners = extractPartnersFromResponse(response, type);
      console.log(
        `[ORCHESTRATOR] Extracted ${partners.length} partners for ${type}`
      );

      return {
        agentType: type,
        success: true,
        message: response.finalOutput || "",
        partners,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error(`[ORCHESTRATOR] Agent ${type} failed:`, error);
      return {
        agentType: type,
        success: false,
        message: `Failed to search ${type}s`,
        partners: [],
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  return Promise.all(agentPromises);
}

/**
 * Esegue gli agenti in sequenza (per query molto specifiche)
 */
async function runAgentsSequentially(
  query: string,
  agentTypes: PartnerData["type"][]
): Promise<AgentResult[]> {
  const agentMap = {
    hotel: hotelAgent,
    restaurant: restaurantAgent,
    tour: tourAgent,
    shuttle: shuttleAgent,
  };

  const results: AgentResult[] = [];

  for (const type of agentTypes) {
    const startTime = Date.now();
    try {
      const agent = agentMap[type];
      // Increase maxTurns for agents that make multiple tool calls
      const maxTurns = type === "tour" || type === "shuttle" ? 6 : 3;
      const response = await run(agent, query, { maxTurns });

      const partners = extractPartnersFromResponse(response, type);

      results.push({
        agentType: type,
        success: true,
        message: response.finalOutput || "",
        partners,
        executionTime: Date.now() - startTime,
      });

      // Early termination se abbiamo già risultati sufficienti dal tipo primario
      if (type === agentTypes[0] && partners.length >= 3) {
        console.log(
          `[ORCHESTRATOR] Early termination: Found ${partners.length} results for primary type ${type}`
        );
        break;
      }
    } catch (error) {
      results.push({
        agentType: type,
        success: false,
        message: `Failed to search ${type}s`,
        partners: [],
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}

/**
 * Estrae partner dai risultati degli agenti
 */
function extractPartnersFromResponse(
  response: unknown,
  type: PartnerData["type"]
): PartnerData[] {
  const partners: PartnerData[] = [];

  console.log(`[PARTNER_EXTRACTION] Starting extraction for ${type}:`, {
    responseType: typeof response,
  });

  try {
    // Trova i tool calls di ricerca
    const responseObj = response as {
      newItems?: { type: string; rawItem?: unknown }[];
    };
    console.log(`[PARTNER_EXTRACTION] Response structure:`, {
      hasNewItems: !!responseObj.newItems,
      newItemsLength: responseObj.newItems?.length,
      newItemsTypes: responseObj.newItems?.map(item => item.type),
    });

    const functionCalls =
      responseObj.newItems?.filter(item => item.type === "tool_call_item") ||
      [];
    console.log(
      `[PARTNER_EXTRACTION] Found function calls:`,
      functionCalls.length
    );

    for (const functionCall of functionCalls) {
      console.log(`[PARTNER_EXTRACTION] Processing function call:`, {
        hasRawItem: !!functionCall.rawItem,
        rawItemType: typeof functionCall.rawItem,
        rawItemKeys:
          functionCall.rawItem && typeof functionCall.rawItem === "object"
            ? Object.keys(functionCall.rawItem)
            : [],
      });

      // Verifica se è un tool call di ricerca
      if (
        functionCall.rawItem &&
        typeof functionCall.rawItem === "object" &&
        "type" in functionCall.rawItem &&
        functionCall.rawItem.type === "function_call"
      ) {
        const toolName =
          "name" in functionCall.rawItem ? functionCall.rawItem.name : "";
        console.log(`[PARTNER_EXTRACTION] Found function call:`, {
          toolName,
          hasId: "id" in functionCall.rawItem,
        });

        // Trova il tool output corrispondente (usa callId di entrambi)
        const toolOutput = responseObj.newItems?.find(
          item =>
            item.type === "tool_call_output_item" &&
            item.rawItem &&
            typeof item.rawItem === "object" &&
            "callId" in item.rawItem &&
            functionCall.rawItem &&
            typeof functionCall.rawItem === "object" &&
            "callId" in functionCall.rawItem &&
            item.rawItem.callId === functionCall.rawItem.callId
        );

        // Debug ID matching issue
        const allOutputs =
          responseObj.newItems?.filter(
            item => item.type === "tool_call_output_item"
          ) || [];
        const outputIds = allOutputs.map(output =>
          output.rawItem &&
          typeof output.rawItem === "object" &&
          "callId" in output.rawItem
            ? output.rawItem.callId
            : "no-callId"
        );

        console.log(`[PARTNER_EXTRACTION] Tool output search:`, {
          foundOutput: !!toolOutput,
          functionCallId:
            functionCall.rawItem &&
            typeof functionCall.rawItem === "object" &&
            "id" in functionCall.rawItem
              ? functionCall.rawItem.id
              : "no-id",
          functionCallCallId:
            functionCall.rawItem &&
            typeof functionCall.rawItem === "object" &&
            "callId" in functionCall.rawItem
              ? functionCall.rawItem.callId
              : "no-callId",
          availableOutputs: allOutputs.length,
          outputIds: outputIds,
          firstOutputKeys:
            allOutputs[0]?.rawItem && typeof allOutputs[0].rawItem === "object"
              ? Object.keys(allOutputs[0].rawItem)
              : [],
        });

        if (
          toolOutput &&
          toolOutput.rawItem &&
          typeof toolOutput.rawItem === "object" &&
          "output" in toolOutput.rawItem
        ) {
          try {
            const content = (toolOutput.rawItem as { output: unknown }).output;
            console.log(`[PARTNER_EXTRACTION] Parsing tool output content:`, {
              contentType: typeof content,
              isObject: typeof content === "object",
              contentLength:
                typeof content === "string" ? content.length : "not-string",
              toolName,
            });

            // Log full content structure to debug
            if (typeof content === "object" && content !== null) {
              console.log(
                `[PARTNER_EXTRACTION] Full content object keys:`,
                Object.keys(content)
              );
              console.log(
                `[PARTNER_EXTRACTION] Full content object:`,
                JSON.stringify(content, null, 2)
              );
            }

            // Handle OpenAI Agents framework content structure
            let result: unknown;
            if (
              typeof content === "object" &&
              content !== null &&
              "text" in content &&
              typeof content.text === "string"
            ) {
              // OpenAI Agents wraps output in { type: "text", text: "JSON string" }
              result = JSON.parse(content.text);
              console.log(
                `[PARTNER_EXTRACTION] Parsed OpenAI Agents text wrapper content`
              );
            } else if (typeof content === "object" && content !== null) {
              // Content is already a parsed object, use directly
              result = content;
              console.log(
                `[PARTNER_EXTRACTION] Using content as object directly`
              );
            } else if (typeof content === "string") {
              // Content is a JSON string, parse it
              result = JSON.parse(content);
              console.log(`[PARTNER_EXTRACTION] Parsed JSON string content`);
            } else {
              throw new Error(`Unexpected content type: ${typeof content}`);
            }

            console.log(`[PARTNER_EXTRACTION] Parsed result:`, {
              success: (result as { success?: boolean }).success,
              dataCount: (result as { data?: unknown[] }).data?.length,
              hasData: !!(result as { data?: unknown }).data,
            });

            if (
              (result as { success?: boolean }).success &&
              (result as { data?: unknown }).data &&
              Array.isArray((result as { data?: unknown[] }).data)
            ) {
              // Trasforma i risultati nel formato PartnerData
              const transformedPartners = (result as { data: unknown[] }).data
                .filter(
                  (item): item is Record<string, unknown> =>
                    typeof item === "object" && item !== null
                )
                .map(
                  (item): PartnerData => ({
                    id: String(item.id || ""),
                    name: String(item.name || ""),
                    type: type,
                    description: String(item.description || ""),
                    location: String(item.location || item.city || ""),
                    price_range: String(item.price_range || ""),
                    rating: parseFloat(
                      String(item.rating || item.star_rating || "0")
                    ),
                    amenities: Array.isArray(item.amenities)
                      ? item.amenities
                      : Array.isArray(item.menu_highlights)
                        ? item.menu_highlights
                        : Array.isArray(item.includes)
                          ? item.includes
                          : Array.isArray(item.features)
                            ? item.features
                            : [],
                    coordinates:
                      item.coordinates && typeof item.coordinates === "object"
                        ? (item.coordinates as { lat: number; lng: number })
                        : undefined,
                    images: Array.isArray(item.gallery_urls)
                      ? item.gallery_urls
                      : Array.isArray(item.images)
                        ? item.images
                        : [],
                    contact_info: {
                      phone: item.phone ? String(item.phone) : undefined,
                      email: item.email ? String(item.email) : undefined,
                      website: item.website
                        ? String(item.website)
                        : item.booking_url
                          ? String(item.booking_url)
                          : item.reservation_url
                            ? String(item.reservation_url)
                            : undefined,
                    },
                  })
                );

              console.log(`[PARTNER_EXTRACTION] Transformed partners:`, {
                count: transformedPartners.length,
                sampleName: transformedPartners[0]?.name,
              });
              partners.push(...transformedPartners);
            }
          } catch (parseError) {
            console.error(
              `[ORCHESTRATOR] Error parsing tool output for ${toolName}:`,
              parseError
            );
          }
        }
      }
    }
  } catch (error) {
    console.error(
      `[PARTNER_EXTRACTION] Error extracting partners for ${type}:`,
      error
    );
  }

  console.log(`[PARTNER_EXTRACTION] Final extraction result for ${type}:`, {
    totalPartnersExtracted: partners.length,
  });
  return partners;
}

/**
 * Genera una risposta aggregata dai risultati di tutti gli agenti
 */
function generateAggregatedResponse(
  results: AgentResult[],
  analysis: QueryAnalysis
): string {
  const successfulResults = results.filter(
    r => r.success && r.partners.length > 0
  );
  const totalPartners = successfulResults.reduce(
    (sum, r) => sum + r.partners.length,
    0
  );

  if (successfulResults.length === 0) {
    return `Mi dispiace, non ho trovato risultati per la tua ricerca. Prova con termini diversi o contatta il nostro team per assistenza personalizzata.`;
  }

  // Genera intro basata sull'analisi
  const intro = analysis.isGeneral
    ? `Fantastico! Ho trovato ${totalPartners} opzioni perfette per il tuo viaggio:`
    : `Ottimo! Ho trovato ${totalPartners} ${analysis.primaryType}${totalPartners > 1 ? "s" : ""} che fanno al caso tuo:`;

  // Aggrega i messaggi per tipo
  const typeMessages = successfulResults
    .map(result => {
      const emoji = {
        hotel: "🏨",
        restaurant: "🍽️",
        tour: "🗺️",
        shuttle: "🚐",
      }[result.agentType];

      return `${emoji} **${result.agentType.charAt(0).toUpperCase() + result.agentType.slice(1)}s**: ${result.partners.length} opzioni trovate`;
    })
    .join("\n");

  const outro =
    successfulResults.length > 1
      ? "\n\nTutte le opzioni sono visualizzate qui sotto con i dettagli completi. Fammi sapere se vuoi approfondire qualche categoria specifica!"
      : "\n\nDettagli completi disponibili nelle card qui sotto!";

  return `${intro}\n\n${typeMessages}${outro}`;
}
