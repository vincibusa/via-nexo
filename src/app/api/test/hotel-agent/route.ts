/**
 * Test endpoint for Hotel Agent integration
 * POST /api/test/hotel-agent with { "query": "Hotel a Roma domani" }
 */

import { NextRequest, NextResponse } from "next/server";
import { run } from "@openai/agents";
import { hotelAgent } from "@/lib/agents/hotel-agent";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: "Query parameter is required",
        },
        { status: 400 }
      );
    }

    console.log(`[TEST_HOTEL_AGENT] Testing with query: "${query}"`);

    // Run the hotel agent
    const response = await run(hotelAgent, query, { maxTurns: 3 });

    console.log(`[TEST_HOTEL_AGENT] Agent response:`, response);

    return NextResponse.json({
      success: true,
      query,
      agent_response: response,
    });
  } catch (error) {
    console.error("[TEST_HOTEL_AGENT] Test failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Hotel agent test failed",
      },
      { status: 500 }
    );
  }
}
