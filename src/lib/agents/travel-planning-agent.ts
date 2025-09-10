import { Agent, run } from "@openai/agents";
import type { PartnerData } from "@/types";

interface PlanningInput {
  selectedPartners: PartnerData[];
  userQuery: string;
  preferences?: {
    duration?: number; // giorni
    budget?: string;
    travelStyle?: string;
    groupSize?: number;
    dates?: {
      start?: string;
      end?: string;
    };
  };
}

export const travelPlanningAgent = new Agent({
  name: "Via Nexo Travel Planning Specialist",
  model: "gpt-5-mini",
  instructions: `
    You are Via Nexo's specialized travel planning agent. Your ONLY job is to create detailed, personalized itineraries using pre-selected partner services provided by the user.

    CORE MISSION:
    You receive a curated list of partners (hotels, restaurants, tours, shuttles) that the user has specifically chosen, and you create optimized travel plans that incorporate these selections.

    KEY RESPONSIBILITIES:
    1. 🏗️ ITINERARY STRUCTURING: Create day-by-day schedules using selected partners
    2. 🗺️ GEOGRAPHICAL OPTIMIZATION: Arrange activities by location to minimize travel time
    3. ⏰ TIMING COORDINATION: Suggest optimal timing for meals, tours, and activities
    4. 🚀 LOGISTICAL PLANNING: Coordinate connections between selected partners
    5. 💡 EXPERIENCE ENHANCEMENT: Recommend how to best enjoy each selected partner

    PLANNING PROCESS:
    1. ANALYZE selected partners by category:
       - Hotels: Accommodation base and location
       - Restaurants: Dining experiences and meal times
       - Tours: Activities and duration
       - Shuttles: Transportation connections

    2. CREATE LOGICAL SEQUENCES:
       - Group partners by geographic proximity
       - Sequence activities by time of day appropriateness
       - Consider travel time between locations
       - Factor in meal times and rest periods

    3. BUILD DETAILED ITINERARY:
       - Day-by-day breakdown with timing
       - Integration points between different partner services
       - Realistic time allocations for each activity
       - Buffer time for transitions and spontaneity

    4. PROVIDE PRACTICAL GUIDANCE:
       - Best times to visit each partner
       - How to maximize each experience
       - Insider tips for selected venues
       - Contingency suggestions

    RESPONSE FORMAT:
    Structure your response as a comprehensive travel plan with:
    
    📋 **Piano di Viaggio Personalizzato**
    
    🎯 **Riepilogo Selezioni**
    [List selected partners by category with key highlights]
    
    🗓️ **Itinerario Dettagliato**
    [Day-by-day schedule with timing and transitions]
    
    💡 **Consigli Esperti**
    [Tips for maximizing each selected partner experience]
    
    🚀 **Prossimi Passi**
    [Booking suggestions and preparation recommendations]

    CONSTRAINTS:
    - ONLY use the partners provided by the user
    - Do NOT suggest additional partners not in their selection
    - Focus on optimizing the experience with their choices
    - Be specific about timing and logistics
    - Consider practical constraints (opening hours, distance, etc.)

    TONE & STYLE:
    - Professional yet enthusiastic travel consultant
    - Detail-oriented but not overwhelming  
    - Focus on the unique value of their selected partners
    - Provide actionable, practical advice
    - Use Italian for section headers as shown above
  `,
  tools: [], // No search tools - works with provided data
});

/**
 * Funzione helper per invocare il travel planning agent
 */
export async function createTravelPlan(input: PlanningInput): Promise<string> {
  const { selectedPartners, userQuery, preferences = {} } = input;

  // Raggruppa partner per categoria per analisi
  const partnersByType = {
    hotels: selectedPartners.filter(p => p.type === "hotel"),
    restaurants: selectedPartners.filter(p => p.type === "restaurant"),
    tours: selectedPartners.filter(p => p.type === "tour"),
    shuttles: selectedPartners.filter(p => p.type === "shuttle"),
  };

  // Prepara il contesto dettagliato per l'agente
  const contextualPrompt = `
RICHIESTA DELL'UTENTE: "${userQuery}"

PARTNER SELEZIONATI (${selectedPartners.length} totali):

🏨 HOTEL (${partnersByType.hotels.length}):
${partnersByType.hotels
  .map(
    h =>
      `- ${h.name} (${h.location}) - ${h.rating}⭐ - ${h.price_range}\n  ${h.description.substring(0, 100)}...`
  )
  .join("\n")}

🍽️ RISTORANTI (${partnersByType.restaurants.length}):
${partnersByType.restaurants
  .map(
    r =>
      `- ${r.name} (${r.location}) - ${r.rating}⭐ - ${r.price_range}\n  ${r.description.substring(0, 100)}...`
  )
  .join("\n")}

🗺️ TOUR (${partnersByType.tours.length}):
${partnersByType.tours
  .map(
    t =>
      `- ${t.name} (${t.location}) - ${t.rating}⭐ - ${t.price_range}\n  ${t.description.substring(0, 100)}...`
  )
  .join("\n")}

🚐 TRASPORTI (${partnersByType.shuttles.length}):
${partnersByType.shuttles
  .map(
    s =>
      `- ${s.name} (${s.location}) - ${s.rating}⭐ - ${s.price_range}\n  ${s.description.substring(0, 100)}...`
  )
  .join("\n")}

PREFERENZE UTENTE:
${preferences.duration ? `- Durata: ${preferences.duration} giorni` : ""}
${preferences.budget ? `- Budget: ${preferences.budget}` : ""}
${preferences.travelStyle ? `- Stile di viaggio: ${preferences.travelStyle}` : ""}
${preferences.groupSize ? `- Dimensione gruppo: ${preferences.groupSize} persone` : ""}
${preferences.dates?.start ? `- Date: ${preferences.dates.start}${preferences.dates.end ? ` - ${preferences.dates.end}` : ""}` : ""}

ISTRUZIONI:
Crea un piano di viaggio dettagliato che integri TUTTI questi partner selezionati in modo logico e ottimizzato. Focus su timing, logistica e massimizzazione dell'esperienza per ognuno dei partner scelti dall'utente.
  `;

  // Esegui l'agente con il contesto completo
  const response = await run(travelPlanningAgent, contextualPrompt);
  return (
    response.finalOutput || "Errore nella generazione del piano di viaggio."
  );
}
