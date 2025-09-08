import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";
import { z } from "zod";

// Schema di validazione per la ricerca tradizionale
const traditionalSearchSchema = z.object({
  query: z.string().default(""),
  partnerTypes: z
    .array(z.enum(["hotel", "restaurant", "tour", "shuttle"]))
    .default([]),
  priceRange: z.tuple([z.number().min(1), z.number().max(5)]).default([1, 5]),
  locations: z.array(z.string()).default([]),
  cuisineTypes: z.array(z.string()).optional(),
  tourTypes: z.array(z.string()).optional(),
  serviceTypes: z.array(z.string()).optional(),
  sortBy: z
    .enum([
      "relevance",
      "name-asc",
      "name-desc",
      "price-low",
      "price-high",
      "rating",
      "recent",
    ])
    .default("relevance"),
});

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100");
const RATE_LIMIT_WINDOW = parseInt(
  process.env.RATE_LIMIT_WINDOW_MS || "900000"
);

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);

  if (!userLimit) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_MAX) {
    return false;
  }

  userLimit.count += 1;
  return true;
}

// Interfaccia Partner compatibile con il client
interface Partner {
  id: string;
  name: string;
  type: "hotel" | "restaurant" | "tour" | "transport";
  description: string;
  rating: number;
  reviewCount: number;
  priceRange: "budget" | "mid-range" | "luxury" | "premium";
  location: {
    address: string;
    city: string;
    region: string;
    country: string;
    coordinates: { lat: number; lng: number };
    timezone: string;
  };
  images: string[];
  features: string[];
  contact: {
    phone?: string;
    email?: string;
    website?: string;
  };
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip =
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Parse e valida il body della richiesta
    const body = await request.json();
    console.log("🔍 Traditional Search API - Request body:", body);

    const validation = traditionalSearchSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const {
      query,
      partnerTypes,
      priceRange,
      locations,
      cuisineTypes,
      tourTypes,
      serviceTypes,
      sortBy,
    } = validation.data;

    console.log("🔍 Validated search parameters:", {
      query,
      partnerTypes,
      priceRange,
      locations,
      cuisineTypes,
      tourTypes,
      serviceTypes,
      sortBy,
    });

    // Early return se non ci sono criteri di ricerca
    if (!query.trim() && partnerTypes.length === 0 && locations.length === 0) {
      console.log("❌ No search criteria provided");
      return NextResponse.json({
        success: true,
        results: [],
        total: 0,
        message: "No search criteria provided",
      });
    }

    // Costruisci la query base
    let supabaseQuery = supabase.from("partners").select(`
        id, name, type, description, location, price_range, rating,
        amenities, coordinates, contact_info, images, created_at, updated_at
      `);

    // Filtro per tipi di partner
    if (partnerTypes.length > 0) {
      const mappedTypes = partnerTypes.map(type =>
        type === "shuttle" ? "transport" : type
      );
      supabaseQuery = supabaseQuery.in("type", mappedTypes);
    }

    // Ricerca testuale
    if (query.trim()) {
      const escapedQuery = query.trim().replace(/[%\\]/g, "\\$&");
      supabaseQuery = supabaseQuery.or(
        `name.ilike.%${escapedQuery}%,description.ilike.%${escapedQuery}%,location.ilike.%${escapedQuery}%`
      );
    }

    // Filtro per location
    if (locations.length > 0) {
      const locationFilters = locations
        .map(loc => `location.ilike.%${loc}%`)
        .join(",");
      supabaseQuery = supabaseQuery.or(locationFilters);
    }

    // Filtro per range di prezzo (mappiamo da numerico a stringa)
    if (priceRange[0] > 1 || priceRange[1] < 5) {
      const priceFilters: string[] = [];
      for (let i = priceRange[0]; i <= priceRange[1]; i++) {
        switch (i) {
          case 1:
            priceFilters.push("budget");
            break;
          case 2:
            priceFilters.push("mid-range");
            break;
          case 3:
            priceFilters.push("luxury");
            break;
          case 4:
          case 5:
            priceFilters.push("premium");
            break;
        }
      }
      if (priceFilters.length > 0) {
        supabaseQuery = supabaseQuery.in("price_range", priceFilters);
      }
    }

    // Applica ordinamento
    switch (sortBy) {
      case "name-asc":
        supabaseQuery = supabaseQuery.order("name", { ascending: true });
        break;
      case "name-desc":
        supabaseQuery = supabaseQuery.order("name", { ascending: false });
        break;
      case "rating":
        supabaseQuery = supabaseQuery.order("rating", { ascending: false });
        break;
      case "recent":
        supabaseQuery = supabaseQuery.order("created_at", { ascending: false });
        break;
      default:
        // relevance - mantieni ordine naturale della query
        break;
    }

    // Limita risultati
    supabaseQuery = supabaseQuery.limit(25);

    console.log("🔍 Executing Supabase query...");

    // Esegui la query
    const { data, error } = await supabaseQuery;

    if (error) {
      console.error("❌ Supabase query error:", error);
      return NextResponse.json(
        { error: `Database query failed: ${error.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ Query successful, found ${data?.length || 0} results`);

    // Trasforma i dati per la compatibilità con il client
    const transformedResults: Partner[] = (data || []).map(partner => ({
      id: partner.id,
      name: partner.name,
      type: partner.type === "transport" ? "transport" : partner.type,
      description: partner.description || "",
      rating: typeof partner.rating === "number" ? partner.rating : 4.0,
      reviewCount: Math.floor(Math.random() * 200) + 10,
      priceRange: partner.price_range as
        | "budget"
        | "mid-range"
        | "luxury"
        | "premium",
      location: {
        address: partner.location || "",
        city: extractCity(partner.location || ""),
        region: extractRegion(partner.location || ""),
        country: "Italy",
        coordinates: partner.coordinates || { lat: 41.9028, lng: 12.4964 },
        timezone: "Europe/Rome",
      },
      images:
        partner.images?.length > 0
          ? partner.images
          : [`/images/${partner.type}-placeholder.jpg`],
      features: partner.amenities?.slice(0, 6) || [partner.type, "Verified"],
      contact: {
        phone: partner.contact_info?.phone,
        email: partner.contact_info?.email,
        website: partner.contact_info?.website,
      },
      isVerified: true,
      createdAt: partner.created_at || new Date().toISOString(),
      updatedAt: partner.updated_at || new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      results: transformedResults,
      total: transformedResults.length,
      query: {
        original: query,
        filters: { partnerTypes, priceRange, locations, sortBy },
      },
    });
  } catch (error) {
    console.error("❌ Traditional search API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: "Via Nexo Traditional Search API",
      version: "1.0.0",
      description:
        "Server-side search for partners with filtering capabilities",
      endpoints: {
        POST: {
          description: "Search partners with various filters",
          schema: {
            query: "string (optional)",
            partnerTypes:
              "array of enum [hotel, restaurant, tour, shuttle] (optional)",
            priceRange:
              "tuple [min, max] from 1 to 5 (optional, default [1,5])",
            locations: "array of strings (optional)",
            cuisineTypes: "array of strings (optional)",
            tourTypes: "array of strings (optional)",
            serviceTypes: "array of strings (optional)",
            sortBy:
              "enum [relevance, name-asc, name-desc, price-low, price-high, rating, recent] (optional)",
          },
        },
      },
      examples: {
        basicSearch: {
          query: "hotel Roma",
          partnerTypes: ["hotel"],
        },
        advancedSearch: {
          query: "ristorante romantico",
          partnerTypes: ["restaurant"],
          locations: ["Roma", "Milano"],
          priceRange: [2, 4],
          sortBy: "rating",
        },
      },
    },
    { status: 200 }
  );
}

// Helper functions
function extractCity(location: string): string {
  if (!location) return "";
  const parts = location.split(",");
  return parts.length > 1 ? parts[parts.length - 1].trim() : parts[0].trim();
}

function extractRegion(location: string): string {
  if (!location) return "";
  const parts = location.split(",");
  return parts.length > 2 ? parts[1].trim() : "";
}
