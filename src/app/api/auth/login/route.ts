import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    // Create temporary client with anon key for authentication
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

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

    // Attempt to sign in
    const { data, error } = await authClient.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (error) {
      console.error("[AUTH_API] Login error:", error);

      // Handle specific error cases
      if (error.message.includes("Invalid login credentials")) {
        return NextResponse.json(
          { success: false, error: "Invalid email or password" },
          { status: 401 }
        );
      }

      if (error.message.includes("Email not confirmed")) {
        return NextResponse.json(
          {
            success: false,
            error: "Please verify your email before logging in",
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { success: false, error: "Authentication failed" },
        { status: 401 }
      );
    }

    if (!data.user || !data.session) {
      return NextResponse.json(
        { success: false, error: "Authentication failed" },
        { status: 401 }
      );
    }

    // Fetch user profile using service role client
    let userProfile = null;
    try {
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (profileError) {
        console.warn("[AUTH_API] Profile fetch error:", profileError);
        // Continue without profile if it doesn't exist
      } else {
        userProfile = profile;
      }
    } catch (profileError) {
      console.warn("[AUTH_API] Profile fetch failed:", profileError);
      // Continue without profile
    }

    // Set session cookies
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

    // Return user data (without sensitive session info)
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          emailConfirmed: data.user.email_confirmed_at != null,
          createdAt: data.user.created_at,
          lastSignInAt: data.user.last_sign_in_at,
        },
        profile: userProfile,
      },
    });
  } catch (error) {
    console.error("[AUTH_API] Login endpoint error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
