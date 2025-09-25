import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(_request: NextRequest) {
  try {
    // Clear authentication cookies
    const cookieStore = await cookies();

    // Clear access token cookie
    cookieStore.delete("supabase-access-token");

    // Clear refresh token cookie
    cookieStore.delete("supabase-refresh-token");

    // Also explicitly set them to expired (for extra safety)
    cookieStore.set("supabase-access-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    cookieStore.set("supabase-refresh-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    console.log("[AUTH_API] User successfully logged out");

    return NextResponse.json({
      success: true,
      message: "Successfully logged out",
    });
  } catch (error) {
    console.error("[AUTH_API] Logout endpoint error:", error);

    // Even if there's an error, try to clear cookies
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
