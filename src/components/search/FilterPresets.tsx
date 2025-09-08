"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Briefcase,
  Users,
  MapPin,
  Mountain,
  Utensils,
  Plane,
  Car,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  filters: {
    partnerTypes?: string[];
    locations?: string[];
    priceRange?: [number, number];
    cuisineTypes?: string[];
    tourTypes?: string[];
    serviceTypes?: string[];
    searchQuery?: string;
  };
}

interface FilterPresetsProps {
  onSelectPreset: (preset: FilterPreset) => void;
  activePreset?: string;
  className?: string;
}

const FILTER_PRESETS: FilterPreset[] = [
  {
    id: "romantic",
    name: "Romantico",
    description: "Hotel di lusso e ristoranti romantici",
    icon: <Heart className="h-4 w-4" />,
    color: "bg-pink-500/20 text-pink-200 border-pink-500/30",
    filters: {
      partnerTypes: ["hotel", "restaurant"],
      priceRange: [3, 5],
      cuisineTypes: ["Italian", "French"],
      searchQuery: "romantico lusso",
    },
  },
  {
    id: "business",
    name: "Business",
    description: "Hotel e servizi per viaggi di lavoro",
    icon: <Briefcase className="h-4 w-4" />,
    color: "bg-blue-500/20 text-blue-200 border-blue-500/30",
    filters: {
      partnerTypes: ["hotel", "shuttle"],
      priceRange: [2, 4],
      serviceTypes: ["Airport Transfer", "Business"],
      searchQuery: "business meeting",
    },
  },
  {
    id: "family",
    name: "Famiglia",
    description: "Adatto a famiglie con bambini",
    icon: <Users className="h-4 w-4" />,
    color: "bg-green-500/20 text-green-200 border-green-500/30",
    filters: {
      partnerTypes: ["hotel", "tour", "restaurant"],
      priceRange: [2, 4],
      tourTypes: ["Family", "Cultural"],
      searchQuery: "famiglia bambini",
    },
  },
  {
    id: "cultural",
    name: "Culturale",
    description: "Tour storici e culturali",
    icon: <MapPin className="h-4 w-4" />,
    color: "bg-purple-500/20 text-purple-200 border-purple-500/30",
    filters: {
      partnerTypes: ["tour", "restaurant"],
      tourTypes: ["Cultural", "Historical"],
      cuisineTypes: ["Traditional", "Italian"],
      searchQuery: "storia cultura",
    },
  },
  {
    id: "adventure",
    name: "Avventura",
    description: "Attività all'aperto e sport",
    icon: <Mountain className="h-4 w-4" />,
    color: "bg-orange-500/20 text-orange-200 border-orange-500/30",
    filters: {
      partnerTypes: ["tour", "hotel"],
      tourTypes: ["Adventure", "Outdoor"],
      priceRange: [2, 4],
      searchQuery: "avventura outdoor",
    },
  },
  {
    id: "food-wine",
    name: "Enogastronomia",
    description: "Ristoranti e tour gastronomici",
    icon: <Utensils className="h-4 w-4" />,
    color: "bg-yellow-500/20 text-yellow-200 border-yellow-500/30",
    filters: {
      partnerTypes: ["restaurant", "tour"],
      cuisineTypes: ["Italian", "Traditional", "Gourmet"],
      tourTypes: ["Gastronomic", "Wine"],
      priceRange: [3, 5],
      searchQuery: "gastronomia vino",
    },
  },
  {
    id: "budget",
    name: "Risparmia",
    description: "Opzioni economiche di qualità",
    icon: <Plane className="h-4 w-4" />,
    color: "bg-emerald-500/20 text-emerald-200 border-emerald-500/30",
    filters: {
      partnerTypes: ["hotel", "restaurant", "shuttle"],
      priceRange: [1, 2],
      searchQuery: "economico budget",
    },
  },
  {
    id: "luxury",
    name: "Lusso",
    description: "Esperienze premium e di lusso",
    icon: <Car className="h-4 w-4" />,
    color: "bg-amber-500/20 text-amber-200 border-amber-500/30",
    filters: {
      partnerTypes: ["hotel", "restaurant", "shuttle"],
      priceRange: [4, 5],
      cuisineTypes: ["Gourmet", "Michelin"],
      serviceTypes: ["Premium", "Luxury"],
      searchQuery: "lusso premium",
    },
  },
];

export const FilterPresets: React.FC<FilterPresetsProps> = ({
  onSelectPreset,
  activePreset,
  className,
}) => {
  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="mb-3 text-sm font-medium text-neutral-300">
        Scegli il tuo tipo di viaggio
      </h3>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {FILTER_PRESETS.map(preset => (
          <Button
            key={preset.id}
            variant="outline"
            onClick={() => onSelectPreset(preset)}
            className={cn(
              "flex h-auto min-h-[44px] flex-col items-center gap-2 p-3 text-center transition-all duration-200 hover:scale-105",
              preset.color,
              activePreset === preset.id &&
                "ring-primary-500 ring-2 ring-offset-1 ring-offset-neutral-900",
              "hover:border-opacity-50 border-neutral-700"
            )}
            aria-label={`Applica preset ${preset.name}: ${preset.description}`}
            aria-pressed={activePreset === preset.id}
          >
            <div className="flex items-center gap-2">
              {preset.icon}
              <span className="text-xs font-medium">{preset.name}</span>
            </div>
            <span className="line-clamp-2 text-xs opacity-80">
              {preset.description}
            </span>
          </Button>
        ))}
      </div>

      <div className="pt-2 text-center text-xs text-neutral-500">
        Seleziona un preset per applicare filtri ottimizzati
      </div>
    </div>
  );
};
