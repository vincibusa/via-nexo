/**
 * RapidAPI Booking.com Service
 * Handles hotel search and availability through RapidAPI
 */

export interface RapidApiHotelSearchParams {
  location: string;
  checkinDate?: string; // YYYY-MM-DD format
  checkoutDate?: string; // YYYY-MM-DD format
  adults?: number;
  rooms?: number;
  children?: number;
  currency?: string;
}

export interface RapidApiHotel {
  id: string;
  name: string;
  description?: string;
  location: string;
  address?: string;
  city?: string;
  country?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  images: string[];
  price?: {
    amount: number;
    currency: string;
    per_night?: boolean;
  };
  rating?: number;
  review_count?: number;
  amenities?: string[];
  booking_url?: string;
  availability?: boolean;
}

export interface RapidApiHotelResponse {
  success: boolean;
  data: RapidApiHotel[];
  message: string;
  total_results?: number;
  search_context?: RapidApiHotelSearchParams;
  error?: string;
}

class RapidApiBookingService {
  private readonly baseUrl = "https://booking-com15.p.rapidapi.com/api/v1";
  private readonly apiKey: string;
  private readonly host: string;
  private lastRequestTime = 0;
  private readonly minRequestInterval = 250; // 250ms = 4 requests per second (under the 5/sec limit)

  constructor() {
    this.apiKey = process.env.RAPIDAPI_KEY || "";
    this.host = process.env.RAPIDAPI_HOST || "booking-com15.p.rapidapi.com";

    if (!this.apiKey) {
      console.warn(
        "[RAPIDAPI_BOOKING] API key not found in environment variables"
      );
    }
  }

  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      console.log(`[RAPIDAPI_BOOKING] Rate limiting: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  private getHeaders(): HeadersInit {
    return {
      "X-RapidAPI-Key": this.apiKey,
      "X-RapidAPI-Host": this.host,
      "Content-Type": "application/json",
    };
  }

  private async makeRequest<T>(
    endpoint: string,
    params: Record<string, unknown> = {},
    retries = 2
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    console.log(`[RAPIDAPI_BOOKING] Making request to: ${url.toString()}`);

    // Wait for rate limit before making request
    await this.waitForRateLimit();

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: this.getHeaders(),
        // 30 second timeout
        signal: AbortSignal.timeout(30000),
      });

      if (response.status === 429 && retries > 0) {
        console.log(
          `[RAPIDAPI_BOOKING] Rate limited, retrying in 1s... (${retries} retries left)`
        );
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        return this.makeRequest<T>(endpoint, params, retries - 1);
      }

      if (!response.ok) {
        throw new Error(
          `RapidAPI request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log(`[RAPIDAPI_BOOKING] Response received:`, {
        status: response.status,
        dataLength: Array.isArray(data) ? data.length : "not-array",
      });

      return data;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("429") &&
        retries > 0
      ) {
        console.log(
          `[RAPIDAPI_BOOKING] Retrying after rate limit... (${retries} retries left)`
        );
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.makeRequest<T>(endpoint, params, retries - 1);
      }

      console.error("[RAPIDAPI_BOOKING] Request failed:", error);
      throw error;
    }
  }

  async searchHotels(
    params: RapidApiHotelSearchParams
  ): Promise<RapidApiHotelResponse> {
    console.log(`[RAPIDAPI_BOOKING] Searching hotels:`, params);

    if (!this.apiKey) {
      return {
        success: false,
        data: [],
        message: "RapidAPI key not configured",
        error: "Missing RapidAPI configuration",
      };
    }

    try {
      // Try to search directly with location name first (saves one API call)
      let rawResponse;

      // Always use destination lookup since we need numeric dest_id
      console.log(
        `[RAPIDAPI_BOOKING] Looking up destination ID for: ${params.location}`
      );

      const searchResults = await this.searchDestinations(params.location);
      if (searchResults.length > 0) {
        const destId = searchResults[0].dest_id;
        console.log(
          `[RAPIDAPI_BOOKING] Found destination ID: ${destId} for ${params.location}`
        );

        const apiParams = {
          dest_id: destId,
          search_type: "CITY",
          arrival_date: params.checkinDate,
          departure_date: params.checkoutDate,
          adults: params.adults || 2,
          children_age:
            params.children && params.children > 0 ? "0,17" : undefined,
          room_qty: params.rooms || 1,
          currency_code: params.currency || "EUR",
          units: "metric",
          temperature_unit: "c",
          languagecode: "en-us",
          page_number: 1,
          location: "IT",
        };

        // Remove undefined values
        Object.keys(apiParams).forEach(key => {
          if (apiParams[key as keyof typeof apiParams] === undefined) {
            delete apiParams[key as keyof typeof apiParams];
          }
        });

        rawResponse = await this.makeRequest("/hotels/searchHotels", apiParams);

        // Transform the response to our format with destination ID
        const hotels = this.transformHotelsResponse(
          rawResponse,
          params,
          destId
        );

        return {
          success: true,
          data: hotels,
          message: `Found ${hotels.length} hotels in ${params.location}`,
          total_results: hotels.length,
          search_context: params,
        };
      } else {
        throw new Error(
          "Could not find destination ID for: " + params.location
        );
      }
    } catch (error) {
      console.error("[RAPIDAPI_BOOKING] Search failed:", error);

      return {
        success: false,
        data: [],
        message: "Hotel search failed",
        error: error instanceof Error ? error.message : "Unknown error",
        search_context: params,
      };
    }
  }

  async searchDestinations(
    query: string
  ): Promise<Array<{ dest_id: string; name: string; type: string }>> {
    try {
      const response = await this.makeRequest("/hotels/searchDestination", {
        query,
      });

      // Transform response to our format - handle booking-com15 API structure
      const responseData = response as { status?: boolean; data?: unknown[] };

      if (responseData.status && Array.isArray(responseData.data)) {
        return responseData.data.map((dest: unknown) => {
          const destData = dest as {
            dest_id?: string;
            id?: string;
            name?: string;
            label?: string;
            dest_type?: string;
            type?: string;
          };
          return {
            dest_id: String(destData.dest_id || destData.id),
            name: destData.name || destData.label || "Unknown destination",
            type: destData.dest_type || destData.type || "city",
          };
        });
      }

      // Fallback for direct array response
      if (Array.isArray(response)) {
        return response.map((dest: unknown) => {
          const destData = dest as {
            dest_id?: string;
            id?: string;
            name?: string;
            label?: string;
            dest_type?: string;
            type?: string;
          };
          return {
            dest_id: String(destData.dest_id || destData.id),
            name: destData.name || destData.label || "Unknown destination",
            type: destData.dest_type || destData.type || "city",
          };
        });
      }

      return [];
    } catch (error) {
      console.error("[RAPIDAPI_BOOKING] Destination search failed:", error);
      return [];
    }
  }

  private transformHotelsResponse(
    rawResponse: unknown,
    searchParams?: RapidApiHotelSearchParams,
    destId?: string
  ): RapidApiHotel[] {
    // Handle booking-com15 API response format
    const response = rawResponse as {
      status?: boolean;
      data?: { hotels?: unknown[] };
      result?: unknown[];
      message?: unknown;
    };

    if (!response) {
      console.warn("[RAPIDAPI_BOOKING] Invalid response format:", rawResponse);
      return [];
    }

    // Handle booking-com15 format with status/data/hotels
    if (response.status !== undefined) {
      if (!response.status) {
        console.warn("[RAPIDAPI_BOOKING] API returned error status:", response);
        return [];
      }

      if (response.data && Array.isArray(response.data.hotels)) {
        console.log(
          `[RAPIDAPI_BOOKING] Found ${response.data.hotels.length} hotels in response`
        );
        return response.data.hotels.map((hotel: unknown) => {
          return this.transformSingleHotel(hotel, searchParams, destId);
        });
      }

      console.warn(
        "[RAPIDAPI_BOOKING] No hotels array found in data:",
        response.data
      );
      return [];
    }

    // Handle old format with result array
    if (Array.isArray(response.result)) {
      return response.result.map((hotel: unknown) => {
        return this.transformSingleHotel(hotel, searchParams, destId);
      });
    }

    console.warn("[RAPIDAPI_BOOKING] Invalid response format:", rawResponse);
    return [];
  }

  private transformSingleHotel(
    hotel: unknown,
    searchParams?: RapidApiHotelSearchParams,
    destId?: string
  ): RapidApiHotel {
    // Handle booking-com15 API format where each hotel has a 'property' object
    const hotelRecord = hotel as {
      property?: {
        id?: number;
        name?: string;
        latitude?: number;
        longitude?: number;
        reviewScore?: number;
        reviewCount?: number;
        currency?: string;
        priceBreakdown?: {
          grossPrice?: {
            currency?: string;
            value?: number;
          };
        };
        photoUrls?: string[];
        countryCode?: string;
        propertyClass?: number;
        reviewScoreWord?: string;
      };
      accessibilityLabel?: string;
      // Fallback for other formats
      hotel_id?: string;
      id?: string;
      hotel_name?: string;
      name?: string;
    };

    // Use property data if available, otherwise fallback to direct properties
    const property = hotelRecord.property;
    const fallbackData = hotelRecord;

    if (property) {
      // booking-com15 format
      return {
        id: String(
          property.id || fallbackData.hotel_id || fallbackData.id || "0"
        ),
        name:
          property.name ||
          fallbackData.hotel_name ||
          fallbackData.name ||
          "Hotel Name Not Available",
        description: hotelRecord.accessibilityLabel,
        location: `${property.countryCode || "Unknown"}`,
        address: undefined,
        city: undefined,
        country: property.countryCode,
        coordinates:
          property.latitude && property.longitude
            ? {
                latitude: property.latitude,
                longitude: property.longitude,
              }
            : undefined,
        images: property.photoUrls || [],
        price: property.priceBreakdown?.grossPrice
          ? {
              amount: property.priceBreakdown.grossPrice.value || 0,
              currency:
                property.priceBreakdown.grossPrice.currency ||
                property.currency ||
                "EUR",
              per_night: true,
            }
          : undefined,
        rating: property.reviewScore,
        review_count: property.reviewCount,
        amenities: [], // Not directly available in this format
        booking_url:
          searchParams && property.id
            ? this.generateBookingUrl(property.id, searchParams, destId)
            : undefined,
        availability: true, // Assume available if returned in search
      };
    } else {
      // Fallback for other formats
      const hotelData = fallbackData as {
        hotel_id?: string;
        id?: string;
        hotel_name?: string;
        name?: string;
        hotel_name_trans?: string;
        description?: string;
        city?: string;
        region?: string;
        country?: string;
        country_trans?: string;
        address?: string;
        latitude?: string;
        longitude?: string;
        min_total_price?: string;
        currency_code?: string;
        review_score?: string;
        review_nr?: string;
        hotel_facilities?: string[];
        url?: string;
        is_free_cancellable?: boolean;
        main_photo_url?: string;
        max_photo_url?: string;
        photos?: Array<{ url_max?: string; url_original?: string }>;
      };

      return {
        id: String(hotelData.hotel_id || hotelData.id || "0"),
        name:
          hotelData.hotel_name || hotelData.name || "Hotel Name Not Available",
        description: hotelData.hotel_name_trans || hotelData.description,
        location:
          hotelData.city ||
          hotelData.region ||
          hotelData.country ||
          "Location not available",
        address: hotelData.address,
        city: hotelData.city,
        country: hotelData.country_trans,
        coordinates:
          hotelData.latitude && hotelData.longitude
            ? {
                latitude: parseFloat(hotelData.latitude),
                longitude: parseFloat(hotelData.longitude),
              }
            : undefined,
        images: this.extractImagesLegacy(hotelData),
        price: hotelData.min_total_price
          ? {
              amount: parseFloat(hotelData.min_total_price),
              currency: hotelData.currency_code || "EUR",
              per_night: true,
            }
          : undefined,
        rating: hotelData.review_score
          ? parseFloat(hotelData.review_score)
          : undefined,
        review_count: hotelData.review_nr
          ? parseInt(hotelData.review_nr)
          : undefined,
        amenities: hotelData.hotel_facilities
          ? hotelData.hotel_facilities.slice(0, 5)
          : [],
        booking_url:
          hotelData.url ||
          (searchParams && hotelData.id
            ? this.generateBookingUrl(hotelData.id, searchParams, destId)
            : undefined),
        availability: hotelData.is_free_cancellable !== undefined,
      };
    }
  }

  private extractImagesLegacy(hotel: {
    main_photo_url?: string;
    max_photo_url?: string;
    photos?: Array<{ url_max?: string; url_original?: string }>;
  }): string[] {
    const images: string[] = [];

    if (hotel.main_photo_url) {
      images.push(hotel.main_photo_url);
    }

    if (hotel.max_photo_url) {
      images.push(hotel.max_photo_url);
    }

    if (hotel.photos && Array.isArray(hotel.photos)) {
      hotel.photos.slice(0, 3).forEach(photo => {
        const imageUrl = photo.url_max || photo.url_original;
        if (imageUrl) {
          images.push(imageUrl);
        }
      });
    }

    return [...new Set(images)]; // Remove duplicates
  }

  private generateBookingUrl(
    hotelId: number | string,
    searchParams: RapidApiHotelSearchParams,
    destId?: string
  ): string {
    // Try different Booking.com URL formats

    // Option 1: Direct hotel page (requires country and hotel name - not available)
    // Option 2: Search results with hotel ID filter
    // Option 3: Use dest_id if available for better targeting

    const baseUrl = "https://www.booking.com/searchresults.html";
    const urlParams = new URLSearchParams();

    // Use destination ID if available (from destination lookup)
    if (destId) {
      urlParams.append("dest_id", destId);
      urlParams.append("dest_type", "city");
    } else if (searchParams.location) {
      urlParams.append("ss", searchParams.location);
    }

    // Add booking parameters
    if (searchParams.checkinDate) {
      urlParams.append("checkin", searchParams.checkinDate);
    }
    if (searchParams.checkoutDate) {
      urlParams.append("checkout", searchParams.checkoutDate);
    }
    if (searchParams.adults) {
      urlParams.append("group_adults", String(searchParams.adults));
    }
    if (searchParams.rooms) {
      urlParams.append("no_rooms", String(searchParams.rooms));
    }
    if (searchParams.children && searchParams.children > 0) {
      urlParams.append("group_children", String(searchParams.children));
    }

    // Add affiliate ID
    urlParams.append("aid", "332731");

    // Try to filter by hotel ID - this might help narrow results
    urlParams.append("hotel_id", String(hotelId));

    return `${baseUrl}?${urlParams.toString()}`;
  }

  async getHotelDetails(hotelId: string): Promise<RapidApiHotel | null> {
    try {
      const response = await this.makeRequest("/hotels/details", {
        hotel_id: hotelId,
        locale: "it",
      });

      if (response) {
        return this.transformHotelsResponse({ result: [response] })[0] || null;
      }

      return null;
    } catch (error) {
      console.error("[RAPIDAPI_BOOKING] Hotel details failed:", error);
      return null;
    }
  }
}

// Export singleton instance
export const rapidApiBookingService = new RapidApiBookingService();
