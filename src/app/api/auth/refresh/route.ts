import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server-auth";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the current session to check if refresh is needed
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("[AUTH_API] Session check error:", error);

      // Clear invalid cookies
      const cookieStore = await cookies();
      cookieStore.delete("supabase-access-token");
      cookieStore.delete("supabase-refresh-token");

      return NextResponse.json(
        { success: false, error: "Session invalid" },
        { status: 401 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { success: false, error: "No active session" },
        { status: 401 }
      );
    }

    // Check if refresh is actually needed (token expires in next 5 minutes)
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at || 0;
    const timeUntilExpiry = expiresAt - now;

    if (timeUntilExpiry > 300) {
      // More than 5 minutes left
      // Token is still valid, return current session info
      return NextResponse.json({
        success: true,
        data: {
          tokenRefreshed: false,
          expiresIn: timeUntilExpiry,
        },
      });
    }

    // Try to refresh the session
    const { data: refreshData, error: refreshError } =
      await supabase.auth.refreshSession({
        refresh_token: session.refresh_token,
      });

    if (refreshError) {
      console.error("[AUTH_API] Token refresh error:", refreshError);

      // Clear invalid cookies
      const cookieStore = await cookies();
      cookieStore.delete("supabase-access-token");
      cookieStore.delete("supabase-refresh-token");

      return NextResponse.json(
        { success: false, error: "Token refresh failed" },
        { status: 401 }
      );
    }

    if (!refreshData.session) {
      return NextResponse.json(
        { success: false, error: "Token refresh failed" },
        { status: 401 }
      );
    }

    // Update cookies with new tokens
    const cookieStore = await cookies();

    // Set new access token cookie
    cookieStore.set("supabase-access-token", refreshData.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: refreshData.session.expires_in || 3600,
      path: "/",
    });

    // Set new refresh token cookie (if it changed)
    if (refreshData.session.refresh_token) {
      cookieStore.set(
        "supabase-refresh-token",
        refreshData.session.refresh_token,
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 30 * 24 * 60 * 60, // 30 days
          path: "/",
        }
      );
    }

    console.log(
      "[AUTH_API] Token refreshed successfully for user:",
      refreshData.user?.id
    );

    return NextResponse.json({
      success: true,
      data: {
        tokenRefreshed: true,
        expiresIn: refreshData.session.expires_in,
        user: {
          id: refreshData.user?.id,
          email: refreshData.user?.email,
          emailConfirmed: refreshData.user?.email_confirmed_at != null,
        },
      },
    });
  } catch (error) {
    console.error("[AUTH_API] Refresh endpoint error:", error);

    // Clear cookies on error
    try {
      const cookieStore = await cookies();
      cookieStore.delete("supabase-access-token");
      cookieStore.delete("supabase-refresh-token");
    } catch (cookieError) {
      console.error("[AUTH_API] Failed to clear cookies:", cookieError);
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
