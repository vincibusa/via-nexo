"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, ZoomIn, ZoomOut, Layers, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PartnerData } from "@/types";
import Image from "next/image";

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
      // Extract city from location or use default
      const city = partner.location?.split(",")[0]?.trim() || "Roma";
      const coordinates = CITY_COORDINATES[city] || CITY_COORDINATES["Roma"];

      // Add small random offset to prevent overlapping markers
      const offset = 0.01;
      return {
        id: partner.id,
        lat: coordinates.lat + (Math.random() - 0.5) * offset,
        lng: coordinates.lng + (Math.random() - 0.5) * offset,
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

  // Mock SVG map of Italy for demonstration
  const MapSVG = () => (
    <div className="relative h-full w-full overflow-hidden rounded-lg bg-gradient-to-br from-blue-100 to-blue-200">
      {/* Simplified Italy outline */}
      <svg
        viewBox="0 0 400 500"
        className="h-full w-full"
        style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}
      >
        {/* Italy shape (simplified) */}
        <path
          d="M200 50 Q220 60 230 80 L240 120 Q250 140 245 160 L240 200 Q235 220 240 240 L250 280 Q260 300 255 320 L250 360 Q245 380 250 400 L240 440 Q230 460 220 480 L180 490 Q160 485 140 480 L120 460 Q110 440 100 420 L90 380 Q85 360 90 340 L100 300 Q105 280 100 260 L95 220 Q90 200 100 180 L110 140 Q120 120 130 100 L150 70 Q170 50 200 50 Z"
          fill="#e5f3ff"
          stroke="#94a3b8"
          strokeWidth="2"
        />

        {/* Map markers */}
        {markers.map(marker => {
          const x = (marker.lng + 5) * 15; // Convert lng to x coordinate
          const y = 500 - (marker.lat - 35) * 12; // Convert lat to y coordinate
          const isSelected = selectedPartnerId === marker.id;

          return (
            <g key={marker.id}>
              {/* Marker pin */}
              <circle
                cx={x}
                cy={y}
                r={isSelected ? "8" : "6"}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:scale-110",
                  getMarkerColor(marker.partner.type),
                  isSelected && "ring-opacity-50 ring-4 ring-white"
                )}
                fill="currentColor"
                onClick={() => handleMarkerClick(marker)}
              />

              {/* Partner type icon */}
              <text
                x={x}
                y={y + 2}
                textAnchor="middle"
                fontSize="8"
                className="pointer-events-none"
              >
                {getPartnerTypeIcon(marker.partner.type)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );

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
        <MapSVG />
      </div>
    </div>
  );
};
