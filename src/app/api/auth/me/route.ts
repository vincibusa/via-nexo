import { NextRequest, NextResponse } from "next/server";
import {
  getServerAuthUser,
  getServerUserProfile,
} from "@/lib/server-auth-utils";
import { supabase } from "@/lib/supabase-server";
import { cookies } from "next/headers";

export async function GET(_request: NextRequest) {
  try {
    const { user, error } = await getServerAuthUser();

    if (error) {
      console.error("[AUTH_API] Get user error:", error);

      // Handle token expired or invalid
      if (
        error.includes("Invalid Refresh Token") ||
        error.includes("refresh_token_not_found")
      ) {
        // Clear invalid cookies
        const cookieStore = await cookies();
        cookieStore.delete("supabase-access-token");
        cookieStore.delete("supabase-refresh-token");

        return NextResponse.json(
          { success: false, error: "Session expired" },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { success: false, error: "Authentication failed" },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Fetch user profile
    let userProfile = await getServerUserProfile(user.id);

    // If profile doesn't exist, create a basic one
    if (!userProfile) {
      try {
        const { data: newProfile, error: createError } = await supabase
          .from("user_profiles")
          .insert({
            id: user.id,
            display_name: user.userMetadata?.display_name || null,
            preferred_language: "it",
            role: "user",
            email_notifications: true,
            push_notifications: true,
            marketing_emails: false,
            profile_public: false,
            share_search_data: false,
          })
          .select()
          .single();

        if (createError) {
          console.error("[AUTH_API] Profile creation error:", createError);
        } else {
          userProfile = newProfile;
          console.log("[AUTH_API] Created missing profile for user:", user.id);
        }
      } catch (createError) {
        console.error("[AUTH_API] Failed to create profile:", createError);
      }
    }

    // Return user data
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          emailConfirmed: user.emailConfirmed,
          createdAt: user.createdAt,
          lastSignInAt: user.lastSignInAt,
          userMetadata: user.userMetadata,
        },
        profile: userProfile,
      },
    });
  } catch (error) {
    console.error("[AUTH_API] Me endpoint error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
