import { createClient } from "@supabase/supabase-js";
import { generateEmbeddings } from "./openai";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export interface Partner {
  id: string;
  name: string;
  type: "hotel" | "restaurant" | "tour" | "shuttle";
  description: string;
  location: string;
  price_range: string;
  rating: number;
  amenities?: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
  images?: string[];
  contact_info?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  embedding?: number[];
  created_at?: string;
  updated_at?: string;
}

export async function vectorSearch(
  query: string,
  partnerType?: Partner["type"],
  limit: number = 10,
  threshold: number = 0.3 // Optimized threshold for better results
): Promise<Partner[]> {
  try {
    console.log(`[VECTOR_SEARCH] Starting search for query: "${query}"`);
    console.log(
      `[VECTOR_SEARCH] Parameters - partnerType: ${partnerType}, limit: ${limit}, threshold: ${threshold}`
    );

    // Generate embedding for the search query
    console.log(`[VECTOR_SEARCH] Generating embedding for query...`);
    const queryEmbedding = await generateEmbeddings(query);
    console.log(
      `[VECTOR_SEARCH] Generated embedding length: ${queryEmbedding.length}`
    );
    console.log(
      `[VECTOR_SEARCH] First 5 embedding values: [${queryEmbedding.slice(0, 5).join(", ")}]`
    );

    console.log(`[VECTOR_SEARCH] Calling Supabase RPC match_partners...`);
    const { data, error } = await supabase.rpc("match_partners", {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
    });

    if (error) {
      console.error("[VECTOR_SEARCH] Supabase vector search error:", error);
      throw new Error(`Vector search failed: ${error.message}`);
    }

    console.log(
      `[VECTOR_SEARCH] Raw RPC response - data length: ${data?.length || 0}`
    );
    console.log(`[VECTOR_SEARCH] Raw RPC data:`, JSON.stringify(data, null, 2));

    let results = data || [];
    console.log(`[VECTOR_SEARCH] Results before filtering: ${results.length}`);

    // Filter by type if specified (since RPC doesn't support additional filters)
    if (partnerType) {
      console.log(`[VECTOR_SEARCH] Filtering by type: ${partnerType}`);
      results = results.filter(
        (partner: unknown) =>
          typeof partner === "object" &&
          partner !== null &&
          "type" in partner &&
          partner.type === partnerType
      );
      console.log(`[VECTOR_SEARCH] Results after filtering: ${results.length}`);
    }

    // Transform data to match Partner interface
    console.log(
      `[VECTOR_SEARCH] Mapping ${results.length} results to Partner interface...`
    );
    const mappedResults = results.map((partner: unknown) => {
      // Type guard to ensure partner is an object with required properties
      if (typeof partner !== "object" || partner === null) {
        throw new Error("Invalid partner data received from database");
      }

      const partnerObj = partner as Record<string, unknown>;

      return {
        id: partnerObj.id as string,
        name: partnerObj.name as string,
        type: partnerObj.type as Partner["type"],
        description: partnerObj.description as string,
        location: partnerObj.location as string,
        price_range: partnerObj.price_range as string,
        rating:
          typeof partnerObj.rating === "string"
            ? parseFloat(partnerObj.rating as string)
            : (partnerObj.rating as number),
        amenities: (partnerObj.amenities as string[]) || [],
        coordinates: partnerObj.coordinates as
          | { lat: number; lng: number }
          | undefined,
        images: (partnerObj.images as string[]) || [],
        contact_info: partnerObj.contact_info
          ? {
              phone: (partnerObj.contact_info as Record<string, unknown>)
                .phone as string | undefined,
              email: (partnerObj.contact_info as Record<string, unknown>)
                .email as string | undefined,
              website: (partnerObj.contact_info as Record<string, unknown>)
                .website as string | undefined,
            }
          : undefined,
        created_at: partnerObj.created_at as string | undefined,
        updated_at: partnerObj.updated_at as string | undefined,
      };
    });

    console.log(
      `[VECTOR_SEARCH] Final results - returning ${mappedResults.length} partners`
    );
    console.log(
      `[VECTOR_SEARCH] Partner names: [${mappedResults.map((p: Partner) => p.name).join(", ")}]`
    );

    return mappedResults;
  } catch (error) {
    console.error("[VECTOR_SEARCH] Error occurred:", error);
    throw error;
  }
}

export async function getPartnersByIds(ids: string[]): Promise<Partner[]> {
  try {
    const { data, error } = await supabase
      .from("partners")
      .select("*")
      .in("id", ids);

    if (error) {
      console.error("Supabase get partners error:", error);
      throw new Error(`Failed to get partners: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error("Get partners error:", error);
    throw error;
  }
}

export async function searchPartners(
  filters: {
    type?: Partner["type"];
    location?: string;
    minRating?: number;
    maxPrice?: number;
    amenities?: string[];
  },
  limit: number = 20
): Promise<Partner[]> {
  try {
    let query = supabase.from("partners").select(`
      id, name, type, description, location, price_range, rating, 
      amenities, coordinates, images, contact_info, created_at, updated_at
    `);

    if (filters.type) {
      query = query.eq("type", filters.type);
    }

    if (filters.location) {
      query = query.ilike("location", `%${filters.location}%`);
    }

    if (filters.minRating) {
      query = query.gte("rating", filters.minRating);
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error("Supabase search partners error:", error);
      throw new Error(`Search failed: ${error.message}`);
    }

    // Transform data to match Partner interface
    return (data || []).map((partner: unknown) => {
      if (typeof partner !== "object" || partner === null) {
        throw new Error("Invalid partner data received from database");
      }

      const partnerObj = partner as Record<string, unknown>;

      return {
        id: partnerObj.id as string,
        name: partnerObj.name as string,
        type: partnerObj.type as Partner["type"],
        description: partnerObj.description as string,
        location: partnerObj.location as string,
        price_range: partnerObj.price_range as string,
        rating:
          typeof partnerObj.rating === "string"
            ? parseFloat(partnerObj.rating as string)
            : (partnerObj.rating as number),
        amenities: (partnerObj.amenities as string[]) || [],
        coordinates: partnerObj.coordinates as
          | { lat: number; lng: number }
          | undefined,
        images: (partnerObj.images as string[]) || [],
        contact_info: partnerObj.contact_info
          ? {
              phone: (partnerObj.contact_info as Record<string, unknown>)
                .phone as string | undefined,
              email: (partnerObj.contact_info as Record<string, unknown>)
                .email as string | undefined,
              website: (partnerObj.contact_info as Record<string, unknown>)
                .website as string | undefined,
            }
          : undefined,
        created_at: partnerObj.created_at as string | undefined,
        updated_at: partnerObj.updated_at as string | undefined,
      };
    });
  } catch (error) {
    console.error("Search partners error:", error);
    throw error;
  }
}
