/**
 * usePartners Hook
 * Manages partner data fetching and caching
 */

import { useState, useCallback, useEffect } from "react";
import type { Partner, PartnerType, Status } from "@/types";

interface UsePartnersReturn {
  // State
  partners: Partner[];
  status: Status;
  error: string | null;

  // Actions
  fetchPartners: (filters?: PartnerFilters) => Promise<void>;
  fetchPartnerById: (id: string) => Promise<Partner | null>;
  clearPartners: () => void;

  // Computed
  isLoading: boolean;
  isEmpty: boolean;
}

interface PartnerFilters {
  type?: PartnerType;
  location?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
}

export function usePartners(): UsePartnersReturn {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const fetchPartners = useCallback(async (filters: PartnerFilters = {}) => {
    setStatus("loading");
    setError(null);

    try {
      // TODO: Replace with actual API call when backend is ready
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockPartners: Partner[] = [
        {
          id: "1",
          name: "Grand Hotel Via Veneto",
          type: "hotel",
          description:
            "Luxury hotel in the heart of Rome with stunning views and world-class service.",
          rating: 4.8,
          reviewCount: 245,
          priceRange: "luxury",
          location: {
            address: "Via Veneto 155",
            city: "Rome",
            region: "Lazio",
            country: "Italy",
            coordinates: { lat: 41.9062, lng: 12.4886 },
            timezone: "Europe/Rome",
          },
          images: ["/partners/hotel-1.jpg", "/partners/hotel-1-2.jpg"],
          features: ["WiFi", "Spa", "Restaurant", "Concierge", "Parking"],
          contact: {
            phone: "+39 06 47881",
            email: "info@grandhotelviav.com",
            website: "https://grandhotelviav.com",
          },
          isVerified: true,
          createdAt: "2024-01-15T00:00:00Z",
          updatedAt: "2024-09-01T00:00:00Z",
        },
        {
          id: "2",
          name: "Trattoria da Mario",
          type: "restaurant",
          description:
            "Authentic Tuscan cuisine in a cozy family-run restaurant.",
          rating: 4.6,
          reviewCount: 189,
          priceRange: "mid-range",
          location: {
            address: "Via della Scala 25",
            city: "Florence",
            region: "Toscana",
            country: "Italy",
            coordinates: { lat: 43.7696, lng: 11.2558 },
            timezone: "Europe/Rome",
          },
          images: ["/partners/restaurant-1.jpg"],
          features: ["Outdoor Seating", "Wine List", "Vegetarian Options"],
          contact: {
            phone: "+39 055 218550",
            email: "info@trattoriadamario.it",
          },
          isVerified: true,
          createdAt: "2024-02-10T00:00:00Z",
          updatedAt: "2024-08-15T00:00:00Z",
        },
        {
          id: "3",
          name: "Venice Gondola Experience",
          type: "tour",
          description:
            "Traditional gondola ride through the romantic canals of Venice.",
          rating: 4.9,
          reviewCount: 567,
          priceRange: "mid-range",
          location: {
            address: "St. Mark's Square",
            city: "Venice",
            region: "Veneto",
            country: "Italy",
            coordinates: { lat: 45.4342, lng: 12.3388 },
            timezone: "Europe/Rome",
          },
          images: ["/partners/tour-1.jpg", "/partners/tour-1-2.jpg"],
          features: ["Private Guide", "Photo Service", "Champagne Option"],
          contact: {
            phone: "+39 041 5205888",
            website: "https://venicegondola.com",
          },
          isVerified: true,
          createdAt: "2024-03-05T00:00:00Z",
          updatedAt: "2024-09-02T00:00:00Z",
        },
      ];

      // Apply filters
      let filteredPartners = mockPartners;

      if (filters.type) {
        filteredPartners = filteredPartners.filter(
          p => p.type === filters.type
        );
      }

      if (filters.location) {
        filteredPartners = filteredPartners.filter(
          p =>
            p.location.city
              .toLowerCase()
              .includes(filters.location!.toLowerCase()) ||
            p.location.region
              .toLowerCase()
              .includes(filters.location!.toLowerCase())
        );
      }

      if (filters.limit) {
        filteredPartners = filteredPartners.slice(0, filters.limit);
      }

      setPartners(filteredPartners);
      setStatus("success");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch partners";
      setError(errorMessage);
      setStatus("error");
    }
  }, []);

  const fetchPartnerById = useCallback(
    async (id: string): Promise<Partner | null> => {
      try {
        // TODO: Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 500));

        // Return mock partner for demo
        const mockPartner: Partner = {
          id,
          name: "Sample Partner",
          type: "hotel",
          description: "A sample partner for demonstration.",
          rating: 4.5,
          reviewCount: 100,
          priceRange: "mid-range",
          location: {
            address: "Sample Address",
            city: "Rome",
            region: "Lazio",
            country: "Italy",
            coordinates: { lat: 41.9028, lng: 12.4964 },
            timezone: "Europe/Rome",
          },
          images: ["/placeholder.jpg"],
          features: ["WiFi", "Breakfast"],
          contact: {
            phone: "+39 06 1234567",
          },
          isVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        return mockPartner;
      } catch (err) {
        console.error("Failed to fetch partner:", err);
        return null;
      }
    },
    []
  );

  const clearPartners = useCallback(() => {
    setPartners([]);
    setError(null);
    setStatus("idle");
  }, []);

  // Computed properties
  const isLoading = status === "loading";
  const isEmpty = partners.length === 0 && status !== "loading";

  return {
    // State
    partners,
    status,
    error,

    // Actions
    fetchPartners,
    fetchPartnerById,
    clearPartners,

    // Computed
    isLoading,
    isEmpty,
  };
}

// Hook for featured partners
export function useFeaturedPartners(limit: number = 6) {
  const { partners, status, error, fetchPartners } = usePartners();

  useEffect(() => {
    fetchPartners({ featured: true, limit });
  }, [fetchPartners, limit]);

  return {
    featuredPartners: partners,
    isLoading: status === "loading",
    error,
  };
}

// Hook for partners by type
export function usePartnersByType(type: PartnerType, limit?: number) {
  const { partners, status, error, fetchPartners } = usePartners();

  useEffect(() => {
    fetchPartners({ type, limit });
  }, [fetchPartners, type, limit]);

  return {
    partners,
    isLoading: status === "loading",
    error,
  };
}
