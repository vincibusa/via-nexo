"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Sparkles, Loader2, X, Check, Wand2 } from "lucide-react";
import {
  extractFilterSuggestionsFromAIResponse,
  FilterSuggestions,
} from "@/lib/ai-filter-extractor";

interface AIAssistantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyFilters: (filters: FilterSuggestions) => void;
}

interface AISuggestion {
  partnerTypes?: string[];
  locations?: string[];
  priceRange?: [number, number];
  cuisineTypes?: string[];
  tourTypes?: string[];
  serviceTypes?: string[];
  searchQuery?: string;
}

export const AIAssistantModal = ({
  open,
  onOpenChange,
  onApplyFilters,
}: AIAssistantModalProps) => {
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);

  const interpretQuery = async (query: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Call the real AI backend API
      const response = await fetch("/api/search/intelligent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query,
          // We don't pass specific filters since we want the AI to suggest them
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Search failed");
      }

      // Extract filter suggestions from the AI response
      const aiResponse = data.message || "";
      const filterSuggestions =
        extractFilterSuggestionsFromAIResponse(aiResponse);

      // Also include the original query as search query
      filterSuggestions.searchQuery = query;

      setSuggestions(filterSuggestions);
    } catch (err) {
      console.error("AI Assistant error:", err);
      setError("Errore nell'interpretazione della richiesta. Riprova.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    await interpretQuery(input);
  };

  const handleApplyFilters = () => {
    if (suggestions) {
      onApplyFilters(suggestions);
      onOpenChange(false);
      setInput("");
      setSuggestions(null);
    }
  };

  const getPriceRangeLabel = (range: number) => {
    const labels = {
      1: "€",
      2: "€€",
      3: "€€€",
      4: "€€€€",
      5: "€€€€€",
    };
    return labels[range as keyof typeof labels] || "€€";
  };

  const getPartnerTypeLabel = (type: string) => {
    const labels = {
      hotel: "Hotel",
      restaurant: "Ristorante",
      tour: "Tour",
      shuttle: "Trasporto",
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-neutral-700 bg-neutral-900 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-purple-400" />
            AI Assistant
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            Descrivi ciò che cerchi in linguaggio naturale e l&apos;AI
            selezionerà automaticamente i filtri migliori
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Es: 'Hotel romantico a Roma con piscina e vista sul Colosseo'"
              value={input}
              onChange={e => setInput(e.target.value)}
              className="border-neutral-600 bg-neutral-800 text-white placeholder:text-neutral-400"
              disabled={isProcessing}
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>

          <Button
            type="submit"
            disabled={isProcessing || !input.trim()}
            className="w-full bg-purple-600 text-white hover:bg-purple-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analizzando...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Interpreta richiesta
              </>
            )}
          </Button>
        </form>

        {suggestions && (
          <Card className="border-neutral-700 bg-neutral-800/50 p-4">
            <h4 className="mb-3 text-sm font-medium text-neutral-300">
              Filtri suggeriti:
            </h4>

            <div className="space-y-3">
              {suggestions.partnerTypes &&
                suggestions.partnerTypes.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs text-neutral-400">
                      Tipo partner:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.partnerTypes.map(type => (
                        <Badge
                          key={type}
                          className="border-blue-500/30 bg-blue-500/20 text-blue-300"
                        >
                          {getPartnerTypeLabel(type)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              {suggestions.locations && suggestions.locations.length > 0 && (
                <div>
                  <p className="mb-2 text-xs text-neutral-400">Località:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.locations.map(location => (
                      <Badge
                        key={location}
                        className="border-green-500/30 bg-green-500/20 text-green-300"
                      >
                        {location}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {suggestions.priceRange && (
                <div>
                  <p className="mb-2 text-xs text-neutral-400">
                    Fascia prezzo:
                  </p>
                  <Badge className="border-yellow-500/30 bg-yellow-500/20 text-yellow-300">
                    {getPriceRangeLabel(suggestions.priceRange[0])} -{" "}
                    {getPriceRangeLabel(suggestions.priceRange[1])}
                  </Badge>
                </div>
              )}

              {suggestions.cuisineTypes &&
                suggestions.cuisineTypes.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs text-neutral-400">Cucina:</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.cuisineTypes.map(cuisine => (
                        <Badge
                          key={cuisine}
                          className="border-purple-500/30 bg-purple-500/20 text-purple-300"
                        >
                          {cuisine}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                onClick={handleApplyFilters}
                className="flex-1 bg-green-600 text-white hover:bg-green-700"
              >
                <Check className="mr-2 h-4 w-4" />
                Applica filtri
              </Button>
              <Button
                variant="outline"
                onClick={() => setSuggestions(null)}
                className="border-neutral-600 text-white hover:bg-neutral-700"
              >
                <X className="mr-2 h-4 w-4" />
                Modifica
              </Button>
            </div>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
};
