/**
 * useTraditionalSearch Hook
 * Traditional text-based search using direct Supabase SDK queries
 */

import { useState, useCallback } from "react";
import { supabaseClient } from "@/lib/supabase-client";
import type { Partner } from "@/types";

export interface TraditionalSearchFilters {
  query: string;
  partnerTypes: string[]; // 'hotel', 'restaurant', 'tour', 'shuttle'
  priceRange: [number, number];
  locations: string[];
  cuisineTypes?: string[]; // for restaurants
  tourTypes?: string[]; // for tours
  serviceTypes?: string[]; // for shuttles
  sortBy?: string;
}

interface UseTraditionalSearchReturn {
  // Results
  results: Partner[];
  loading: boolean;
  total: number;

  // Available filter options (loaded from DB)
  availableLocations: string[];
  availableCuisineTypes: string[];
  availableTourTypes: string[];
  availableServiceTypes: string[];
  loadingOptions: boolean;

  // Actions
  searchPartners: (filters: TraditionalSearchFilters) => Promise<void>;
  loadFilterOptions: () => Promise<void>;
  clearResults: () => void;

  // Error handling
  error: string | null;
}

export function useTraditionalSearch(): UseTraditionalSearchReturn {
  const [results, setResults] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Filter options state
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [availableCuisineTypes, setAvailableCuisineTypes] = useState<string[]>(
    []
  );
  const [availableTourTypes, setAvailableTourTypes] = useState<string[]>([]);
  const [availableServiceTypes, setAvailableServiceTypes] = useState<string[]>(
    []
  );
  const [loadingOptions, setLoadingOptions] = useState(false);

  const searchPartners = useCallback(
    async (filters: TraditionalSearchFilters) => {
      if (
        !filters.query.trim() &&
        filters.partnerTypes.length === 0 &&
        filters.locations.length === 0
      ) {
        setResults([]);
        setTotal(0);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const allResults: Partner[] = [];
        const searchQuery = filters.query?.trim().toLowerCase() || "";
        const hasTextSearch = searchQuery.length > 0;

        // Search Hotels
        if (
          filters.partnerTypes.length === 0 ||
          filters.partnerTypes.includes("hotel")
        ) {
          let hotelQuery = supabaseClient
            .from("hotels")
            .select(
              `
            id, name, description, location, address, country,
            price_range, star_rating, phone, email, website, booking_url,
            primary_image_url, gallery_urls, amenities,
            created_at, updated_at, coordinates
          `
            )
            .eq("is_active", true);

          // Apply text search
          if (hasTextSearch) {
            const escapedQuery = searchQuery.replace(/[%\\]/g, "\\$&");
            hotelQuery = hotelQuery.or(
              `name.ilike.%${escapedQuery}%,description.ilike.%${escapedQuery}%,location.ilike.%${escapedQuery}%`
            );
          }

          // Apply location filter
          if (filters.locations.length > 0) {
            const locationFilters = filters.locations
              .map(loc => `location.ilike.%${loc}%`)
              .join(",");
            hotelQuery = hotelQuery.or(locationFilters);
          }

          // Apply price range filter
          if (filters.priceRange[0] > 1 || filters.priceRange[1] < 5) {
            hotelQuery = hotelQuery
              .gte("price_range", filters.priceRange[0])
              .lte("price_range", filters.priceRange[1]);
          }

          const { data: hotels, error: hotelError } =
            await hotelQuery.limit(25);

          if (hotelError) {
            console.error("Hotel search error:", hotelError);
          } else if (hotels) {
            allResults.push(
              ...hotels.map(hotel => ({
                id: hotel.id,
                name: hotel.name,
                type: "hotel" as const,
                description: hotel.description || "",
                rating: hotel.star_rating || 4.0,
                reviewCount: Math.floor(Math.random() * 200) + 10,
                priceRange: mapPriceRange(hotel.price_range, "hotel"),
                location: {
                  address: hotel.address || hotel.location,
                  city: extractCity(hotel.location),
                  region: extractRegion(hotel.location),
                  country: hotel.country || "Italy",
                  coordinates: hotel.coordinates || {
                    lat: 41.9028,
                    lng: 12.4964,
                  },
                  timezone: "Europe/Rome",
                },
                images:
                  hotel.gallery_urls?.length > 0
                    ? hotel.gallery_urls
                    : hotel.primary_image_url
                      ? [hotel.primary_image_url]
                      : ["/images/hotel-placeholder.jpg"],
                features: hotel.amenities?.slice(0, 6) || ["Hotel", "Verified"],
                contact: {
                  phone: hotel.phone,
                  email: hotel.email,
                  website: hotel.website || hotel.booking_url,
                },
                isVerified: true,
                createdAt: hotel.created_at || new Date().toISOString(),
                updatedAt: hotel.updated_at || new Date().toISOString(),
              }))
            );
          }
        }

        // Search Restaurants
        if (
          filters.partnerTypes.length === 0 ||
          filters.partnerTypes.includes("restaurant")
        ) {
          let restaurantQuery = supabaseClient
            .from("restaurants")
            .select(
              `
            id, name, description, location, address, country,
            price_range, cuisine_type, phone, email, website,
            primary_image_url, gallery_urls, menu_highlights,
            created_at, updated_at, coordinates
          `
            )
            .eq("is_active", true);

          // Apply text search
          if (hasTextSearch) {
            const escapedQuery = searchQuery.replace(/[%\\]/g, "\\$&");
            restaurantQuery = restaurantQuery.or(
              `name.ilike.%${escapedQuery}%,description.ilike.%${escapedQuery}%,location.ilike.%${escapedQuery}%,cuisine_type.ilike.%${escapedQuery}%`
            );
          }

          // Apply location filter
          if (filters.locations.length > 0) {
            const locationFilters = filters.locations
              .map(loc => `location.ilike.%${loc}%`)
              .join(",");
            restaurantQuery = restaurantQuery.or(locationFilters);
          }

          // Apply cuisine filter
          if (filters.cuisineTypes && filters.cuisineTypes.length > 0) {
            // Normalize cuisine types to lowercase for database query
            const normalizedCuisineTypes = filters.cuisineTypes.map(type =>
              type.toLowerCase()
            );
            restaurantQuery = restaurantQuery.in(
              "cuisine_type",
              normalizedCuisineTypes
            );
          }

          // Apply price range filter (restaurants have range 1-4)
          if (filters.priceRange[0] > 1 || filters.priceRange[1] < 4) {
            restaurantQuery = restaurantQuery
              .gte("price_range", filters.priceRange[0])
              .lte("price_range", Math.min(filters.priceRange[1], 4));
          }

          const { data: restaurants, error: restaurantError } =
            await restaurantQuery.limit(25);

          if (restaurantError) {
            console.error("Restaurant search error:", restaurantError);
          } else if (restaurants) {
            allResults.push(
              ...restaurants.map(restaurant => ({
                id: restaurant.id,
                name: restaurant.name,
                type: "restaurant" as const,
                description: restaurant.description || "",
                rating: 4.2 + Math.random() * 0.6,
                reviewCount: Math.floor(Math.random() * 150) + 15,
                priceRange: mapPriceRange(restaurant.price_range, "restaurant"),
                location: {
                  address: restaurant.address || restaurant.location,
                  city: extractCity(restaurant.location),
                  region: extractRegion(restaurant.location),
                  country: restaurant.country || "Italy",
                  coordinates: restaurant.coordinates || {
                    lat: 41.9028,
                    lng: 12.4964,
                  },
                  timezone: "Europe/Rome",
                },
                images:
                  restaurant.gallery_urls?.length > 0
                    ? restaurant.gallery_urls
                    : restaurant.primary_image_url
                      ? [restaurant.primary_image_url]
                      : ["/images/restaurant-placeholder.jpg"],
                features: [
                  ...(restaurant.menu_highlights?.slice(0, 4) || []),
                  ...(restaurant.cuisine_type ? [restaurant.cuisine_type] : []),
                ].slice(0, 6) || ["Restaurant", "Verified"],
                contact: {
                  phone: restaurant.phone,
                  email: restaurant.email,
                  website: restaurant.website,
                },
                isVerified: true,
                createdAt: restaurant.created_at || new Date().toISOString(),
                updatedAt: restaurant.updated_at || new Date().toISOString(),
              }))
            );
          }
        }

        // Search Tours - only if tour is explicitly selected or no partner types specified
        // and there are relevant filters (search query, locations, or tour types)
        const shouldSearchTours =
          (filters.partnerTypes.length === 0 ||
            filters.partnerTypes.includes("tour")) &&
          (hasTextSearch ||
            filters.locations.length > 0 ||
            (filters.tourTypes && filters.tourTypes.length > 0));

        if (shouldSearchTours) {
          let tourQuery = supabaseClient
            .from("tours")
            .select(
              `
            id, name, description, location, starting_point,
            country, tour_type, duration_hours, duration_days,
            price_adult, phone, email, website, booking_url,
            primary_image_url, gallery_urls, includes,
            created_at, updated_at
          `
            )
            .eq("is_active", true);

          // Apply text search
          if (hasTextSearch) {
            const escapedQuery = searchQuery.replace(/[%\\]/g, "\\$&");
            tourQuery = tourQuery.or(
              `name.ilike.%${escapedQuery}%,description.ilike.%${escapedQuery}%,location.ilike.%${escapedQuery}%,tour_type.ilike.%${escapedQuery}%`
            );
          }

          // Apply location filter
          if (filters.locations.length > 0) {
            const locationFilters = filters.locations
              .map(loc => `location.ilike.%${loc}%`)
              .join(",");
            tourQuery = tourQuery.or(locationFilters);
          }

          // Apply tour type filter
          if (filters.tourTypes && filters.tourTypes.length > 0) {
            // Normalize tour types to lowercase for database query
            const normalizedTourTypes = filters.tourTypes.map(type =>
              type.toLowerCase()
            );
            tourQuery = tourQuery.in("tour_type", normalizedTourTypes);
          }

          const { data: tours, error: tourError } = await tourQuery.limit(25);

          if (tourError) {
            console.error("Tour search error:", tourError);
            console.error("Tour query filters:", filters.tourTypes);
            console.error("Tour query details:", tourQuery);
          } else if (tours) {
            allResults.push(
              ...tours.map(tour => ({
                id: tour.id,
                name: tour.name,
                type: "tour" as const,
                description: tour.description || "",
                rating: 4.3 + Math.random() * 0.5,
                reviewCount: Math.floor(Math.random() * 100) + 20,
                priceRange: tour.price_adult
                  ? mapPriceFromPrice(tour.price_adult)
                  : ("mid-range" as const),
                location: {
                  address: tour.starting_point || tour.location,
                  city: extractCity(tour.location),
                  region: extractRegion(tour.location),
                  country: tour.country || "Italy",
                  coordinates: {
                    lat: 41.9028,
                    lng: 12.4964,
                  },
                  timezone: "Europe/Rome",
                },
                images:
                  tour.gallery_urls?.length > 0
                    ? tour.gallery_urls
                    : tour.primary_image_url
                      ? [tour.primary_image_url]
                      : ["/images/tour-placeholder.jpg"],
                features: [
                  ...(tour.includes?.slice(0, 4) || []),
                  ...(tour.tour_type ? [tour.tour_type] : []),
                  ...(tour.duration_days
                    ? [`${tour.duration_days} giorni`]
                    : tour.duration_hours
                      ? [`${tour.duration_hours} ore`]
                      : []),
                ].slice(0, 6) || ["Tour", "Verified"],
                contact: {
                  phone: tour.phone,
                  email: tour.email,
                  website: tour.website || tour.booking_url,
                },
                isVerified: true,
                createdAt: tour.created_at || new Date().toISOString(),
                updatedAt: tour.updated_at || new Date().toISOString(),
              }))
            );
          }
        }

        // Search Shuttles
        if (
          filters.partnerTypes.length === 0 ||
          filters.partnerTypes.includes("shuttle")
        ) {
          let shuttleQuery = supabaseClient
            .from("shuttles")
            .select(
              `
            id, name, description, departure_location, arrival_location,
            service_type, vehicle_type, capacity,
            price_per_person, price_per_vehicle, phone, email, website, booking_url,
            primary_image_url, gallery_urls, features,
            created_at, updated_at
          `
            )
            .eq("is_active", true);

          // Apply text search
          if (hasTextSearch) {
            const escapedQuery = searchQuery.replace(/[%\\]/g, "\\$&");
            shuttleQuery = shuttleQuery.or(
              `name.ilike.%${escapedQuery}%,description.ilike.%${escapedQuery}%,departure_location.ilike.%${escapedQuery}%,arrival_location.ilike.%${escapedQuery}%,service_type.ilike.%${escapedQuery}%`
            );
          }

          // Apply location filter (check both departure and arrival)
          if (filters.locations.length > 0) {
            const locationFilters = filters.locations
              .map(
                loc =>
                  `departure_location.ilike.%${loc}%,arrival_location.ilike.%${loc}%`
              )
              .join(",");
            shuttleQuery = shuttleQuery.or(locationFilters);
          }

          // Apply service type filter
          if (filters.serviceTypes && filters.serviceTypes.length > 0) {
            // Normalize service types to lowercase for database query
            const normalizedServiceTypes = filters.serviceTypes.map(type =>
              type.toLowerCase()
            );
            shuttleQuery = shuttleQuery.in(
              "service_type",
              normalizedServiceTypes
            );
          }

          const { data: shuttles, error: shuttleError } =
            await shuttleQuery.limit(25);

          if (shuttleError) {
            console.error("Shuttle search error:", shuttleError);
          } else if (shuttles) {
            allResults.push(
              ...shuttles.map(shuttle => ({
                id: shuttle.id,
                name: shuttle.name,
                type: "transport" as const,
                description: shuttle.description || "",
                rating: 4.1 + Math.random() * 0.6,
                reviewCount: Math.floor(Math.random() * 80) + 10,
                priceRange: shuttle.price_per_person
                  ? mapPriceFromPrice(shuttle.price_per_person)
                  : ("budget" as const),
                location: {
                  address: `${shuttle.departure_location} → ${shuttle.arrival_location}`,
                  city: extractCity(shuttle.departure_location),
                  region: extractRegion(shuttle.departure_location),
                  country: "Italy",
                  coordinates: { lat: 41.9028, lng: 12.4964 },
                  timezone: "Europe/Rome",
                },
                images:
                  shuttle.gallery_urls?.length > 0
                    ? shuttle.gallery_urls
                    : shuttle.primary_image_url
                      ? [shuttle.primary_image_url]
                      : ["/images/transport-placeholder.jpg"],
                features: [
                  ...(shuttle.features?.slice(0, 4) || []),
                  ...(shuttle.service_type ? [shuttle.service_type] : []),
                  ...(shuttle.vehicle_type ? [shuttle.vehicle_type] : []),
                  ...(shuttle.capacity ? [`${shuttle.capacity} posti`] : []),
                ].slice(0, 6) || ["Transport", "Verified"],
                contact: {
                  phone: shuttle.phone,
                  email: shuttle.email,
                  website: shuttle.website || shuttle.booking_url,
                },
                isVerified: true,
                createdAt: shuttle.created_at || new Date().toISOString(),
                updatedAt: shuttle.updated_at || new Date().toISOString(),
              }))
            );
          }
        }

        // Apply sorting
        let sortedResults = [...allResults];

        switch (filters.sortBy) {
          case "name-asc":
            sortedResults = sortedResults.sort((a, b) =>
              a.name.localeCompare(b.name)
            );
            break;
          case "name-desc":
            sortedResults = sortedResults.sort((a, b) =>
              b.name.localeCompare(a.name)
            );
            break;
          case "price-low":
            sortedResults = sortedResults.sort(
              (a, b) =>
                getPriceScore(a.priceRange) - getPriceScore(b.priceRange)
            );
            break;
          case "price-high":
            sortedResults = sortedResults.sort(
              (a, b) =>
                getPriceScore(b.priceRange) - getPriceScore(a.priceRange)
            );
            break;
          case "rating":
            sortedResults = sortedResults.sort(
              (a, b) => (b.rating || 0) - (a.rating || 0)
            );
            break;
          case "recent":
            sortedResults = sortedResults.sort(
              (a, b) =>
                new Date(b.createdAt || "").getTime() -
                new Date(a.createdAt || "").getTime()
            );
            break;
          default:
            // Default: keep original order (relevance)
            break;
        }

        setResults(sortedResults);
        setTotal(sortedResults.length);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to search partners"
        );
        setResults([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const loadFilterOptions = useCallback(async () => {
    setLoadingOptions(true);

    try {
      // Load locations from all tables
      const locationPromises = [
        supabaseClient
          .from("hotels")
          .select("location")
          .eq("is_active", true)
          .not("location", "is", null),
        supabaseClient
          .from("restaurants")
          .select("location")
          .eq("is_active", true)
          .not("location", "is", null),
        supabaseClient
          .from("tours")
          .select("location")
          .eq("is_active", true)
          .not("location", "is", null),
        supabaseClient
          .from("shuttles")
          .select("departure_location")
          .eq("is_active", true)
          .not("departure_location", "is", null),
      ];

      const [hotelLocs, restaurantLocs, tourLocs, shuttleLocs] =
        await Promise.allSettled(locationPromises);

      const locationSet = new Set<string>();

      [hotelLocs, restaurantLocs, tourLocs].forEach(result => {
        if (result.status === "fulfilled" && result.value.data) {
          result.value.data.forEach((item: { location?: string }) => {
            if (item.location) {
              const city = extractCity(item.location);
              if (city && city.length > 1) {
                locationSet.add(city);
              }
            }
          });
        }
      });

      // Handle shuttle locations separately since they use departure_location
      if (shuttleLocs.status === "fulfilled" && shuttleLocs.value.data) {
        shuttleLocs.value.data.forEach(
          (item: { departure_location?: string }) => {
            if (item.departure_location) {
              const city = extractCity(item.departure_location);
              if (city && city.length > 1) {
                locationSet.add(city);
              }
            }
          }
        );
      }

      setAvailableLocations(Array.from(locationSet).sort().slice(0, 20));

      // Load cuisine types
      const { data: cuisines } = await supabaseClient
        .from("restaurants")
        .select("cuisine_type")
        .eq("is_active", true)
        .not("cuisine_type", "is", null);

      if (cuisines) {
        const cuisineSet = new Set(
          cuisines.map(c => c.cuisine_type).filter(Boolean)
        );
        setAvailableCuisineTypes(Array.from(cuisineSet).sort().slice(0, 30));
      }

      // Load tour types
      const { data: tours } = await supabaseClient
        .from("tours")
        .select("tour_type")
        .eq("is_active", true)
        .not("tour_type", "is", null);

      if (tours) {
        const tourTypeSet = new Set(
          tours.map(t => t.tour_type).filter(Boolean)
        );
        setAvailableTourTypes(Array.from(tourTypeSet).sort().slice(0, 20));
      }

      // Load service types
      const { data: shuttles } = await supabaseClient
        .from("shuttles")
        .select("service_type")
        .eq("is_active", true)
        .not("service_type", "is", null);

      if (shuttles) {
        const serviceTypeSet = new Set(
          shuttles.map(s => s.service_type).filter(Boolean)
        );
        setAvailableServiceTypes(
          Array.from(serviceTypeSet).sort().slice(0, 15)
        );
      }
    } catch (err) {
      console.error("Failed to load filter options:", err);
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setTotal(0);
    setError(null);
  }, []);

  return {
    results,
    loading,
    total,
    availableLocations,
    availableCuisineTypes,
    availableTourTypes,
    availableServiceTypes,
    loadingOptions,
    searchPartners,
    loadFilterOptions,
    clearResults,
    error,
  };
}

// Helper functions
function mapPriceRange(
  priceRange: number | string,
  type: string
): "budget" | "mid-range" | "luxury" | "premium" {
  const price =
    typeof priceRange === "string" ? parseInt(priceRange) : priceRange;

  if (type === "hotel") {
    // Hotels: 2-5 stars
    if (price <= 2) return "budget";
    if (price <= 3) return "mid-range";
    if (price <= 4) return "luxury";
    return "premium";
  } else if (type === "restaurant") {
    // Restaurants: 1-4 range
    if (price <= 1) return "budget";
    if (price <= 2) return "mid-range";
    if (price <= 3) return "luxury";
    return "premium";
  }

  // Default for tours/shuttles
  return "mid-range";
}

function mapPriceFromPrice(
  price: number
): "budget" | "mid-range" | "luxury" | "premium" {
  if (price <= 30) return "budget";
  if (price <= 80) return "mid-range";
  if (price <= 150) return "luxury";
  return "premium";
}

function getPriceScore(priceRange: string): number {
  const scores = { budget: 1, "mid-range": 2, luxury: 3, premium: 4 };
  return scores[priceRange as keyof typeof scores] || 2;
}

function extractCity(location: string): string {
  if (!location) return "";

  // Extract city from "Centro Storico, Roma" -> "Roma"
  const parts = location.split(",");
  return parts.length > 1 ? parts[parts.length - 1].trim() : parts[0].trim();
}

function extractRegion(location: string): string {
  if (!location) return "";

  // Extract region if present
  const parts = location.split(",");
  return parts.length > 2 ? parts[1].trim() : "";
}
