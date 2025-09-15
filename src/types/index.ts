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
  externalUrl?: string; // URL esterno per prenotazioni (es. Booking.com)
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
    type?: string;
    searchQuery?: string;
    partnersReturned?: number;
    confidence?: number;
    progress?: unknown;
    plan?: string;
  };
  partners?: PartnerData[];
}

export interface PartnerData {
  id: string;
  name: string;
  type: "hotel" | "restaurant" | "tour" | "shuttle";
  description: string;
  location: string;
  price_range: string;
  rating: number;
  amenities?: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
  images?: string[];
  contact_info?: {
    phone?: string;
    email?: string;
    website?: string;
  };
}

export interface ChatSession {
  id: string;
  title: string;
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

// ===== CHAT DATABASE TYPES =====

export interface DatabaseConversation {
  id: string;
  title: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseConversationWithMessages {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface CreateConversationRequest {
  title: string;
}

export interface UpdateConversationRequest {
  title: string;
}

export interface CreateMessageRequest {
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: Record<string, unknown>;
}

// API Response types for chat endpoints
export interface ConversationsListResponse {
  success: boolean;
  data: DatabaseConversation[];
  total: number;
}

export interface ConversationDetailResponse {
  success: boolean;
  data: DatabaseConversationWithMessages;
}

export interface ConversationCreateResponse {
  success: boolean;
  data: DatabaseConversation;
}

export interface ConversationUpdateResponse {
  success: boolean;
  data: {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface MessageCreateResponse {
  success: boolean;
  data: ChatMessage;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
}

// ===== RAPIDAPI BOOKING TYPES =====

export interface RapidApiHotelSearchParams {
  location: string;
  checkinDate?: string; // YYYY-MM-DD format
  checkoutDate?: string; // YYYY-MM-DD format
  adults?: number;
  rooms?: number;
  children?: number;
  currency?: string;
}

export interface RapidApiHotel {
  id: string;
  name: string;
  description?: string;
  location: string;
  address?: string;
  city?: string;
  country?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  images: string[];
  price?: {
    amount: number;
    currency: string;
    per_night?: boolean;
  };
  rating?: number;
  review_count?: number;
  amenities?: string[];
  booking_url?: string;
  availability?: boolean;
}

export interface RapidApiHotelResponse {
  success: boolean;
  data: RapidApiHotel[];
  message: string;
  total_results?: number;
  search_context?: RapidApiHotelSearchParams;
  error?: string;
}

// ===== DATE EXTRACTION TYPES =====

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
