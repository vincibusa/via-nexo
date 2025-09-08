"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, ZoomIn, ZoomOut, Layers, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PartnerData } from "@/types";
import Image from "next/image";

// Dynamically import Leaflet components to avoid SSR issues
const DynamicMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-lg bg-neutral-100">
      <div className="text-neutral-600">Caricamento mappa...</div>
    </div>
  ),
});

interface MapViewProps {
  partners: PartnerData[];
  selectedPartnerId?: string;
  onPartnerSelect: (partnerId: string) => void;
  className?: string;
}

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  partner: PartnerData;
}

// Mock coordinates for Italian cities
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Roma: { lat: 41.9028, lng: 12.4964 },
  Milano: { lat: 45.4642, lng: 9.19 },
  Firenze: { lat: 43.7696, lng: 11.2558 },
  Napoli: { lat: 40.8518, lng: 14.2681 },
  Venezia: { lat: 45.4408, lng: 12.3155 },
  Bologna: { lat: 44.4949, lng: 11.3426 },
  Torino: { lat: 45.0703, lng: 7.6869 },
  Palermo: { lat: 38.1157, lng: 13.3613 },
  Bari: { lat: 41.1171, lng: 16.8719 },
  Genova: { lat: 44.4056, lng: 8.9463 },
  Verona: { lat: 45.4384, lng: 10.9916 },
  Padova: { lat: 45.4064, lng: 11.8768 },
  Trieste: { lat: 45.6486, lng: 13.7768 },
  Brescia: { lat: 45.5384, lng: 10.2213 },
  Modena: { lat: 44.6453, lng: 10.9251 },
  Parma: { lat: 44.8015, lng: 10.3275 },
  "Reggio Emilia": { lat: 44.698, lng: 10.6303 },
  Perugia: { lat: 43.1121, lng: 12.3955 },
  Livorno: { lat: 43.5523, lng: 10.3081 },
};

export const MapView: React.FC<MapViewProps> = ({
  partners,
  selectedPartnerId,
  onPartnerSelect,
  className,
}) => {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

  useEffect(() => {
    // Convert partners to map markers with coordinates
    const newMarkers: MapMarker[] = partners.map(partner => {
      let lat = 41.9028; // Default Roma lat
      let lng = 12.4964; // Default Roma lng

      // Use real coordinates if available
      if (
        partner.coordinates &&
        partner.coordinates.lat &&
        partner.coordinates.lng
      ) {
        lat = partner.coordinates.lat;
        lng = partner.coordinates.lng;
      } else {
        // Fallback to city coordinates if available
        const city = partner.location?.split(",")[0]?.trim() || "Roma";
        const cityCoords = CITY_COORDINATES[city];
        if (cityCoords) {
          lat = cityCoords.lat;
          lng = cityCoords.lng;
        }
        // Add small random offset for defaults to prevent clustering
        const offset = 0.005;
        lat += (Math.random() - 0.5) * offset;
        lng += (Math.random() - 0.5) * offset;
      }

      return {
        id: partner.id,
        lat,
        lng,
        partner,
      };
    });

    setMarkers(newMarkers);

    // Center map on partners if available
    if (newMarkers.length > 0) {
    }
  }, [partners]);

  const handleMarkerClick = (marker: MapMarker) => {
    setSelectedMarker(marker);
    onPartnerSelect(marker.id);
  };

  const getMarkerColor = (partnerType: string) => {
    switch (partnerType) {
      case "hotel":
        return "bg-blue-500";
      case "restaurant":
        return "bg-green-500";
      case "tour":
        return "bg-purple-500";
      case "shuttle":
        return "bg-orange-500";
      default:
        return "bg-neutral-500";
    }
  };

  const getPartnerTypeIcon = (type: string) => {
    switch (type) {
      case "hotel":
        return "🏨";
      case "restaurant":
        return "🍽️";
      case "tour":
        return "🗺️";
      case "shuttle":
        return "🚐";
      default:
        return "📍";
    }
  };

  return (
    <div className={cn("relative h-full", className)}>
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="border-neutral-300 bg-white/90 backdrop-blur-sm hover:bg-white"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="border-neutral-300 bg-white/90 backdrop-blur-sm hover:bg-white"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="border-neutral-300 bg-white/90 backdrop-blur-sm hover:bg-white"
        >
          <Navigation className="h-4 w-4" />
        </Button>
      </div>

      {/* Map Legend */}
      <div className="absolute top-4 left-4 z-10">
        <Card className="border-neutral-300 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-3">
            <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-800">
              <Layers className="h-4 w-4" />
              Legenda
            </h4>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                <span>
                  🏨 Hotel (
                  {markers.filter(m => m.partner.type === "hotel").length})
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <span>
                  🍽️ Ristoranti (
                  {markers.filter(m => m.partner.type === "restaurant").length})
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                <span>
                  🗺️ Tour (
                  {markers.filter(m => m.partner.type === "tour").length})
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                <span>
                  🚐 Trasporti (
                  {markers.filter(m => m.partner.type === "shuttle").length})
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected Partner Info */}
      {selectedMarker && (
        <div className="absolute right-4 bottom-4 left-4 z-10">
          <Card className="border-neutral-300 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Partner Image */}
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={
                      selectedMarker.partner.images?.[0] ||
                      "https://images.unsplash.com/photo-1566073771259-6a8506099945"
                    }
                    alt={selectedMarker.partner.name}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Partner Info */}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="truncate font-medium text-neutral-900">
                      {selectedMarker.partner.name}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {getPartnerTypeIcon(selectedMarker.partner.type)}
                    </Badge>
                  </div>

                  <div className="mb-2 flex items-center gap-1 text-sm text-neutral-600">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">
                      {selectedMarker.partner.location}
                    </span>
                  </div>

                  <p className="line-clamp-2 text-sm text-neutral-700">
                    {selectedMarker.partner.description}
                  </p>
                </div>

                {/* Close and View Details */}
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(
                        `/partner/${selectedMarker.partner.id}`,
                        "_blank"
                      )
                    }
                    className="text-xs"
                  >
                    Dettagli
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedMarker(null)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Map Container */}
      <div className="h-full w-full">
        <DynamicMap
          markers={markers}
          selectedPartnerId={selectedPartnerId}
          onMarkerClick={handleMarkerClick}
          getMarkerColor={getMarkerColor}
          getPartnerTypeIcon={getPartnerTypeIcon}
        />
      </div>
    </div>
  );
};
