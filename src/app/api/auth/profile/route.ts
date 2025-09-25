import { NextRequest, NextResponse } from "next/server";
import { requireAuth, getServerUserProfile } from "@/lib/server-auth-utils";
import { supabase } from "@/lib/supabase-server";

interface UpdateProfileRequest {
  displayName?: string;
  bio?: string;
  preferredLanguage?: string;
  preferredCurrency?: string;
  travelStyle?: string[];
  preferredLocations?: string[];
  budgetRange?: number;
  dietaryRestrictions?: string[];
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  marketingEmails?: boolean;
  profilePublic?: boolean;
  shareSearchData?: boolean;
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body: UpdateProfileRequest = await request.json();

    // Validate input data
    const updateData: Record<string, unknown> = {};

    if (body.displayName !== undefined) {
      if (typeof body.displayName !== "string") {
        return NextResponse.json(
          { success: false, error: "Display name must be a string" },
          { status: 400 }
        );
      }
      if (body.displayName.trim().length > 100) {
        return NextResponse.json(
          {
            success: false,
            error: "Display name must be 100 characters or less",
          },
          { status: 400 }
        );
      }
      updateData.display_name = body.displayName.trim() || null;
    }

    if (body.bio !== undefined) {
      if (typeof body.bio !== "string") {
        return NextResponse.json(
          { success: false, error: "Bio must be a string" },
          { status: 400 }
        );
      }
      if (body.bio.trim().length > 500) {
        return NextResponse.json(
          { success: false, error: "Bio must be 500 characters or less" },
          { status: 400 }
        );
      }
      updateData.bio = body.bio.trim() || null;
    }

    if (body.preferredLanguage !== undefined) {
      if (typeof body.preferredLanguage !== "string") {
        return NextResponse.json(
          { success: false, error: "Preferred language must be a string" },
          { status: 400 }
        );
      }
      const validLanguages = ["it", "en", "fr", "de", "es"];
      if (!validLanguages.includes(body.preferredLanguage)) {
        return NextResponse.json(
          { success: false, error: "Invalid preferred language" },
          { status: 400 }
        );
      }
      updateData.preferred_language = body.preferredLanguage;
    }

    if (body.preferredCurrency !== undefined) {
      if (typeof body.preferredCurrency !== "string") {
        return NextResponse.json(
          { success: false, error: "Preferred currency must be a string" },
          { status: 400 }
        );
      }
      const validCurrencies = ["EUR", "USD", "GBP", "CHF"];
      if (!validCurrencies.includes(body.preferredCurrency)) {
        return NextResponse.json(
          { success: false, error: "Invalid preferred currency" },
          { status: 400 }
        );
      }
      updateData.preferred_currency = body.preferredCurrency;
    }

    if (body.travelStyle !== undefined) {
      if (!Array.isArray(body.travelStyle)) {
        return NextResponse.json(
          { success: false, error: "Travel style must be an array" },
          { status: 400 }
        );
      }
      updateData.travel_style = body.travelStyle;
    }

    if (body.preferredLocations !== undefined) {
      if (!Array.isArray(body.preferredLocations)) {
        return NextResponse.json(
          { success: false, error: "Preferred locations must be an array" },
          { status: 400 }
        );
      }
      updateData.preferred_locations = body.preferredLocations;
    }

    if (body.budgetRange !== undefined) {
      if (typeof body.budgetRange !== "number" || body.budgetRange < 0) {
        return NextResponse.json(
          { success: false, error: "Budget range must be a positive number" },
          { status: 400 }
        );
      }
      updateData.budget_range = body.budgetRange;
    }

    if (body.dietaryRestrictions !== undefined) {
      if (!Array.isArray(body.dietaryRestrictions)) {
        return NextResponse.json(
          { success: false, error: "Dietary restrictions must be an array" },
          { status: 400 }
        );
      }
      updateData.dietary_restrictions = body.dietaryRestrictions;
    }

    // Boolean fields
    if (body.emailNotifications !== undefined) {
      updateData.email_notifications = Boolean(body.emailNotifications);
    }

    if (body.pushNotifications !== undefined) {
      updateData.push_notifications = Boolean(body.pushNotifications);
    }

    if (body.marketingEmails !== undefined) {
      updateData.marketing_emails = Boolean(body.marketingEmails);
    }

    if (body.profilePublic !== undefined) {
      updateData.profile_public = Boolean(body.profilePublic);
    }

    if (body.shareSearchData !== undefined) {
      updateData.share_search_data = Boolean(body.shareSearchData);
    }

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();

    // Check if there's anything to update
    if (Object.keys(updateData).length === 1) {
      // Only updated_at
      return NextResponse.json(
        { success: false, error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Update user profile
    const { data: updatedProfile, error } = await supabase
      .from("user_profiles")
      .update(updateData)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("[AUTH_API] Profile update error:", error);

      if (error.code === "PGRST116") {
        return NextResponse.json(
          { success: false, error: "Profile not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { success: false, error: "Failed to update profile" },
        { status: 500 }
      );
    }

    console.log("[AUTH_API] Profile updated successfully for user:", user.id);

    return NextResponse.json({
      success: true,
      data: {
        profile: updatedProfile,
      },
    });
  } catch (error) {
    console.error("[AUTH_API] Profile update endpoint error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
