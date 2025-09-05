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
  threshold: number = 0.5
): Promise<Partner[]> {
  try {
    // Generate embedding for the search query
    const queryEmbedding = await generateEmbeddings(query);

    // Build the query
    let supabaseQuery = supabase.rpc("match_partners", {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
    });

    // Add type filter if specified
    if (partnerType) {
      supabaseQuery = supabaseQuery.eq("type", partnerType);
    }

    const { data, error } = await supabaseQuery;

    if (error) {
      console.error("Supabase vector search error:", error);
      throw new Error(`Vector search failed: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error("Vector search error:", error);
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
    let query = supabase.from("partners").select("*");

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

    return data || [];
  } catch (error) {
    console.error("Search partners error:", error);
    throw error;
  }
}
