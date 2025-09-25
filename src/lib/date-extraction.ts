/**
 * Date Extraction Utility
 * Uses AI to extract check-in/check-out dates from natural language queries
 */

import { openai } from "./openai";

export interface ExtractedDates {
  checkinDate: string; // YYYY-MM-DD format
  checkoutDate: string; // YYYY-MM-DD format
  guests?: number;
  rooms?: number;
  confidence: "high" | "medium" | "low";
  reasoning: string;
}

export interface DateExtractionResult {
  success: boolean;
  dates?: ExtractedDates;
  error?: string;
  fallbackUsed: boolean;
}

class DateExtractionService {
  /**
   * Extract dates from natural language query using AI
   */
  async extractDatesFromQuery(query: string): Promise<DateExtractionResult> {
    console.log(`[DATE_EXTRACTION] Processing query: "${query}"`);

    try {
      // Get today's date for reference
      const today = new Date();
      const todayStr = this.formatDate(today);

      const systemPrompt = `
You are a date extraction specialist for hotel bookings. Extract check-in and check-out dates from user queries.

Current date: ${todayStr}

Rules:
1. Always return dates in YYYY-MM-DD format
2. Check-in must be today or future date
3. Check-out must be after check-in date
4. If no dates specified, use reasonable defaults (checkin: tomorrow, checkout: day after)
5. Extract number of guests/rooms if mentioned
6. Provide confidence level and reasoning

Response format (JSON only):
{
  "checkinDate": "YYYY-MM-DD",
  "checkoutDate": "YYYY-MM-DD", 
  "guests": number (optional),
  "rooms": number (optional),
  "confidence": "high|medium|low",
  "reasoning": "explanation of extraction logic"
}

Examples:
- "Hotel a Roma dal 20 al 22 gennaio" → checkin: 2025-01-20, checkout: 2025-01-22
- "Hotel per domani sera" → checkin: tomorrow, checkout: day after tomorrow
- "Hotel a Milano per 3 notti dal 15 marzo" → checkin: 2025-03-15, checkout: 2025-03-18
- "Hotel per 2 persone" → default dates + guests: 2
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
        temperature: 0.1,
        max_tokens: 300,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI");
      }

      console.log(`[DATE_EXTRACTION] AI Response:`, content);

      // Parse JSON response
      const parsedDates = JSON.parse(content.trim()) as ExtractedDates;

      // Validate extracted dates
      const validationResult = this.validateDates(parsedDates);
      if (!validationResult.isValid) {
        console.warn(
          `[DATE_EXTRACTION] Invalid dates:`,
          validationResult.error
        );
        return this.getFallbackDates(query);
      }

      console.log(`[DATE_EXTRACTION] Successfully extracted:`, parsedDates);

      return {
        success: true,
        dates: parsedDates,
        fallbackUsed: false,
      };
    } catch (error) {
      console.error("[DATE_EXTRACTION] AI extraction failed:", error);
      return this.getFallbackDates(query);
    }
  }

  /**
   * Validate extracted dates for logical consistency
   */
  private validateDates(dates: ExtractedDates): {
    isValid: boolean;
    error?: string;
  } {
    const today = new Date();
    const checkin = new Date(dates.checkinDate);
    const checkout = new Date(dates.checkoutDate);

    // Check date format
    if (isNaN(checkin.getTime()) || isNaN(checkout.getTime())) {
      return { isValid: false, error: "Invalid date format" };
    }

    // Check-in cannot be in the past (allow today)
    if (checkin < new Date(today.setHours(0, 0, 0, 0))) {
      return { isValid: false, error: "Check-in date is in the past" };
    }

    // Check-out must be after check-in
    if (checkout <= checkin) {
      return { isValid: false, error: "Check-out date must be after check-in" };
    }

    // Reasonable stay duration (max 30 days)
    const diffDays =
      (checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 30) {
      return { isValid: false, error: "Stay duration too long (max 30 days)" };
    }

    return { isValid: true };
  }

  /**
   * Generate fallback dates when AI extraction fails
   */
  private getFallbackDates(query: string): DateExtractionResult {
    console.log("[DATE_EXTRACTION] Using fallback date logic");

    const today = new Date();
    const checkinDate = new Date(today);
    checkinDate.setDate(today.getDate() + 1); // Tomorrow

    const checkoutDate = new Date(checkinDate);
    checkoutDate.setDate(checkinDate.getDate() + 1); // Day after tomorrow

    // Simple guest extraction from query
    const guestMatch = query.match(
      /(\d+)\s*(?:persone|persons|people|ospiti|guests)/i
    );
    const guests = guestMatch ? parseInt(guestMatch[1]) : 2;

    const roomMatch = query.match(/(\d+)\s*(?:camere|rooms|stanze)/i);
    const rooms = roomMatch ? parseInt(roomMatch[1]) : 1;

    const fallbackDates: ExtractedDates = {
      checkinDate: this.formatDate(checkinDate),
      checkoutDate: this.formatDate(checkoutDate),
      guests,
      rooms,
      confidence: "low",
      reasoning: "Used fallback logic: tomorrow check-in, next day check-out",
    };

    return {
      success: true,
      dates: fallbackDates,
      fallbackUsed: true,
    };
  }

  /**
   * Format date to YYYY-MM-DD string
   */
  private formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
  }

  /**
   * Quick heuristic-based date extraction for simple cases
   */
  extractDatesHeuristic(query: string): ExtractedDates | null {
    const today = new Date();

    // Look for "tomorrow" keywords
    if (/domani|tomorrow/i.test(query)) {
      const checkin = new Date(today);
      checkin.setDate(today.getDate() + 1);

      const checkout = new Date(checkin);
      checkout.setDate(checkin.getDate() + 1);

      return {
        checkinDate: this.formatDate(checkin),
        checkoutDate: this.formatDate(checkout),
        confidence: "medium",
        reasoning: 'Detected "tomorrow" keyword',
      };
    }

    // Look for date patterns like "dal 20 al 22"
    const dateRangeMatch = query.match(/dal\s+(\d{1,2})\s+al\s+(\d{1,2})/i);
    if (dateRangeMatch) {
      const day1 = parseInt(dateRangeMatch[1]);
      const day2 = parseInt(dateRangeMatch[2]);

      if (day1 < day2 && day1 >= 1 && day2 <= 31) {
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        const checkin = new Date(currentYear, currentMonth, day1);
        const checkout = new Date(currentYear, currentMonth, day2);

        // If dates are in the past, assume next month
        if (checkin < today) {
          checkin.setMonth(currentMonth + 1);
          checkout.setMonth(currentMonth + 1);
        }

        return {
          checkinDate: this.formatDate(checkin),
          checkoutDate: this.formatDate(checkout),
          confidence: "high",
          reasoning: `Extracted date range: ${day1}-${day2}`,
        };
      }
    }

    return null;
  }
}

// Export singleton instance
export const dateExtractionService = new DateExtractionService();

/**
 * Helper function for quick date extraction
 */
export async function extractDatesFromQuery(
  query: string
): Promise<DateExtractionResult> {
  return dateExtractionService.extractDatesFromQuery(query);
}
