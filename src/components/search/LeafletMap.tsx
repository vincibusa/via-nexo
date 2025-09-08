"use client";

import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { PartnerData } from "@/types";

// Fix for default markers in React Leaflet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  partner: PartnerData;
}

interface LeafletMapProps {
  markers: MapMarker[];
  selectedPartnerId?: string;
  onMarkerClick: (marker: MapMarker) => void;
  getMarkerColor: (type: string) => string;
  getPartnerTypeIcon: (type: string) => string;
}

// Custom marker icons based on partner type
const createCustomIcon = (
  type: string,
  isSelected: boolean = false,
  getMarkerColor: (type: string) => string
) => {
  const getTypeEmoji = (partnerType: string) => {
    switch (partnerType) {
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

  const color = getMarkerColor(type);
  const emoji = getTypeEmoji(type);
  const size = isSelected ? 40 : 30;

  return L.divIcon({
    className: "custom-div-icon",
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${size * 0.4}px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        ${isSelected ? "transform: scale(1.1); box-shadow: 0 0 0 3px rgba(255,255,255,0.5);" : ""}
        transition: all 0.2s ease;
      ">
        ${emoji}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Component to fit map bounds when markers change
const FitBounds: React.FC<{ markers: MapMarker[] }> = ({ markers }) => {
  const map = useMap() as L.Map;

  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, markers]);

  return null;
};

const LeafletMap: React.FC<LeafletMapProps> = ({
  markers,
  selectedPartnerId,
  onMarkerClick,
  getMarkerColor,
  getPartnerTypeIcon,
}) => {
  const mapRef = useRef<L.Map | null>(null);

  // Default center on Italy
  const defaultCenter: [number, number] = [41.8719, 12.5674]; // Rome coordinates
  const defaultZoom = 6;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: "100%", width: "100%" }}
        className="rounded-lg"
        ref={mapRef}
        maxZoom={18}
        minZoom={5}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds markers={markers} />

        {markers.map(marker => {
          const isSelected = selectedPartnerId === marker.id;
          return (
            <Marker
              key={marker.id}
              position={[marker.lat, marker.lng]}
              icon={createCustomIcon(
                marker.partner.type,
                isSelected,
                getMarkerColor
              )}
              eventHandlers={{
                click: () => onMarkerClick(marker),
              }}
            >
              <Popup>
                <div className="min-w-[200px] p-2">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-lg">
                      {getPartnerTypeIcon(marker.partner.type)}
                    </span>
                    <h3 className="text-sm font-semibold">
                      {marker.partner.name}
                    </h3>
                  </div>
                  {marker.partner.location && (
                    <p className="mb-1 text-xs text-gray-600">
                      📍 {marker.partner.location}
                    </p>
                  )}
                  {marker.partner.description && (
                    <p className="line-clamp-3 text-xs text-gray-700">
                      {marker.partner.description}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default LeafletMap;
