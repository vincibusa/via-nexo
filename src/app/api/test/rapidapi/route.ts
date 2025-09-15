/**
 * Test endpoint for RapidAPI Booking.com integration
 * GET /api/test/rapidapi?location=Roma&checkin=2025-01-20&checkout=2025-01-22
 */

import { NextRequest, NextResponse } from "next/server";
import { rapidApiBookingService } from "@/lib/rapidapi-booking";
import { extractDatesFromQuery } from "@/lib/date-extraction";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const location = searchParams.get("location") || "Roma";
  const checkin = searchParams.get("checkin");
  const checkout = searchParams.get("checkout");
  const query = searchParams.get("query") || `Hotel a ${location}`;

  console.log(`[TEST_RAPIDAPI] Testing with params:`, {
    location,
    checkin,
    checkout,
    query,
  });

  try {
    // Test 1: Date extraction
    console.log(`[TEST_RAPIDAPI] Testing date extraction...`);
    const dateResult = await extractDatesFromQuery(query);

    // Test 2: RapidAPI call
    console.log(`[TEST_RAPIDAPI] Testing RapidAPI service...`);
    const searchParams = {
      location,
      checkinDate: checkin || dateResult.dates?.checkinDate,
      checkoutDate: checkout || dateResult.dates?.checkoutDate,
      adults: 2,
      rooms: 1,
    };

    const apiResult = await rapidApiBookingService.searchHotels(searchParams);

    // Return comprehensive test results
    return NextResponse.json({
      success: true,
      test_results: {
        date_extraction: {
          success: dateResult.success,
          dates: dateResult.dates,
          fallback_used: dateResult.fallbackUsed,
        },
        rapidapi_call: {
          success: apiResult.success,
          hotel_count: apiResult.data.length,
          message: apiResult.message,
          error: apiResult.error,
          sample_hotel: apiResult.data[0]
            ? {
                id: apiResult.data[0].id,
                name: apiResult.data[0].name,
                location: apiResult.data[0].location,
                price: apiResult.data[0].price,
                rating: apiResult.data[0].rating,
                booking_url: apiResult.data[0].booking_url,
              }
            : null,
        },
      },
      search_params: searchParams,
      original_query: query,
    });
  } catch (error) {
    console.error("[TEST_RAPIDAPI] Test failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Test failed",
        test_results: null,
      },
      { status: 500 }
    );
  }
}
