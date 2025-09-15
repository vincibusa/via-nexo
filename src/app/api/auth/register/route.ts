import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server-auth";
import { cookies } from "next/headers";

interface RegisterRequest {
  email: string;
  password: string;
  displayName?: string;
  acceptTerms: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const body: RegisterRequest = await request.json();
    const { email, password, displayName, acceptTerms } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (!acceptTerms) {
      return NextResponse.json(
        { success: false, error: "You must accept the terms and conditions" },
        { status: 400 }
      );
    }

    // Validate data types
    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Email and password must be strings" },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Password strength validation
    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must be at least 8 characters long",
        },
        { status: 400 }
      );
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Password must contain at least one uppercase letter, one lowercase letter, and one number",
        },
        { status: 400 }
      );
    }

    // Display name validation
    if (displayName && displayName.trim().length > 100) {
      return NextResponse.json(
        {
          success: false,
          error: "Display name must be 100 characters or less",
        },
        { status: 400 }
      );
    }

    // Attempt to create user
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: {
          display_name: displayName?.trim() || null,
        },
      },
    });

    if (error) {
      console.error("[AUTH_API] Registration error:", error);

      // Handle specific error cases
      if (error.message.includes("User already registered")) {
        return NextResponse.json(
          {
            success: false,
            error: "An account with this email already exists",
          },
          { status: 409 }
        );
      }

      if (error.message.includes("Password should be at least")) {
        return NextResponse.json(
          {
            success: false,
            error: "Password does not meet security requirements",
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { success: false, error: "Registration failed" },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { success: false, error: "Registration failed" },
        { status: 400 }
      );
    }

    // Create user profile
    let userProfile = null;
    try {
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .insert({
          id: data.user.id,
          display_name: displayName?.trim() || null,
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

      if (profileError) {
        console.error("[AUTH_API] Profile creation error:", profileError);
        // Continue without failing the registration
      } else {
        userProfile = profile;
      }
    } catch (profileError) {
      console.error("[AUTH_API] Profile creation failed:", profileError);
      // Continue without failing the registration
    }

    // If user is immediately confirmed and we have a session, set cookies
    if (data.session) {
      const cookieStore = await cookies();

      // Set access token cookie (HTTP-only for security)
      cookieStore.set("supabase-access-token", data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: data.session.expires_in || 3600,
        path: "/",
      });

      // Set refresh token cookie (HTTP-only for security)
      cookieStore.set("supabase-refresh-token", data.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: "/",
      });
    }

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          emailConfirmed: data.user.email_confirmed_at != null,
          createdAt: data.user.created_at,
        },
        profile: userProfile,
        needsEmailConfirmation: !data.session, // If no session, email confirmation is required
      },
    });
  } catch (error) {
    console.error("[AUTH_API] Registration endpoint error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
