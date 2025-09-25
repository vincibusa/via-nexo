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
  rapid_api_data?: {
    hotel_details?: HotelDetails;
    real_time_price?: {
      amount: number;
      currency: string;
      per_night?: boolean;
    };
    availability?: boolean;
    review_count?: number;
    sustainability?: {
      level?: string;
      title?: string;
      description?: string;
    };
    breakfast_included?: boolean;
    available_rooms?: number;
  };
}

export interface RapidApiHotelResponse {
  success: boolean;
  data: RapidApiHotel[];
  message: string;
  total_results?: number;
  search_context?: RapidApiHotelSearchParams;
  error?: string;
}

export interface AvailabilityDate {
  date: string; // YYYY-MM-DD
  price?: {
    amount: number;
    currency: string;
  };
  available: boolean;
}

export interface HotelAvailability {
  hotelId: string;
  available: boolean;
  lengthsOfStay: number[];
  avDates: AvailabilityDate[];
  error?: string;
}

export interface HotelDetails {
  hotel_id: string;
  hotel_name: string;
  url: string; // Direct Booking.com URL
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  review_score?: number;
  review_count?: number;
  photos: string[];
  facilities: Array<{
    name: string;
    icon?: string;
  }>;
  room_highlights: string[];
  price_breakdown?: {
    gross_amount: {
      value: number;
      currency: string;
    };
    gross_amount_per_night: {
      value: number;
      currency: string;
    };
    all_inclusive_amount?: {
      value: number;
      currency: string;
    };
    charges_details?: {
      amount: {
        value: number;
        currency: string;
      };
      translated_copy: string;
    };
  };
  sustainability?: {
    level?: string;
    title?: string;
    description?: string;
  };
  accommodation_type?: string;
  available_rooms?: number;
  breakfast_included?: boolean;
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

  async checkHotelAvailability(
    hotelId: string,
    checkinDate: string,
    checkoutDate: string,
    currency = "EUR"
  ): Promise<HotelAvailability> {
    console.log(
      `[RAPIDAPI_BOOKING] Checking availability for hotel ${hotelId}:`,
      {
        checkinDate,
        checkoutDate,
        currency,
      }
    );

    if (!this.apiKey) {
      return {
        hotelId,
        available: false,
        lengthsOfStay: [],
        avDates: [],
        error: "RapidAPI key not configured",
      };
    }

    try {
      const response = await this.makeRequest("/hotels/getAvailability", {
        hotel_id: hotelId,
        currency_code: currency,
        location: "IT",
      });

      // Parse response from booking-com15 API
      const availabilityData = response as {
        status?: boolean;
        data?: {
          lengthsOfStay?: number[];
          avDates?: Array<{
            date?: string;
            price?: {
              amount?: number;
              currency?: string;
            };
            available?: boolean;
          }>;
        };
        lengthsOfStay?: number[];
        avDates?: unknown[];
      };

      if (!availabilityData) {
        throw new Error("No availability data received");
      }

      // Handle booking-com15 format
      let lengthsOfStay: number[] = [];
      let avDates: AvailabilityDate[] = [];

      if (availabilityData.status && availabilityData.data) {
        lengthsOfStay = availabilityData.data.lengthsOfStay || [];
        avDates = (availabilityData.data.avDates || []).map(
          (dateInfo: unknown) => {
            const date = dateInfo as {
              date?: string;
              price?: { amount?: number; currency?: string };
              available?: boolean;
            };
            return {
              date: date.date || "",
              price: date.price
                ? {
                    amount: date.price.amount || 0,
                    currency: date.price.currency || currency,
                  }
                : undefined,
              available: date.available !== false,
            };
          }
        );
      } else if (availabilityData.lengthsOfStay) {
        // Direct format fallback
        lengthsOfStay = availabilityData.lengthsOfStay;
        avDates = (availabilityData.avDates || []).map((dateInfo: unknown) => {
          const date = dateInfo as {
            date?: string;
            price?: { amount?: number; currency?: string };
            available?: boolean;
          };
          return {
            date: date.date || "",
            price: date.price
              ? {
                  amount: date.price.amount || 0,
                  currency: date.price.currency || currency,
                }
              : undefined,
            available: date.available !== false,
          };
        });
      }

      // Calculate requested stay length
      const checkin = new Date(checkinDate);
      const checkout = new Date(checkoutDate);
      const stayLength = Math.ceil(
        (checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check if the requested stay length is available
      const lengthAvailable = lengthsOfStay.includes(stayLength);

      // Check if all requested dates are available
      const requestedDates: string[] = [];
      for (
        let d = new Date(checkin);
        d < checkout;
        d.setDate(d.getDate() + 1)
      ) {
        requestedDates.push(d.toISOString().split("T")[0]);
      }

      const datesAvailable = requestedDates.every(requestedDate => {
        const dateAvailability = avDates.find(
          avDate => avDate.date === requestedDate
        );
        return dateAvailability && dateAvailability.available;
      });

      const isAvailable = lengthAvailable && datesAvailable;

      console.log(
        `[RAPIDAPI_BOOKING] Availability check for hotel ${hotelId}:`,
        {
          stayLength,
          lengthAvailable,
          datesAvailable,
          isAvailable,
          requestedDates,
          availableLengths: lengthsOfStay,
          availableDatesCount: avDates.filter(d => d.available).length,
        }
      );

      return {
        hotelId,
        available: isAvailable,
        lengthsOfStay,
        avDates,
      };
    } catch (error) {
      console.error(
        `[RAPIDAPI_BOOKING] Availability check failed for hotel ${hotelId}:`,
        error
      );

      return {
        hotelId,
        available: false,
        lengthsOfStay: [],
        avDates: [],
        error:
          error instanceof Error ? error.message : "Availability check failed",
      };
    }
  }

  async getHotelDetails(
    hotelId: string,
    checkinDate?: string,
    checkoutDate?: string,
    adults = 2,
    rooms = 1,
    children = 0,
    currency = "EUR"
  ): Promise<HotelDetails | null> {
    console.log(`[RAPIDAPI_BOOKING] Getting hotel details for ${hotelId}:`, {
      checkinDate,
      checkoutDate,
      adults,
      rooms,
      children,
      currency,
    });

    if (!this.apiKey) {
      console.warn(
        "[RAPIDAPI_BOOKING] API key not configured for hotel details"
      );
      return null;
    }

    try {
      const params: Record<string, unknown> = {
        hotel_id: hotelId,
        adults,
        room_qty: rooms,
        units: "metric",
        temperature_unit: "c",
        languagecode: "en-us",
        currency_code: currency,
        location: "IT",
      };

      if (children > 0) {
        params.children_age = "0,17"; // Default children ages
      }

      if (checkinDate) {
        params.arrival_date = checkinDate;
      }

      if (checkoutDate) {
        params.departure_date = checkoutDate;
      }

      const response = await this.makeRequest(
        "/hotels/getHotelDetails",
        params
      );

      console.log(`[RAPIDAPI_BOOKING] Hotel details response for ${hotelId}:`, {
        hasData: !!response,
        status: (response as { status?: boolean })?.status,
      });

      return this.transformHotelDetailsResponse(response);
    } catch (error) {
      console.error(
        `[RAPIDAPI_BOOKING] Hotel details failed for ${hotelId}:`,
        error
      );
      return null;
    }
  }

  private transformHotelDetailsResponse(
    response: unknown
  ): HotelDetails | null {
    const apiResponse = response as {
      status?: boolean;
      data?: {
        hotel_id?: number;
        hotel_name?: string;
        url?: string;
        address?: string;
        city?: string;
        country_trans?: string;
        latitude?: number;
        longitude?: number;
        review_nr?: number;
        facilities_block?: {
          facilities?: Array<{
            name?: string;
            icon?: string;
          }>;
        };
        product_price_breakdown?: {
          gross_amount?: {
            value?: number;
            currency?: string;
          };
          gross_amount_per_night?: {
            value?: number;
            currency?: string;
          };
          all_inclusive_amount?: {
            value?: number;
            currency?: string;
          };
          charges_details?: {
            amount?: {
              value?: number;
              currency?: string;
            };
            translated_copy?: string;
          };
        };
        sustainability?: {
          sustainability_level?: {
            name?: string;
            title?: string;
          };
          hotel_page?: {
            title?: string;
            description?: string;
          };
        };
        accommodation_type_name?: string;
        available_rooms?: number;
        hotel_include_breakfast?: number;
        property_highlight_strip?: Array<{
          name?: string;
          icon_list?: Array<{
            icon?: string;
          }>;
        }>;
        rooms?: Record<
          string,
          {
            photos?: Array<{
              url_max750?: string;
              url_original?: string;
            }>;
            highlights?: Array<{
              translated_name?: string;
              icon?: string;
            }>;
          }
        >;
      };
    };

    if (!apiResponse?.status || !apiResponse.data) {
      console.warn(
        "[RAPIDAPI_BOOKING] Invalid hotel details response:",
        apiResponse
      );
      return null;
    }

    const data = apiResponse.data;

    // Extract photos from rooms
    const photos: string[] = [];
    if (data.rooms) {
      Object.values(data.rooms).forEach(room => {
        if (room.photos) {
          room.photos.slice(0, 5).forEach(photo => {
            if (photo.url_max750) {
              photos.push(photo.url_max750);
            } else if (photo.url_original) {
              photos.push(photo.url_original);
            }
          });
        }
      });
    }

    // Extract facilities
    const facilities = (data.facilities_block?.facilities || []).map(
      facility => ({
        name: facility.name || "Unknown",
        icon: facility.icon,
      })
    );

    // Extract room highlights
    const room_highlights: string[] = [];
    if (data.rooms) {
      Object.values(data.rooms).forEach(room => {
        if (room.highlights) {
          room.highlights.forEach(highlight => {
            if (highlight.translated_name) {
              room_highlights.push(highlight.translated_name);
            }
          });
        }
      });
    }

    // Add property highlights as well
    if (data.property_highlight_strip) {
      data.property_highlight_strip.forEach(highlight => {
        if (highlight.name && !room_highlights.includes(highlight.name)) {
          room_highlights.push(highlight.name);
        }
      });
    }

    // Remove duplicates
    const uniqueHighlights = [...new Set(room_highlights)];

    return {
      hotel_id: String(data.hotel_id || ""),
      hotel_name: data.hotel_name || "Hotel name not available",
      url: data.url || "",
      address: data.address || "",
      city: data.city || "",
      country: data.country_trans || "",
      latitude: data.latitude || 0,
      longitude: data.longitude || 0,
      review_count: data.review_nr,
      photos: [...new Set(photos)], // Remove duplicates
      facilities,
      room_highlights: uniqueHighlights.slice(0, 10), // Limit to 10 highlights
      price_breakdown: data.product_price_breakdown
        ? {
            gross_amount: {
              value: data.product_price_breakdown.gross_amount?.value || 0,
              currency:
                data.product_price_breakdown.gross_amount?.currency || "EUR",
            },
            gross_amount_per_night: {
              value:
                data.product_price_breakdown.gross_amount_per_night?.value || 0,
              currency:
                data.product_price_breakdown.gross_amount_per_night?.currency ||
                "EUR",
            },
            all_inclusive_amount: data.product_price_breakdown
              .all_inclusive_amount
              ? {
                  value:
                    data.product_price_breakdown.all_inclusive_amount.value ||
                    0,
                  currency:
                    data.product_price_breakdown.all_inclusive_amount
                      .currency || "EUR",
                }
              : undefined,
            charges_details: data.product_price_breakdown.charges_details
              ? {
                  amount: {
                    value:
                      data.product_price_breakdown.charges_details.amount
                        ?.value || 0,
                    currency:
                      data.product_price_breakdown.charges_details.amount
                        ?.currency || "EUR",
                  },
                  translated_copy:
                    data.product_price_breakdown.charges_details
                      .translated_copy || "",
                }
              : undefined,
          }
        : undefined,
      sustainability: data.sustainability
        ? {
            level: data.sustainability.sustainability_level?.name,
            title: data.sustainability.hotel_page?.title,
            description: data.sustainability.hotel_page?.description,
          }
        : undefined,
      accommodation_type: data.accommodation_type_name,
      available_rooms: data.available_rooms,
      breakfast_included: data.hotel_include_breakfast === 1,
    };
  }

  async getHotelDetailsLegacy(hotelId: string): Promise<RapidApiHotel | null> {
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
