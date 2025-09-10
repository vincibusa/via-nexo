"use client";

import { usePlanning } from "@/contexts/PlanningContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  X,
  RefreshCw,
  MapPin,
  Calendar,
  Users,
  Hotel,
} from "lucide-react";
import { useState } from "react";

const categoryIcons = {
  hotel: Hotel,
  restaurant: Users,
  tour: Calendar,
  shuttle: MapPin,
} as const;

const categoryLabels = {
  hotel: "Hotel",
  restaurant: "Ristoranti",
  tour: "Tour",
  shuttle: "Trasporti",
} as const;

export function PlanningDisplay() {
  const {
    isPlanningMode,
    selectedPartners,
    currentPlan,
    isGeneratingPlan,
    error,
    exitPlanningMode,
    regeneratePlan,
    clearError,
  } = usePlanning();

  const [isExpanded, setIsExpanded] = useState(true);

  // Debug logs
  console.log("[PLANNING_DISPLAY] Debug:", {
    isPlanningMode,
    selectedPartners: selectedPartners.length,
    currentPlan: currentPlan ? "presente" : "null",
    isGeneratingPlan,
    error,
  });

  if (!isPlanningMode) {
    return null;
  }

  // Raggruppa partner per categoria
  const partnersByCategory = {
    hotel: selectedPartners.filter(p => p.type === "hotel"),
    restaurant: selectedPartners.filter(p => p.type === "restaurant"),
    tour: selectedPartners.filter(p => p.type === "tour"),
    shuttle: selectedPartners.filter(p => p.type === "shuttle"),
  };

  const handleRegenerate = async () => {
    await regeneratePlan(
      "Rigenera il piano di viaggio con una prospettiva diversa"
    );
  };

  return (
    <div className="mx-auto mb-6 w-full max-w-4xl">
      <Card className="from-primary-900/20 to-primary-800/20 border-primary-700/50 bg-gradient-to-br">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-primary-300 flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Piano di Viaggio Personalizzato
              <Badge variant="secondary" className="ml-2">
                {selectedPartners.length} partner
              </Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-primary-300 hover:text-primary-200"
              >
                {isExpanded ? "Minimizza" : "Espandi"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={exitPlanningMode}
                className="text-neutral-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="space-y-4">
            {/* Partner Selezionati */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {Object.entries(partnersByCategory).map(
                ([category, partners]) => {
                  if (partners.length === 0) return null;

                  const IconComponent =
                    categoryIcons[category as keyof typeof categoryIcons];
                  const label =
                    categoryLabels[category as keyof typeof categoryLabels];

                  return (
                    <div key={category} className="text-center">
                      <div className="mb-2 flex items-center justify-center gap-1">
                        <IconComponent className="text-primary-400 h-4 w-4" />
                        <span className="text-primary-300 text-sm font-medium">
                          {label}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {partners.map(partner => (
                          <div
                            key={partner.id}
                            className="truncate rounded bg-neutral-800/50 px-2 py-1 text-xs text-neutral-300"
                            title={partner.name}
                          >
                            {partner.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            {/* Errore */}
            {error && (
              <div className="rounded-lg border border-red-700/50 bg-red-900/20 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-red-300">
                    <h4 className="font-medium">Errore nella pianificazione</h4>
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearError}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Piano Generato */}
            {isGeneratingPlan ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-primary-300 flex items-center gap-3">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Generazione piano in corso...</span>
                </div>
              </div>
            ) : currentPlan ? (
              <div className="rounded-lg bg-neutral-800/30 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-medium text-white">Il Tuo Itinerario</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerate}
                    className="text-primary-400 border-primary-600 hover:bg-primary-600/20"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Rigenera
                  </Button>
                </div>
                <div
                  className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: currentPlan
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      .replace(/\n\n/g, "</p><p>")
                      .replace(/^(.*)$/gm, "<p>$1</p>"),
                  }}
                />
              </div>
            ) : (
              <div className="p-8 text-center text-neutral-400">
                <Sparkles className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>Nessun piano generato ancora</p>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
