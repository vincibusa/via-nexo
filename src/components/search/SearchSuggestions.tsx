"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Clock, TrendingUp, History } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchSuggestion {
  id: string;
  type: "location" | "activity" | "partner" | "trending" | "history";
  text: string;
  category?: string;
  count?: number;
}

interface SearchSuggestionsProps {
  query: string;
  onSuggestionSelect: (suggestion: string) => void;
  isVisible: boolean;
  className?: string;
}

const MOCK_SUGGESTIONS: SearchSuggestion[] = [
  // Popular locations
  { id: "1", type: "location", text: "Roma", category: "Città", count: 156 },
  { id: "2", type: "location", text: "Milano", category: "Città", count: 89 },
  { id: "3", type: "location", text: "Firenze", category: "Città", count: 127 },
  { id: "4", type: "location", text: "Napoli", category: "Città", count: 78 },
  { id: "5", type: "location", text: "Venezia", category: "Città", count: 94 },

  // Activities
  {
    id: "6",
    type: "activity",
    text: "tour gastronomico",
    category: "Attività",
    count: 34,
  },
  {
    id: "7",
    type: "activity",
    text: "visita guidata",
    category: "Attività",
    count: 67,
  },
  {
    id: "8",
    type: "activity",
    text: "escursione giornaliera",
    category: "Attività",
    count: 45,
  },
  {
    id: "9",
    type: "activity",
    text: "aperitivo panoramico",
    category: "Attività",
    count: 23,
  },

  // Partner types
  {
    id: "10",
    type: "partner",
    text: "hotel di lusso",
    category: "Alloggi",
    count: 43,
  },
  {
    id: "11",
    type: "partner",
    text: "ristorante romantico",
    category: "Ristorazione",
    count: 56,
  },
  {
    id: "12",
    type: "partner",
    text: "trattoria tradizionale",
    category: "Ristorazione",
    count: 38,
  },

  // Trending
  {
    id: "13",
    type: "trending",
    text: "weekend romantico",
    category: "Trending",
    count: 89,
  },
  {
    id: "14",
    type: "trending",
    text: "viaggio business",
    category: "Trending",
    count: 67,
  },
  {
    id: "15",
    type: "trending",
    text: "vacanza famiglia",
    category: "Trending",
    count: 123,
  },
];

const RECENT_SEARCHES = [
  "Roma centro storico",
  "hotel 4 stelle Milano",
  "tour Colosseo",
  "ristorante vista mare Napoli",
];

export const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  query,
  onSuggestionSelect,
  isVisible,
  className,
}) => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    // Load recent searches from localStorage
    const stored = localStorage.getItem("via-nexo-recent-searches");
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    } else {
      setRecentSearches(RECENT_SEARCHES);
    }
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      // Show trending and recent when no query
      setSuggestions(
        MOCK_SUGGESTIONS.filter(s => s.type === "trending").slice(0, 4)
      );
      return;
    }

    // Filter suggestions based on query
    const filtered = MOCK_SUGGESTIONS.filter(
      suggestion =>
        suggestion.text.toLowerCase().includes(query.toLowerCase()) ||
        suggestion.category?.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 6);

    setSuggestions(filtered);
  }, [query]);

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case "location":
        return <MapPin className="h-4 w-4 text-blue-400" />;
      case "activity":
        return <Clock className="h-4 w-4 text-green-400" />;
      case "partner":
        return <Search className="h-4 w-4 text-purple-400" />;
      case "trending":
        return <TrendingUp className="h-4 w-4 text-orange-400" />;
      case "history":
        return <History className="h-4 w-4 text-neutral-400" />;
      default:
        return <Search className="h-4 w-4 text-neutral-400" />;
    }
  };

  const handleSuggestionClick = useCallback(
    (suggestionText: string) => {
      // Add to recent searches
      const updated = [
        suggestionText,
        ...recentSearches.filter(s => s !== suggestionText),
      ].slice(0, 10);
      setRecentSearches(updated);
      localStorage.setItem("via-nexo-recent-searches", JSON.stringify(updated));

      onSuggestionSelect(suggestionText);
    },
    [recentSearches, onSuggestionSelect]
  );

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return;

      const allSuggestions = [
        ...suggestions.map(s => s.text),
        ...(query ? [] : recentSearches.slice(0, 4)),
      ];

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < allSuggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(prev => (prev > -1 ? prev - 1 : prev));
          break;
        case "Enter":
          if (selectedIndex >= 0 && allSuggestions[selectedIndex]) {
            e.preventDefault();
            handleSuggestionClick(allSuggestions[selectedIndex]);
          }
          break;
        case "Escape":
          setSelectedIndex(-1);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    isVisible,
    suggestions,
    recentSearches,
    query,
    selectedIndex,
    handleSuggestionClick,
  ]);

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions, query]);

  if (!isVisible) return null;

  return (
    <Card
      className={cn(
        "absolute top-full right-0 left-0 z-50 mt-2 border-neutral-600 bg-neutral-800/95 backdrop-blur-sm",
        className
      )}
    >
      <CardContent className="p-0">
        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="border-b border-neutral-700 p-4">
            <h4 className="mb-3 text-sm font-medium text-neutral-300">
              {query ? "Suggerimenti" : "Di tendenza"}
            </h4>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={suggestion.id}
                  variant="ghost"
                  onClick={() => handleSuggestionClick(suggestion.text)}
                  className={cn(
                    "w-full justify-start p-2 text-left hover:bg-neutral-700",
                    selectedIndex === index && "bg-neutral-700"
                  )}
                  aria-label={`${suggestion.text} in ${suggestion.category}, ${suggestion.count} risultati`}
                >
                  <div className="flex w-full items-center gap-3">
                    {getSuggestionIcon(suggestion.type)}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-white">
                          {suggestion.text}
                        </span>
                        {suggestion.category && (
                          <Badge
                            variant="outline"
                            className="border-neutral-600 text-xs text-neutral-400"
                          >
                            {suggestion.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {suggestion.count && (
                      <span className="text-xs text-neutral-400">
                        {suggestion.count} risultati
                      </span>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Recent Searches */}
        {!query && recentSearches.length > 0 && (
          <div className="p-4">
            <h4 className="mb-3 text-sm font-medium text-neutral-300">
              Ricerche recenti
            </h4>
            <div className="space-y-2">
              {recentSearches.slice(0, 4).map((search, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  onClick={() => handleSuggestionClick(search)}
                  className="w-full justify-start p-2 text-left hover:bg-neutral-700"
                >
                  <History className="mr-3 h-4 w-4 text-neutral-400" />
                  <span className="truncate text-neutral-300">{search}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="border-t border-neutral-700 p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSuggestionClick("hotel Roma")}
              className="border-neutral-600 bg-neutral-700/50 text-neutral-300 hover:bg-neutral-600"
            >
              🏨 Hotel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSuggestionClick("ristorante Milano")}
              className="border-neutral-600 bg-neutral-700/50 text-neutral-300 hover:bg-neutral-600"
            >
              🍽️ Ristoranti
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSuggestionClick("tour Firenze")}
              className="border-neutral-600 bg-neutral-700/50 text-neutral-300 hover:bg-neutral-600"
            >
              🗺️ Tour
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSuggestionClick("trasporto aeroporto")}
              className="border-neutral-600 bg-neutral-700/50 text-neutral-300 hover:bg-neutral-600"
            >
              🚐 Trasporti
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
