import { tool } from "@openai/agents";
import { z } from "zod";
import { supabase } from "../supabase-server";
import { generateEmbeddings } from "../openai";
import { rapidApiBookingService } from "../rapidapi-booking";
import { extractDatesFromQuery } from "../date-extraction";

// ===== HOTEL TOOLS =====

export const hotelSearchTool = tool({
  name: "search_hotels",
  description:
    "Search hotels with specific filters optimized for hotel properties",
  parameters: z.object({
    query: z.string().describe("Natural language search query for hotels"),
    location: z.string().nullable().describe("City or area to search in"),
    starRating: z
      .number()
      .min(1)
      .max(5)
      .nullable()
      .describe("Minimum star rating (1-5)"),
    priceRange: z
      .number()
      .min(1)
      .max(5)
      .nullable()
      .describe("Price range (1-5, budget to luxury)"),
    amenities: z
      .array(z.string())
      .nullable()
      .describe("Specific amenities required"),
    limit: z.number().default(10).describe("Maximum results to return"),
  }),
  execute: async ({
    query,
    location,
    starRating,
    priceRange,
    amenities,
    limit = 10,
  }: {
    query: string;
    location: string | null;
    starRating: number | null;
    priceRange: number | null;
    amenities: string[] | null;
    limit?: number;
  }) => {
    console.log(`[HOTEL_SEARCH] Called with:`, {
      query,
      location,
      starRating,
      priceRange,
      amenities,
      limit,
    });
    try {
      // Build SQL query for hotels table
      let dbQuery = supabase
        .from("hotels")
        .select(
          `
          id, name, description, location, address, city, country,
          coordinates, price_range, star_rating, amenities, room_types,
          phone, email, website, booking_url, primary_image_url, gallery_urls,
          is_featured, view_count, booking_count
        `
        )
        .eq("is_active", true);

      // Apply filters
      if (location) {
        // Clean location to avoid PostgREST parsing errors
        const cleanLocation = location.replace(/[,;]/g, "").trim();
        dbQuery = dbQuery.or(
          `city.ilike.%${cleanLocation}%,location.ilike.%${cleanLocation}%`
        );
      }

      if (starRating) {
        dbQuery = dbQuery.gte("star_rating", starRating);
      }

      if (priceRange) {
        dbQuery = dbQuery.lte("price_range", priceRange);
      }

      // Order by relevance: featured first, then by rating and booking count
      dbQuery = dbQuery
        .order("is_featured", { ascending: false })
        .order("star_rating", { ascending: false })
        .order("booking_count", { ascending: false })
        .limit(limit);

      const { data, error } = await dbQuery;
      console.log(`[HOTEL_SEARCH] Query result:`, {
        dataCount: data?.length,
        error: error?.message,
      });

      if (error) {
        console.error(`[HOTEL_SEARCH] Database error:`, error);
        throw new Error(`Hotel search failed: ${error.message}`);
      }

      let results = data || [];

      // Filter by amenities if specified
      if (amenities && amenities.length > 0) {
        results = results.filter((hotel: unknown) => {
          const hotelObj = hotel as { amenities?: string[] };
          const hotelAmenities = hotelObj.amenities || [];
          return amenities.some(amenity =>
            hotelAmenities.some((ha: string) =>
              ha.toLowerCase().includes(amenity.toLowerCase())
            )
          );
        });
      }

      console.log(`[HOTEL_SEARCH] Final results:`, {
        count: results.length,
        sampleName: results[0]?.name,
      });
      return {
        success: true,
        data: results,
        message: `Found ${results.length} hotels matching your criteria`,
        searchContext: { query, location, starRating, priceRange, amenities },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Hotel search failed",
        data: [],
      };
    }
  },
});

export const hotelVectorSearchTool = tool({
  name: "hotel_semantic_search",
  description: "Semantic search for hotels using vector embeddings",
  parameters: z.object({
    query: z
      .string()
      .describe("Natural language query for semantic hotel search"),
    limit: z.number().default(8).describe("Maximum results"),
    threshold: z.number().default(0.3).describe("Similarity threshold"),
  }),
  execute: async ({ query, limit = 8, threshold = 0.3 }) => {
    console.log(`[HOTEL_VECTOR_SEARCH] Called with:`, {
      query,
      limit,
      threshold,
    });
    try {
      const queryEmbedding = await generateEmbeddings(`hotel ${query}`);
      console.log(
        `[HOTEL_VECTOR_SEARCH] Generated embedding length:`,
        queryEmbedding.length
      );

      const { data, error } = await supabase.rpc("match_hotels", {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit,
      });

      console.log(`[HOTEL_VECTOR_SEARCH] RPC result:`, {
        dataCount: data?.length,
        error: error?.message,
      });

      if (error) {
        console.error(`[HOTEL_VECTOR_SEARCH] RPC error:`, error);
        throw new Error(`Hotel vector search failed: ${error.message}`);
      }

      console.log(`[HOTEL_VECTOR_SEARCH] Final results:`, {
        count: (data || []).length,
        sampleName: data?.[0]?.name,
      });
      return {
        success: true,
        data: data || [],
        message: `Found ${(data || []).length} hotels through semantic search`,
        searchContext: { query, threshold },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Hotel semantic search failed",
        data: [],
      };
    }
  },
});

// ===== RAPIDAPI HOTEL TOOLS =====

export const rapidApiHotelSearchTool = tool({
  name: "search_hotels_rapidapi",
  description:
    "Search hotels with real-time availability using RapidAPI Booking.com integration",
  parameters: z.object({
    query: z
      .string()
      .describe(
        "Natural language search query for hotels with location and dates"
      ),
    location: z.string().describe("City or destination to search hotels"),
    checkinDate: z
      .string()
      .nullable()
      .describe(
        "Check-in date in YYYY-MM-DD format (optional, will be extracted from query)"
      ),
    checkoutDate: z
      .string()
      .nullable()
      .describe(
        "Check-out date in YYYY-MM-DD format (optional, will be extracted from query)"
      ),
    adults: z.number().default(2).describe("Number of adult guests"),
    rooms: z.number().default(1).describe("Number of rooms needed"),
    children: z.number().default(0).describe("Number of children"),
    currency: z.string().default("EUR").describe("Currency for pricing"),
    limit: z.number().default(10).describe("Maximum results to return"),
  }),
  execute: async ({
    query,
    location,
    checkinDate = null,
    checkoutDate = null,
    adults = 2,
    rooms = 1,
    children = 0,
    currency = "EUR",
    limit = 10,
  }: {
    query: string;
    location: string;
    checkinDate?: string | null;
    checkoutDate?: string | null;
    adults?: number;
    rooms?: number;
    children?: number;
    currency?: string;
    limit?: number;
  }) => {
    console.log(`[RAPIDAPI_HOTEL_SEARCH] Called with:`, {
      query,
      location,
      checkinDate,
      checkoutDate,
      adults,
      rooms,
      children,
      currency,
      limit,
    });

    try {
      // Extract dates from query if not provided
      let finalCheckinDate = checkinDate;
      let finalCheckoutDate = checkoutDate;
      let extractedGuests = adults;
      let extractedRooms = rooms;

      if (!checkinDate || !checkoutDate) {
        console.log(
          `[RAPIDAPI_HOTEL_SEARCH] Extracting dates from query: "${query}"`
        );

        const dateExtraction = await extractDatesFromQuery(query);

        if (dateExtraction.success && dateExtraction.dates) {
          finalCheckinDate = dateExtraction.dates.checkinDate;
          finalCheckoutDate = dateExtraction.dates.checkoutDate;

          // Use extracted guest/room info if available
          if (dateExtraction.dates.guests) {
            extractedGuests = dateExtraction.dates.guests;
          }
          if (dateExtraction.dates.rooms) {
            extractedRooms = dateExtraction.dates.rooms;
          }

          console.log(`[RAPIDAPI_HOTEL_SEARCH] Extracted dates:`, {
            checkin: finalCheckinDate,
            checkout: finalCheckoutDate,
            guests: extractedGuests,
            rooms: extractedRooms,
            confidence: dateExtraction.dates.confidence,
            reasoning: dateExtraction.dates.reasoning,
          });
        } else {
          console.warn(
            `[RAPIDAPI_HOTEL_SEARCH] Date extraction failed, using fallback`
          );
        }
      }

      // Call RapidAPI service
      const searchParams = {
        location,
        checkinDate: finalCheckinDate || undefined,
        checkoutDate: finalCheckoutDate || undefined,
        adults: extractedGuests,
        rooms: extractedRooms,
        children,
        currency,
      };

      const apiResponse =
        await rapidApiBookingService.searchHotels(searchParams);

      console.log(`[RAPIDAPI_HOTEL_SEARCH] API Response:`, {
        success: apiResponse.success,
        hotelCount: apiResponse.data.length,
        error: apiResponse.error,
      });

      // Limit results if needed
      const limitedResults = apiResponse.data.slice(0, limit);

      // Transform to format expected by agent
      const transformedResults = limitedResults.map(hotel => ({
        id: hotel.id,
        name: hotel.name,
        description: hotel.description || `Hotel in ${hotel.location}`,
        location: hotel.location,
        address: hotel.address,
        city: hotel.city,
        country: hotel.country,
        coordinates: hotel.coordinates
          ? {
              lat: hotel.coordinates.latitude,
              lng: hotel.coordinates.longitude,
            }
          : null,
        price_range: hotel.price ? Math.ceil(hotel.price.amount / 50) : 3, // Convert to 1-5 scale
        star_rating: hotel.rating ? Math.round(hotel.rating / 2) : null, // Convert 10-point to 5-star
        amenities: hotel.amenities || [],
        room_types: [], // Not available from RapidAPI
        phone: null, // Not available from basic search
        email: null, // Not available from basic search
        website: null, // Not available from basic search
        booking_url: hotel.booking_url,
        primary_image_url: hotel.images[0] || null,
        gallery_urls: hotel.images.slice(1),
        is_featured: false,
        view_count: 0,
        booking_count: 0,
        // Additional RapidAPI specific data
        rapid_api_data: {
          real_time_price: hotel.price,
          availability: hotel.availability,
          review_count: hotel.review_count,
        },
      }));

      const finalMessage = apiResponse.success
        ? `Found ${transformedResults.length} real-time hotels in ${location}${finalCheckinDate ? ` for ${finalCheckinDate} to ${finalCheckoutDate}` : ""}`
        : `Hotel search failed: ${apiResponse.error}`;

      return {
        success: apiResponse.success,
        data: transformedResults,
        message: finalMessage,
        searchContext: {
          query,
          location,
          checkinDate: finalCheckinDate,
          checkoutDate: finalCheckoutDate,
          adults: extractedGuests,
          rooms: extractedRooms,
          children,
          currency,
          source: "rapidapi_booking",
        },
        metadata: {
          total_available: apiResponse.total_results,
          date_extraction_used: !checkinDate || !checkoutDate,
        },
      };
    } catch (error) {
      console.error(`[RAPIDAPI_HOTEL_SEARCH] Search failed:`, error);

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "RapidAPI hotel search failed",
        data: [],
        message: `Hotel search failed for ${location}. Please try a different location or check your dates.`,
        searchContext: { query, location },
      };
    }
  },
});

// ===== RESTAURANT TOOLS =====

export const restaurantSearchTool = tool({
  name: "search_restaurants",
  description: "Search restaurants with cuisine-specific filters",
  parameters: z.object({
    query: z.string().describe("Natural language search query for restaurants"),
    location: z.string().nullable().describe("City or area to search in"),
    cuisineType: z.string().nullable().describe("Specific cuisine type"),
    priceRange: z
      .number()
      .min(1)
      .max(4)
      .nullable()
      .describe("Price range (1-4)"),
    michelinStars: z
      .number()
      .min(0)
      .max(3)
      .nullable()
      .describe("Minimum Michelin stars"),
    dietaryOptions: z
      .array(z.string())
      .nullable()
      .describe("Dietary requirements"),
    limit: z.number().default(10).describe("Maximum results"),
  }),
  execute: async ({
    query,
    location,
    cuisineType,
    priceRange,
    michelinStars,
    dietaryOptions,
    limit = 10,
  }: {
    query: string;
    location: string | null;
    cuisineType: string | null;
    priceRange: number | null;
    michelinStars: number | null;
    dietaryOptions: string[] | null;
    limit?: number;
  }) => {
    console.log(`[RESTAURANT_SEARCH] Called with:`, {
      query,
      location,
      cuisineType,
      priceRange,
      michelinStars,
      limit,
    });
    try {
      let dbQuery = supabase
        .from("restaurants")
        .select(
          `
          id, name, description, cuisine_type, location, address, city, country,
          coordinates, price_range, michelin_stars, menu_highlights, dietary_options,
          opening_hours, accepts_reservations, phone, email, website, reservation_url,
          primary_image_url, gallery_urls, is_featured, reservation_count
        `
        )
        .eq("is_active", true);

      if (location) {
        // Clean location to avoid PostgREST parsing errors
        const cleanLocation = location.replace(/[,;]/g, "").trim();
        dbQuery = dbQuery.or(
          `city.ilike.%${cleanLocation}%,location.ilike.%${cleanLocation}%`
        );
      }

      if (cuisineType) {
        dbQuery = dbQuery.ilike("cuisine_type", `%${cuisineType}%`);
      }

      if (priceRange) {
        dbQuery = dbQuery.lte("price_range", priceRange);
      }

      if (michelinStars !== null && michelinStars !== undefined) {
        dbQuery = dbQuery.gte("michelin_stars", michelinStars);
      }

      dbQuery = dbQuery
        .order("is_featured", { ascending: false })
        .order("michelin_stars", { ascending: false })
        .order("reservation_count", { ascending: false })
        .limit(limit);

      const { data, error } = await dbQuery;
      console.log(`[RESTAURANT_SEARCH] Query result:`, {
        dataCount: data?.length,
        error: error?.message,
      });

      if (error) {
        console.error(`[RESTAURANT_SEARCH] Database error:`, error);
        throw new Error(`Restaurant search failed: ${error.message}`);
      }

      let results = data || [];

      // Filter by dietary options if specified
      if (dietaryOptions && dietaryOptions.length > 0) {
        results = results.filter((restaurant: unknown) => {
          const restaurantObj = restaurant as { dietary_options?: string[] };
          const restaurantOptions = restaurantObj.dietary_options || [];
          return dietaryOptions.some(option =>
            restaurantOptions.some((ro: string) =>
              ro.toLowerCase().includes(option.toLowerCase())
            )
          );
        });
      }

      console.log(`[RESTAURANT_SEARCH] Final results:`, {
        count: results.length,
        sampleName: results[0]?.name,
      });
      return {
        success: true,
        data: results,
        message: `Found ${results.length} restaurants matching your criteria`,
        searchContext: {
          query,
          location,
          cuisineType,
          priceRange,
          michelinStars,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Restaurant search failed",
        data: [],
      };
    }
  },
});

export const restaurantVectorSearchTool = tool({
  name: "restaurant_semantic_search",
  description: "Semantic search for restaurants using vector embeddings",
  parameters: z.object({
    query: z
      .string()
      .describe("Natural language query for semantic restaurant search"),
    limit: z.number().default(8).describe("Maximum results"),
    threshold: z.number().default(0.3).describe("Similarity threshold"),
  }),
  execute: async ({ query, limit = 8, threshold = 0.3 }) => {
    try {
      const queryEmbedding = await generateEmbeddings(`restaurant ${query}`);

      const { data, error } = await supabase.rpc("match_restaurants", {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit,
      });

      if (error) {
        throw new Error(`Restaurant vector search failed: ${error.message}`);
      }

      return {
        success: true,
        data: data || [],
        message: `Found ${(data || []).length} restaurants through semantic search`,
        searchContext: { query, threshold },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Restaurant semantic search failed",
        data: [],
      };
    }
  },
});

// ===== TOUR TOOLS =====

export const tourSearchTool = tool({
  name: "search_tours",
  description: "Search tours with activity-specific filters",
  parameters: z.object({
    query: z.string().describe("Natural language search query for tours"),
    location: z.string().nullable().describe("City or area for tours"),
    tourType: z.string().nullable().describe("Specific tour type or activity"),
    difficultyLevel: z
      .number()
      .min(1)
      .max(5)
      .nullable()
      .describe("Maximum difficulty (1-5)"),
    duration: z
      .string()
      .nullable()
      .describe("Duration preference (hours or days)"),
    maxParticipants: z.number().nullable().describe("Maximum group size"),
    limit: z.number().default(10).describe("Maximum results"),
  }),
  execute: async ({
    query,
    location,
    tourType,
    difficultyLevel,
    duration,
    maxParticipants,
    limit = 10,
  }: {
    query: string;
    location: string | null;
    tourType: string | null;
    difficultyLevel: number | null;
    duration: string | null;
    maxParticipants: number | null;
    limit?: number;
  }) => {
    console.log(`[TOUR_SEARCH] Called with:`, {
      query,
      location,
      tourType,
      difficultyLevel,
      limit,
    });
    try {
      let dbQuery = supabase
        .from("tours")
        .select(
          `
          id, name, description, tour_type, location, starting_point, city, country,
          duration_hours, duration_days, max_participants, min_participants,
          difficulty_level, age_requirement, fitness_level, price_adult, price_child,
          schedule_type, available_days, includes, excludes, requirements,
          phone, email, website, booking_url, primary_image_url, gallery_urls, 
          is_featured, booking_count
        `
        )
        .eq("is_active", true);

      if (location) {
        // Clean location to avoid PostgREST parsing errors
        const cleanLocation = location.replace(/[,;]/g, "").trim();
        dbQuery = dbQuery.or(
          `city.ilike.%${cleanLocation}%,location.ilike.%${cleanLocation}%`
        );
      }

      if (tourType) {
        dbQuery = dbQuery.ilike("tour_type", `%${tourType}%`);
      }

      if (difficultyLevel) {
        dbQuery = dbQuery.lte("difficulty_level", difficultyLevel);
      }

      if (maxParticipants) {
        dbQuery = dbQuery.gte("max_participants", maxParticipants);
      }

      dbQuery = dbQuery
        .order("is_featured", { ascending: false })
        .order("booking_count", { ascending: false })
        .limit(limit);

      const { data, error } = await dbQuery;
      console.log(`[TOUR_SEARCH] Query result:`, {
        dataCount: data?.length,
        error: error?.message,
      });

      if (error) {
        console.error(`[TOUR_SEARCH] Database error:`, error);
        throw new Error(`Tour search failed: ${error.message}`);
      }

      console.log(`[TOUR_SEARCH] Final results:`, {
        count: (data || []).length,
        sampleName: data?.[0]?.name,
      });
      return {
        success: true,
        data: data || [],
        message: `Found ${(data || []).length} tours matching your criteria`,
        searchContext: { query, location, tourType, difficultyLevel, duration },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Tour search failed",
        data: [],
      };
    }
  },
});

export const tourVectorSearchTool = tool({
  name: "tour_semantic_search",
  description: "Semantic search for tours using vector embeddings",
  parameters: z.object({
    query: z
      .string()
      .describe("Natural language query for semantic tour search"),
    limit: z.number().default(8).describe("Maximum results"),
    threshold: z.number().default(0.3).describe("Similarity threshold"),
  }),
  execute: async ({ query, limit = 8, threshold = 0.3 }) => {
    try {
      const queryEmbedding = await generateEmbeddings(`tour ${query}`);

      const { data, error } = await supabase.rpc("match_tours", {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit,
      });

      if (error) {
        throw new Error(`Tour vector search failed: ${error.message}`);
      }

      return {
        success: true,
        data: data || [],
        message: `Found ${(data || []).length} tours through semantic search`,
        searchContext: { query, threshold },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Tour semantic search failed",
        data: [],
      };
    }
  },
});

// ===== SHUTTLE TOOLS =====

export const shuttleSearchTool = tool({
  name: "search_shuttles",
  description: "Search shuttle services with route-specific filters",
  parameters: z.object({
    query: z.string().describe("Natural language search query for shuttles"),
    departureLocation: z.string().nullable().describe("Departure point"),
    arrivalLocation: z.string().nullable().describe("Destination"),
    capacity: z.number().nullable().describe("Minimum capacity needed"),
    serviceType: z.string().nullable().describe("Type of shuttle service"),
    limit: z.number().default(10).describe("Maximum results"),
  }),
  execute: async ({
    query,
    departureLocation,
    arrivalLocation,
    capacity,
    serviceType,
    limit = 10,
  }: {
    query: string;
    departureLocation: string | null;
    arrivalLocation: string | null;
    capacity: number | null;
    serviceType: string | null;
    limit?: number;
  }) => {
    console.log(`[SHUTTLE_SEARCH] Called with:`, {
      query,
      departureLocation,
      arrivalLocation,
      capacity,
      serviceType,
      limit,
    });
    try {
      let dbQuery = supabase
        .from("shuttles")
        .select(
          `
          id, name, description, service_type, departure_location, arrival_location,
          route_description, stops, vehicle_type, capacity, luggage_capacity,
          schedule, frequency, advance_booking_required, price_per_person,
          price_per_vehicle, price_one_way, price_round_trip, features,
          accessibility_features, phone, email, website, booking_url, 
          primary_image_url, gallery_urls, is_featured, booking_count
        `
        )
        .eq("is_active", true);

      if (departureLocation) {
        dbQuery = dbQuery.ilike("departure_location", `%${departureLocation}%`);
      }

      if (arrivalLocation) {
        dbQuery = dbQuery.ilike("arrival_location", `%${arrivalLocation}%`);
      }

      if (capacity) {
        dbQuery = dbQuery.gte("capacity", capacity);
      }

      if (serviceType) {
        dbQuery = dbQuery.ilike("service_type", `%${serviceType}%`);
      }

      dbQuery = dbQuery
        .order("is_featured", { ascending: false })
        .order("booking_count", { ascending: false })
        .limit(limit);

      const { data, error } = await dbQuery;
      console.log(`[SHUTTLE_SEARCH] Query result:`, {
        dataCount: data?.length,
        error: error?.message,
      });

      if (error) {
        console.error(`[SHUTTLE_SEARCH] Database error:`, error);
        throw new Error(`Shuttle search failed: ${error.message}`);
      }

      console.log(`[SHUTTLE_SEARCH] Final results:`, {
        count: (data || []).length,
        sampleName: data?.[0]?.name,
      });
      return {
        success: true,
        data: data || [],
        message: `Found ${(data || []).length} shuttle services matching your criteria`,
        searchContext: {
          query,
          departureLocation,
          arrivalLocation,
          capacity,
          serviceType,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Shuttle search failed",
        data: [],
      };
    }
  },
});

export const shuttleVectorSearchTool = tool({
  name: "shuttle_semantic_search",
  description: "Semantic search for shuttles using vector embeddings",
  parameters: z.object({
    query: z
      .string()
      .describe("Natural language query for semantic shuttle search"),
    limit: z.number().default(8).describe("Maximum results"),
    threshold: z.number().default(0.3).describe("Similarity threshold"),
  }),
  execute: async ({ query, limit = 8, threshold = 0.3 }) => {
    try {
      const queryEmbedding = await generateEmbeddings(`shuttle ${query}`);

      const { data, error } = await supabase.rpc("match_shuttles", {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit,
      });

      if (error) {
        throw new Error(`Shuttle vector search failed: ${error.message}`);
      }

      return {
        success: true,
        data: data || [],
        message: `Found ${(data || []).length} shuttle services through semantic search`,
        searchContext: { query, threshold },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Shuttle semantic search failed",
        data: [],
      };
    }
  },
});
