/**
 * Via Nexo - Application Constants
 * Tourism RAG App Configuration and Static Data
 */

import type { PartnerType, PriceRange, Locale } from "@/types";

// ===== APP CONFIGURATION =====

export const APP_CONFIG = {
  name: "Via Nexo",
  description:
    "Discover Italy's hidden gems with AI-powered travel recommendations",
  version: "1.0.0",
  author: "Via Nexo Team",
  url: "https://via-nexo.com",
  supportEmail: "support@via-nexo.com",
} as const;

// ===== API CONFIGURATION =====

export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
} as const;

// ===== PARTNER TYPES =====

export const PARTNER_TYPES: Record<
  PartnerType,
  { label: string; icon: string; description: string }
> = {
  hotel: {
    label: "Hotels",
    icon: "🏨",
    description: "Comfortable accommodations from budget to luxury",
  },
  restaurant: {
    label: "Restaurants",
    icon: "🍽️",
    description: "Authentic Italian cuisine and dining experiences",
  },
  tour: {
    label: "Tours",
    icon: "🗺️",
    description: "Guided tours and cultural experiences",
  },
  experience: {
    label: "Experiences",
    icon: "🎭",
    description: "Unique activities and local experiences",
  },
  transport: {
    label: "Transport",
    icon: "🚗",
    description: "Transportation options and transfers",
  },
} as const;

// ===== PRICE RANGES =====

export const PRICE_RANGES: Record<
  PriceRange,
  { label: string; symbol: string; description: string }
> = {
  budget: {
    label: "Budget",
    symbol: "€",
    description: "Affordable options under €50",
  },
  "mid-range": {
    label: "Mid-range",
    symbol: "€€",
    description: "Quality options €50-150",
  },
  luxury: {
    label: "Luxury",
    symbol: "€€€",
    description: "Premium options €150-300",
  },
  premium: {
    label: "Premium",
    symbol: "€€€€",
    description: "Exclusive options over €300",
  },
} as const;

// ===== ITALIAN REGIONS =====

export const ITALIAN_REGIONS = [
  "Abruzzo",
  "Basilicata",
  "Calabria",
  "Campania",
  "Emilia-Romagna",
  "Friuli-Venezia Giulia",
  "Lazio",
  "Liguria",
  "Lombardia",
  "Marche",
  "Molise",
  "Piemonte",
  "Puglia",
  "Sardegna",
  "Sicilia",
  "Toscana",
  "Trentino-Alto Adige",
  "Umbria",
  "Valle d'Aosta",
  "Veneto",
] as const;

// ===== POPULAR DESTINATIONS =====

export const POPULAR_DESTINATIONS = [
  { name: "Rome", region: "Lazio", image: "/destinations/rome.jpg" },
  { name: "Florence", region: "Toscana", image: "/destinations/florence.jpg" },
  { name: "Venice", region: "Veneto", image: "/destinations/venice.jpg" },
  { name: "Milan", region: "Lombardia", image: "/destinations/milan.jpg" },
  { name: "Naples", region: "Campania", image: "/destinations/naples.jpg" },
  { name: "Turin", region: "Piemonte", image: "/destinations/turin.jpg" },
  {
    name: "Bologna",
    region: "Emilia-Romagna",
    image: "/destinations/bologna.jpg",
  },
  { name: "Palermo", region: "Sicilia", image: "/destinations/palermo.jpg" },
] as const;

// ===== SEARCH CONFIGURATION =====

export const SEARCH_CONFIG = {
  defaultResultsLimit: 20,
  maxResultsLimit: 100,
  defaultRadius: 50, // km
  maxRadius: 200, // km
  minQueryLength: 2,
  searchDebounceMs: 300,
  suggestionsLimit: 5,
} as const;

// ===== CHAT CONFIGURATION =====

export const CHAT_CONFIG = {
  maxMessages: 50,
  maxMessageLength: 500,
  typingIndicatorMs: 1000,
  systemPrompt:
    "You are a helpful Italian tourism assistant. Provide recommendations for hotels, restaurants, tours, and experiences in Italy.",
} as const;

// ===== UI CONFIGURATION =====

export const UI_CONFIG = {
  breakpoints: {
    xs: 360,
    sm: 480,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
  },
  animation: {
    fast: 150,
    normal: 200,
    slow: 300,
    slower: 500,
  },
  zIndex: {
    base: 0,
    raised: 10,
    dropdown: 100,
    overlay: 200,
    modal: 300,
    toast: 400,
    tooltip: 500,
    maximum: 999,
  },
} as const;

// ===== GLASSMORPHISM PRESETS =====

export const GLASS_PRESETS = {
  light: {
    background: "rgba(255, 255, 255, 0.15)",
    border: "rgba(255, 255, 255, 0.15)",
    blur: "16px",
  },
  strong: {
    background: "rgba(255, 255, 255, 0.20)",
    border: "rgba(255, 255, 255, 0.25)",
    blur: "24px",
  },
  subtle: {
    background: "rgba(255, 255, 255, 0.10)",
    border: "rgba(255, 255, 255, 0.10)",
    blur: "12px",
  },
} as const;

// ===== SUPPORTED LANGUAGES =====

export const SUPPORTED_LOCALES: Record<
  Locale,
  { label: string; flag: string }
> = {
  en: { label: "English", flag: "🇬🇧" },
  it: { label: "Italiano", flag: "🇮🇹" },
  fr: { label: "Français", flag: "🇫🇷" },
  de: { label: "Deutsch", flag: "🇩🇪" },
  es: { label: "Español", flag: "🇪🇸" },
} as const;

// ===== FEATURE FLAGS =====

export const DEFAULT_FEATURE_FLAGS = {
  chatEnabled: true,
  bookingEnabled: false, // To be enabled in future phases
  reviewsEnabled: true,
  mapView: true,
  advancedSearch: true,
} as const;

// ===== VALIDATION RULES =====

export const VALIDATION_RULES = {
  search: {
    minQueryLength: 2,
    maxQueryLength: 100,
  },
  booking: {
    minAdvanceBookingDays: 1,
    maxAdvanceBookingDays: 365,
    maxGuests: 20,
  },
  contact: {
    phoneRegex: /^(\+\d{1,3}[- ]?)?\d{6,14}$/,
    emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
} as const;

// ===== ERROR MESSAGES =====

export const ERROR_MESSAGES = {
  network: "Network error. Please check your connection.",
  timeout: "Request timed out. Please try again.",
  unauthorized: "Please log in to continue.",
  forbidden: "You don't have permission to access this resource.",
  notFound: "The requested resource was not found.",
  serverError: "Server error. Please try again later.",
  validation: "Please check your input and try again.",
  generic: "Something went wrong. Please try again.",
} as const;

// ===== SUCCESS MESSAGES =====

export const SUCCESS_MESSAGES = {
  searchComplete: "Search completed successfully",
  bookingCreated: "Booking created successfully",
  profileUpdated: "Profile updated successfully",
  messageSent: "Message sent successfully",
  subscribed: "Successfully subscribed to updates",
} as const;

// ===== SOCIAL MEDIA LINKS =====

export const SOCIAL_LINKS = {
  facebook: "https://facebook.com/vianexo",
  instagram: "https://instagram.com/vianexo",
  twitter: "https://twitter.com/vianexo",
  youtube: "https://youtube.com/vianexo",
  linkedin: "https://linkedin.com/company/vianexo",
} as const;

// ===== LEGAL LINKS =====

export const LEGAL_LINKS = {
  privacy: "/privacy",
  terms: "/terms",
  cookies: "/cookies",
  accessibility: "/accessibility",
  contact: "/contact",
} as const;

// ===== META TAGS =====

export const META_DEFAULTS = {
  title: "Via Nexo - Discover Italy with AI",
  description:
    "Discover Italy's hidden gems with AI-powered travel recommendations. Find the best hotels, restaurants, tours and experiences.",
  keywords:
    "Italy travel, tourism, hotels, restaurants, tours, AI recommendations, Italian vacation",
  author: "Via Nexo Team",
  robots: "index, follow",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
} as const;
