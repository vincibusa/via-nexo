/**
 * Via Nexo - Core TypeScript Types
 * Tourism RAG App Types and Interfaces
 */

// ===== API RESPONSE TYPES =====

export interface ApiResponse<T = unknown> {
  data: T;
  message: string;
  success: boolean;
  error?: string;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ===== PARTNER TYPES =====

export interface Partner {
  id: string;
  name: string;
  type: PartnerType;
  description: string;
  rating: number;
  reviewCount: number;
  priceRange: PriceRange;
  location: Location;
  images: string[];
  features: string[];
  contact: ContactInfo;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PartnerType =
  | "hotel"
  | "restaurant"
  | "tour"
  | "experience"
  | "transport";

export type PriceRange = "budget" | "mid-range" | "luxury" | "premium";

export interface Location {
  address: string;
  city: string;
  region: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  timezone: string;
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

// ===== SEARCH TYPES =====

export interface SearchParams {
  query: string;
  location?: string;
  type?: PartnerType[];
  priceRange?: PriceRange[];
  rating?: number;
  dates?: DateRange;
  guests?: number;
  features?: string[];
  radius?: number; // in km
}

export interface DateRange {
  startDate: string; // ISO date string
  endDate: string; // ISO date string
}

export interface SearchResult {
  partners: Partner[];
  total: number;
  query: string;
  filters: SearchParams;
  suggestions?: string[];
  executionTime: number;
}

// ===== AI CHAT TYPES =====

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  metadata?: {
    searchQuery?: string;
    partnersReturned?: number;
    confidence?: number;
  };
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  context: SearchParams;
  createdAt: string;
  updatedAt: string;
}

// ===== USER TYPES =====

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  language: string;
  currency: string;
  theme: "light" | "dark" | "system";
  notifications: {
    email: boolean;
    push: boolean;
    marketing: boolean;
  };
  searchDefaults: {
    location?: string;
    priceRange?: PriceRange[];
    partnerTypes?: PartnerType[];
  };
}

// ===== BOOKING TYPES =====

export interface Booking {
  id: string;
  userId: string;
  partnerId: string;
  partner: Partner;
  status: BookingStatus;
  dates: DateRange;
  guests: number;
  totalPrice: number;
  currency: string;
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
}

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "refunded";

// ===== UI COMPONENT TYPES =====

export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface GlassProps extends ComponentProps {
  variant?: "light" | "strong";
  blur?: "sm" | "md" | "lg";
}

// ===== FORM TYPES =====

export interface FormFieldProps {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  helperText?: string;
}

export interface SearchFormData {
  query: string;
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  partnerTypes: PartnerType[];
}

// ===== NAVIGATION TYPES =====

export interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
  external?: boolean;
  disabled?: boolean;
}

export interface MainNavItem extends NavItem {
  items?: NavItem[];
}

// ===== ANALYTICS TYPES =====

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp?: string;
}

export interface PageView {
  path: string;
  title: string;
  referrer?: string;
  timestamp: string;
}

// ===== ERROR TYPES =====

export interface AppError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// ===== UTILITY TYPES =====

export type Status = "idle" | "loading" | "success" | "error";

export type Theme = "light" | "dark" | "system";

export type Locale = "en" | "it" | "fr" | "de" | "es";

// ===== FEATURE FLAGS =====

export interface FeatureFlags {
  chatEnabled: boolean;
  bookingEnabled: boolean;
  reviewsEnabled: boolean;
  mapView: boolean;
  advancedSearch: boolean;
}
