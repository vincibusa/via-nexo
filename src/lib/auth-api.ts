/**
 * Auth API Client
 * Handles all authentication API calls for web and mobile compatibility
 */

// ===== TYPES =====

export interface User {
  id: string;
  email: string;
  emailConfirmed: boolean;
  createdAt: string;
  lastSignInAt?: string;
  userMetadata?: Record<string, unknown>;
}

export interface UserProfile {
  id: string;
  created_at: string;
  updated_at: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  preferred_language?: string;
  preferred_currency?: string;
  travel_style?: string[];
  preferred_locations?: string[];
  budget_range?: number;
  dietary_restrictions?: string[];
  email_notifications?: boolean;
  push_notifications?: boolean;
  marketing_emails?: boolean;
  profile_public?: boolean;
  share_search_data?: boolean;
  total_bookings?: number;
  total_searches?: number;
  last_active_at?: string;
  role: "user" | "admin" | "partner";
}

export interface AuthError {
  message: string;
  name: string;
  status: number;
}

// API Response types
export interface LoginResponse {
  success: boolean;
  data?: {
    user: User;
    profile: UserProfile | null;
  };
  error?: string;
}

export interface RegisterResponse {
  success: boolean;
  data?: {
    user: User;
    profile: UserProfile | null;
    needsEmailConfirmation: boolean;
  };
  error?: string;
}

export interface MeResponse {
  success: boolean;
  data?: {
    user: User;
    profile: UserProfile | null;
  };
  error?: string;
}

export interface ProfileUpdateResponse {
  success: boolean;
  data?: {
    profile: UserProfile;
  };
  error?: string;
}

export interface RefreshResponse {
  success: boolean;
  data?: {
    tokenRefreshed: boolean;
    expiresIn: number;
    user?: User;
  };
  error?: string;
}

export interface LogoutResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// ===== API FUNCTIONS =====

/**
 * Login with email and password
 */
export async function loginWithPassword(
  email: string,
  password: string
): Promise<LoginResponse> {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      credentials: "include", // Important for cookies
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP error! status: ${response.status}`,
      };
    }

    return data;
  } catch (error) {
    console.error("[AUTH_API] Login error:", error);
    return {
      success: false,
      error: "Network error during login",
    };
  }
}

/**
 * Register new user
 */
export async function registerUser(
  email: string,
  password: string,
  displayName?: string,
  acceptTerms: boolean = true
): Promise<RegisterResponse> {
  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        displayName,
        acceptTerms,
      }),
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP error! status: ${response.status}`,
      };
    }

    return data;
  } catch (error) {
    console.error("[AUTH_API] Register error:", error);
    return {
      success: false,
      error: "Network error during registration",
    };
  }
}

/**
 * Get current user and profile
 */
export async function getCurrentUser(): Promise<MeResponse> {
  try {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP error! status: ${response.status}`,
      };
    }

    return data;
  } catch (error) {
    console.error("[AUTH_API] Get current user error:", error);
    return {
      success: false,
      error: "Network error fetching user",
    };
  }
}

/**
 * Update user profile
 */
export async function updateProfile(
  updates: Partial<UserProfile>
): Promise<ProfileUpdateResponse> {
  try {
    const response = await fetch("/api/auth/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP error! status: ${response.status}`,
      };
    }

    return data;
  } catch (error) {
    console.error("[AUTH_API] Update profile error:", error);
    return {
      success: false,
      error: "Network error updating profile",
    };
  }
}

/**
 * Refresh authentication token
 */
export async function refreshToken(): Promise<RefreshResponse> {
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP error! status: ${response.status}`,
      };
    }

    return data;
  } catch (error) {
    console.error("[AUTH_API] Refresh token error:", error);
    return {
      success: false,
      error: "Network error refreshing token",
    };
  }
}

/**
 * Logout user
 */
export async function logout(): Promise<LogoutResponse> {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP error! status: ${response.status}`,
      };
    }

    return data;
  } catch (error) {
    console.error("[AUTH_API] Logout error:", error);
    return {
      success: false,
      error: "Network error during logout",
    };
  }
}

/**
 * Auto-refresh token if needed (helper function)
 */
export async function ensureValidToken(): Promise<boolean> {
  try {
    const response = await refreshToken();
    return response.success;
  } catch {
    return false;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const response = await getCurrentUser();
    return response.success;
  } catch {
    return false;
  }
}
