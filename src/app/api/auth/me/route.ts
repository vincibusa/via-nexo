import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server-auth";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user from session
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("[AUTH_API] Get user error:", error);

      // Handle token expired or invalid
      if (
        error.message.includes("Invalid Refresh Token") ||
        error.message.includes("refresh_token_not_found")
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
    let userProfile = null;
    try {
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.warn("[AUTH_API] Profile fetch error:", profileError);

        // If profile doesn't exist, create a basic one
        if (profileError.code === "PGRST116") {
          try {
            const { data: newProfile, error: createError } = await supabase
              .from("user_profiles")
              .insert({
                id: user.id,
                display_name: user.user_metadata?.display_name || null,
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
              console.log(
                "[AUTH_API] Created missing profile for user:",
                user.id
              );
            }
          } catch (createError) {
            console.error("[AUTH_API] Failed to create profile:", createError);
          }
        }
      } else {
        userProfile = profile;
      }
    } catch (profileError) {
      console.error("[AUTH_API] Profile fetch failed:", profileError);
    }

    // Check if we need to refresh the session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      // Update cookies with fresh tokens if available
      const cookieStore = await cookies();

      // Update access token cookie
      cookieStore.set("supabase-access-token", session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: session.expires_in || 3600,
        path: "/",
      });

      // Update refresh token if it changed
      if (session.refresh_token) {
        cookieStore.set("supabase-refresh-token", session.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 30 * 24 * 60 * 60, // 30 days
          path: "/",
        });
      }
    }

    // Return user data
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          emailConfirmed: user.email_confirmed_at != null,
          createdAt: user.created_at,
          lastSignInAt: user.last_sign_in_at,
          userMetadata: user.user_metadata,
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
