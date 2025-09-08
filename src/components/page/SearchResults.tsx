"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Image from "next/image";
import {
  Search,
  Filter,
  MapPin,
  Clock,
  Euro,
  Star,
  X,
  Sparkles,
} from "lucide-react";
import { useTraditionalSearch } from "@/hooks/useTraditionalSearch";
import { AIAssistantModal } from "@/components/search/AIAssistantModal";
import { FilterSuggestions } from "@/lib/ai-filter-extractor";
import { SearchSuggestions } from "@/components/search/SearchSuggestions";
import { MapView } from "@/components/search/MapView";
import { ChevronDown, ChevronUp, Map, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export const SearchResults = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [priceRange, setPriceRange] = useState([1, 5]);
  const [selectedPartnerTypes, setSelectedPartnerTypes] = useState<string[]>(
    []
  );
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedCuisineTypes, setSelectedCuisineTypes] = useState<string[]>(
    []
  );
  const [selectedTourTypes, setSelectedTourTypes] = useState<string[]>([]);
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<string[]>(
    []
  );
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [currentFilters, setCurrentFilters] = useState({
    destination: "",
    duration: "",
    budget: "",
    type: "",
  });
  const [isInitializing, setIsInitializing] = useState(true);
  const [urlUpdateQueue, setUrlUpdateQueue] = useState<{
    search?: string;
    partnerTypes?: string[];
    locations?: string[];
    priceRange?: [number, number];
    cuisineTypes?: string[];
    tourTypes?: string[];
    serviceTypes?: string[];
    sortBy?: string;
    viewMode?: "list" | "map";
    showAdvanced?: boolean;
  } | null>(null);

  // Traditional search hook
  const {
    results: partners,
    loading,
    total,
    availableLocations,
    availableCuisineTypes,
    availableTourTypes,
    availableServiceTypes,
    loadingOptions,
    searchPartners,
    loadFilterOptions,
    error,
  } = useTraditionalSearch();

  // Debounced search hook
  const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Load filter options on mount
  useEffect(() => {
    loadFilterOptions();
  }, []); // Only run once on mount

  // Initialize filter states from URL parameters on mount
  useEffect(() => {
    console.group("🔄 Initializing filters from URL");

    // Get URL params
    const searchQueryFromURL = searchParams.get("q") || "";
    const partnerTypesFromURL =
      searchParams.get("types")?.split(",").filter(Boolean) || [];
    const locationsFromURL =
      searchParams.get("locations")?.split(",").filter(Boolean) || [];
    const cuisineTypesFromURL =
      searchParams.get("cuisine_types")?.split(",").filter(Boolean) || [];
    const tourTypesFromURL =
      searchParams.get("tour_types")?.split(",").filter(Boolean) || [];
    const serviceTypesFromURL =
      searchParams.get("service_types")?.split(",").filter(Boolean) || [];
    const priceMinFromURL = parseInt(searchParams.get("price_min") || "1");
    const priceMaxFromURL = parseInt(searchParams.get("price_max") || "5");
    const sortByFromURL = searchParams.get("sort") || "relevance";
    const viewModeFromURL =
      searchParams.get("view_mode") === "map" ? "map" : "list";
    const showAdvancedFromURL = searchParams.get("show_advanced") === "true";
    const destination = searchParams.get("destination") || "";
    const duration = searchParams.get("duration") || "";
    const budget = searchParams.get("budget") || "";
    const type = searchParams.get("type") || "";

    console.log("📥 URL params loaded:", {
      searchQuery: searchQueryFromURL,
      partnerTypes: partnerTypesFromURL,
      locations: locationsFromURL,
      cuisineTypes: cuisineTypesFromURL,
      tourTypes: tourTypesFromURL,
      serviceTypes: serviceTypesFromURL,
      priceRange: [priceMinFromURL, priceMaxFromURL],
      sortBy: sortByFromURL,
      viewMode: viewModeFromURL,
      showAdvanced: showAdvancedFromURL,
    });

    // Set initial states from URL
    setSearchQuery(searchQueryFromURL);
    setSelectedPartnerTypes(partnerTypesFromURL);
    setSelectedLocations(locationsFromURL);
    setSelectedCuisineTypes(cuisineTypesFromURL);
    setSelectedTourTypes(tourTypesFromURL);
    setSelectedServiceTypes(serviceTypesFromURL);
    setPriceRange([priceMinFromURL, priceMaxFromURL]);
    setSortBy(sortByFromURL);
    setViewMode(viewModeFromURL);
    setShowAdvancedFilters(showAdvancedFromURL);
    setCurrentFilters({ destination, duration, budget, type });

    // Map legacy parameters to new filter states if new parameters are not present
    if (locationsFromURL.length === 0 && destination) {
      setSelectedLocations([destination]);
    }

    if (partnerTypesFromURL.length === 0 && type) {
      setSelectedPartnerTypes([mapLegacyTypeToPartnerType(type)]);
    }

    if (priceMinFromURL === 1 && priceMaxFromURL === 5 && budget) {
      const priceRangeMap: Record<string, [number, number]> = {
        low: [1, 2],
        mid: [2, 3],
        high: [3, 4],
        luxury: [4, 5],
      };
      setPriceRange(priceRangeMap[budget] || [1, 5]);
    }

    console.groupEnd();

    // Mark initialization as complete after a short delay
    setTimeout(() => setIsInitializing(false), 100);
  }, [searchParams]);

  // Perform search when filters change
  useEffect(() => {
    // Skip search during initialization to avoid infinite loops
    if (isInitializing) {
      console.log("⏳ Skipping search during initialization");
      return;
    }

    const performSearch = async () => {
      // Build search filters
      const filters = {
        query: debouncedSearchQuery,
        partnerTypes:
          selectedPartnerTypes.length > 0
            ? selectedPartnerTypes
            : currentFilters.type
              ? [mapLegacyTypeToPartnerType(currentFilters.type)]
              : [],
        priceRange: priceRange as [number, number],
        locations:
          selectedLocations.length > 0
            ? selectedLocations
            : currentFilters.destination
              ? [currentFilters.destination]
              : [],
        cuisineTypes: selectedCuisineTypes,
        tourTypes: selectedTourTypes,
        serviceTypes: selectedServiceTypes,
        sortBy,
      };

      console.log("🔍 Performing search with filters:", filters);
      await searchPartners(filters);
    };

    performSearch();
  }, [
    isInitializing,
    debouncedSearchQuery,
    priceRange,
    selectedPartnerTypes,
    selectedLocations,
    selectedCuisineTypes,
    selectedTourTypes,
    selectedServiceTypes,
    sortBy,
    currentFilters.destination,
    currentFilters.type,
  ]); // Removed searchPartners and searchParams to avoid infinite loop

  // Run initial search after initialization is complete
  useEffect(() => {
    if (!isInitializing) {
      console.log("🚀 Running initial search after initialization");
      const filters = {
        query: debouncedSearchQuery,
        partnerTypes:
          selectedPartnerTypes.length > 0
            ? selectedPartnerTypes
            : currentFilters.type
              ? [mapLegacyTypeToPartnerType(currentFilters.type)]
              : [],
        priceRange: priceRange as [number, number],
        locations:
          selectedLocations.length > 0
            ? selectedLocations
            : currentFilters.destination
              ? [currentFilters.destination]
              : [],
        cuisineTypes: selectedCuisineTypes,
        tourTypes: selectedTourTypes,
        serviceTypes: selectedServiceTypes,
        sortBy,
      };

      searchPartners(filters);
    }
  }, [isInitializing]); // Only run when initialization completes

  // Helper function to map legacy types to partner types
  const mapLegacyTypeToPartnerType = (legacyType: string): string => {
    const mapping: Record<string, string> = {
      family: "hotel",
      romantic: "hotel",
      culture: "tour",
      adventure: "tour",
      business: "hotel",
      relaxation: "hotel",
    };
    return mapping[legacyType] || "hotel";
  };

  const getPartnerTypeLabel = (type: string) => {
    const labels = {
      hotel: "Hotels",
      restaurant: "Ristoranti",
      tour: "Tour",
      shuttle: "Trasporti",
    };
    return labels[type as keyof typeof labels] || type;
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

  const getBudgetLabel = (budget: string) => {
    const labels = {
      low: "€ Economico",
      mid: "€€ Medio",
      high: "€€€ Alto",
      luxury: "€€€€ Lusso",
    };
    return labels[budget as keyof typeof labels] || budget;
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      romantic: "Romantico",
      family: "Famiglia",
      business: "Business",
      adventure: "Avventura",
      culture: "Culturale",
      relaxation: "Relax",
    };
    return labels[type as keyof typeof labels] || type;
  };

  // Function to queue URL parameter updates
  const updateURLParams = (filters: {
    search?: string;
    partnerTypes?: string[];
    locations?: string[];
    priceRange?: [number, number];
    cuisineTypes?: string[];
    tourTypes?: string[];
    serviceTypes?: string[];
    sortBy?: string;
    viewMode?: "list" | "map";
    showAdvanced?: boolean;
  }) => {
    console.log("🔗 Queuing URL update:", filters);
    setUrlUpdateQueue(filters);
  };

  // Use effect to handle URL updates from queue
  useEffect(() => {
    if (urlUpdateQueue) {
      console.group("🔗 Processing URL update queue");

      const params = new URLSearchParams(searchParams.toString());
      const filters = urlUpdateQueue;

      // Update search query
      if (filters.search !== undefined) {
        if (filters.search) {
          params.set("q", filters.search);
        } else {
          params.delete("q");
        }
      }

      // Update partner types
      if (filters.partnerTypes !== undefined) {
        if (filters.partnerTypes.length > 0) {
          params.set("types", filters.partnerTypes.join(","));
        } else {
          params.delete("types");
        }
      }

      // Update locations
      if (filters.locations !== undefined) {
        if (filters.locations.length > 0) {
          params.set("locations", filters.locations.join(","));
        } else {
          params.delete("locations");
        }
      }

      // Update cuisine types
      if (filters.cuisineTypes !== undefined) {
        if (filters.cuisineTypes.length > 0) {
          params.set("cuisine_types", filters.cuisineTypes.join(","));
        } else {
          params.delete("cuisine_types");
        }
      }

      // Update tour types
      if (filters.tourTypes !== undefined) {
        if (filters.tourTypes.length > 0) {
          params.set("tour_types", filters.tourTypes.join(","));
        } else {
          params.delete("tour_types");
        }
      }

      // Update service types
      if (filters.serviceTypes !== undefined) {
        if (filters.serviceTypes.length > 0) {
          params.set("service_types", filters.serviceTypes.join(","));
        } else {
          params.delete("service_types");
        }
      }

      // Update price range
      if (filters.priceRange !== undefined) {
        params.set("price_min", filters.priceRange[0].toString());
        params.set("price_max", filters.priceRange[1].toString());
      }

      // Update sort by
      if (filters.sortBy !== undefined) {
        if (filters.sortBy && filters.sortBy !== "relevance") {
          params.set("sort", filters.sortBy);
        } else {
          params.delete("sort");
        }
      }

      // Update view mode
      if (filters.viewMode !== undefined) {
        if (filters.viewMode !== "list") {
          params.set("view_mode", filters.viewMode);
        } else {
          params.delete("view_mode");
        }
      }

      // Update show advanced
      if (filters.showAdvanced !== undefined) {
        if (filters.showAdvanced) {
          params.set("show_advanced", "true");
        } else {
          params.delete("show_advanced");
        }
      }

      const newUrl = `/search?${params.toString()}`;
      console.log("📤 Updated URL:", newUrl);

      // Update URL without page reload
      router.replace(newUrl, { scroll: false });

      // Clear the queue
      setUrlUpdateQueue(null);
      console.groupEnd();
    }
  }, [urlUpdateQueue, router, searchParams]);

  // Filter handlers
  const handleSortChange = (value: string) => {
    setSortBy(value);
    updateURLParams({ sortBy: value });
  };

  const handlePartnerTypeChange = (type: string, checked: boolean) => {
    setSelectedPartnerTypes(prev => {
      const newTypes = checked ? [...prev, type] : prev.filter(t => t !== type);
      updateURLParams({ partnerTypes: newTypes });
      return newTypes;
    });
  };

  const handleLocationChange = (location: string, checked: boolean) => {
    setSelectedLocations(prev => {
      const newLocations = checked
        ? [...prev, location]
        : prev.filter(l => l !== location);
      updateURLParams({ locations: newLocations });
      return newLocations;
    });
  };

  const handleCuisineTypeChange = (cuisine: string, checked: boolean) => {
    console.log("🍽️ Cuisine type changed:", { cuisine, checked });
    setSelectedCuisineTypes(prev => {
      const newCuisines = checked
        ? [...prev, cuisine]
        : prev.filter(c => c !== cuisine);
      updateURLParams({ cuisineTypes: newCuisines });
      return newCuisines;
    });
  };

  const handleTourTypeChange = (tourType: string, checked: boolean) => {
    console.log("🎯 Tour type changed:", { tourType, checked });
    setSelectedTourTypes(prev => {
      const newTourTypes = checked
        ? [...prev, tourType]
        : prev.filter(t => t !== tourType);
      updateURLParams({ tourTypes: newTourTypes });
      return newTourTypes;
    });
  };

  const handleServiceTypeChange = (serviceType: string, checked: boolean) => {
    console.log("🚌 Service type changed:", { serviceType, checked });
    setSelectedServiceTypes(prev => {
      const newServiceTypes = checked
        ? [...prev, serviceType]
        : prev.filter(s => s !== serviceType);
      updateURLParams({ serviceTypes: newServiceTypes });
      return newServiceTypes;
    });
  };

  const handlePriceRangeChange = (newRange: number[]) => {
    setPriceRange(newRange as [number, number]);
    updateURLParams({ priceRange: newRange as [number, number] });
  };

  const clearAllFilters = () => {
    console.log("🧹 Clearing all filters");
    setSearchQuery("");
    setPriceRange([1, 5]);
    setSelectedPartnerTypes([]);
    setSelectedLocations([]);
    setSelectedCuisineTypes([]);
    setSelectedTourTypes([]);
    setSelectedServiceTypes([]);
    setSortBy("relevance");

    // Clear all URL parameters
    updateURLParams({
      search: "",
      partnerTypes: [],
      locations: [],
      priceRange: [1, 5],
      cuisineTypes: [],
      tourTypes: [],
      serviceTypes: [],
      sortBy: "relevance",
    });
  };

  const removeFilter = (filterType: string, value?: string) => {
    switch (filterType) {
      case "search":
        setSearchQuery("");
        updateURLParams({ search: "" });
        break;
      case "price":
        setPriceRange([1, 5]);
        updateURLParams({ priceRange: [1, 5] });
        break;
      case "partnerType":
        if (value) {
          setSelectedPartnerTypes(prev => {
            const newTypes = prev.filter(t => t !== value);
            updateURLParams({ partnerTypes: newTypes });
            return newTypes;
          });
        }
        break;
      case "location":
        if (value) {
          setSelectedLocations(prev => {
            const newLocations = prev.filter(l => l !== value);
            updateURLParams({ locations: newLocations });
            return newLocations;
          });
        }
        break;
      case "cuisineType":
        if (value) {
          console.log("🍽️ Removing cuisine filter:", value);
          setSelectedCuisineTypes(prev => {
            const newCuisines = prev.filter(c => c !== value);
            updateURLParams({ cuisineTypes: newCuisines });
            return newCuisines;
          });
        }
        break;
      case "tourType":
        if (value) {
          console.log("🎯 Removing tour type filter:", value);
          setSelectedTourTypes(prev => {
            const newTourTypes = prev.filter(t => t !== value);
            updateURLParams({ tourTypes: newTourTypes });
            return newTourTypes;
          });
        }
        break;
      case "serviceType":
        if (value) {
          console.log("🚌 Removing service type filter:", value);
          setSelectedServiceTypes(prev => {
            const newServiceTypes = prev.filter(s => s !== value);
            updateURLParams({ serviceTypes: newServiceTypes });
            return newServiceTypes;
          });
        }
        break;
    }
  };

  const handleAISuggestions = (suggestions: FilterSuggestions) => {
    if (suggestions.partnerTypes) {
      setSelectedPartnerTypes(suggestions.partnerTypes);
    }
    if (suggestions.locations) {
      setSelectedLocations(suggestions.locations);
    }
    if (suggestions.priceRange) {
      setPriceRange(suggestions.priceRange);
    }
    if (suggestions.cuisineTypes) {
      setSelectedCuisineTypes(suggestions.cuisineTypes);
    }
    if (suggestions.tourTypes) {
      setSelectedTourTypes(suggestions.tourTypes);
    }
    if (suggestions.serviceTypes) {
      setSelectedServiceTypes(suggestions.serviceTypes);
    }
    if (suggestions.searchQuery) {
      setSearchQuery(suggestions.searchQuery);
    }

    // Update URL parameters with all AI suggestions
    updateURLParams({
      search: suggestions.searchQuery,
      partnerTypes: suggestions.partnerTypes,
      locations: suggestions.locations,
      priceRange: suggestions.priceRange,
      cuisineTypes: suggestions.cuisineTypes,
      tourTypes: suggestions.tourTypes,
      serviceTypes: suggestions.serviceTypes,
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? "fill-yellow-400 text-yellow-400"
            : "text-neutral-600"
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      {/* Top Search Bar */}
      <div className="sticky top-0 z-10 border-b border-neutral-700 bg-neutral-900/90 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 lg:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-neutral-400" />
              <Input
                placeholder="Cerca destinazioni, hotel, attività..."
                value={searchQuery}
                onChange={e => {
                  console.log("🔍 Search query changed:", {
                    from: searchQuery,
                    to: e.target.value,
                  });
                  setSearchQuery(e.target.value);
                  updateURLParams({ search: e.target.value });
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => {
                  // Delay hiding to allow suggestion clicks
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                className="focus:border-primary-500 border-neutral-600 bg-neutral-800 pl-10 text-white placeholder:text-neutral-400"
                aria-label="Campo di ricerca per destinazioni, hotel e attività"
                aria-describedby="search-suggestions"
                aria-expanded={showSuggestions}
                aria-autocomplete="list"
                role="combobox"
              />

              <SearchSuggestions
                query={searchQuery}
                onSuggestionSelect={suggestion => {
                  setSearchQuery(suggestion);
                  updateURLParams({ search: suggestion });
                  setShowSuggestions(false);
                }}
                isVisible={showSuggestions}
              />
            </div>

            {/* Controls Row */}
            <div className="flex flex-row items-center gap-2 sm:gap-3">
              <Button
                onClick={() => setIsAIAssistantOpen(true)}
                variant="outline"
                size="sm"
                className="flex-shrink-0 border-purple-600 bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 hover:text-white"
              >
                <Sparkles className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">AI Assistant</span>
              </Button>

              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="min-w-24 flex-1 border-neutral-600 bg-neutral-800 text-white sm:w-36 lg:w-40">
                  <SelectValue placeholder="Ordina per" />
                </SelectTrigger>
                <SelectContent className="border-neutral-600 bg-neutral-800 text-white">
                  <SelectItem value="relevance">Rilevanza</SelectItem>
                  <SelectItem value="name-asc">Nome A-Z</SelectItem>
                  <SelectItem value="name-desc">Nome Z-A</SelectItem>
                  <SelectItem value="price-low">Prezzo ↗</SelectItem>
                  <SelectItem value="price-high">Prezzo ↘</SelectItem>
                  <SelectItem value="rating">Valutazione</SelectItem>
                  <SelectItem value="recent">Più recenti</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="flex flex-shrink-0 items-center overflow-hidden rounded-md border border-neutral-600 bg-neutral-800">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  onClick={() => {
                    console.log("📋 View mode changed to: list");
                    setViewMode("list");
                    updateURLParams({ viewMode: "list" });
                  }}
                  className={cn(
                    "min-h-[36px] rounded-none border-0 px-2 text-xs sm:min-h-[44px] sm:px-4 sm:text-sm",
                    viewMode === "list"
                      ? "bg-primary-600 text-white"
                      : "bg-transparent text-neutral-300 hover:bg-neutral-700"
                  )}
                >
                  <List className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Lista</span>
                </Button>
                <Button
                  variant={viewMode === "map" ? "default" : "ghost"}
                  onClick={() => {
                    console.log("🗺️ View mode changed to: map");
                    setViewMode("map");
                    updateURLParams({ viewMode: "map" });
                  }}
                  className={cn(
                    "min-h-[36px] rounded-none border-0 px-2 text-xs sm:min-h-[44px] sm:px-4 sm:text-sm",
                    viewMode === "map"
                      ? "bg-primary-600 text-white"
                      : "bg-transparent text-neutral-300 hover:bg-neutral-700"
                  )}
                >
                  <Map className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Mappa</span>
                </Button>
              </div>

              <Sheet
                open={isFilterSheetOpen}
                onOpenChange={setIsFilterSheetOpen}
              >
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 border-neutral-600 bg-neutral-800 text-white hover:bg-neutral-700 lg:hidden"
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-80 border-neutral-700 bg-neutral-900"
                >
                  <SheetHeader>
                    <SheetTitle className="text-white">
                      Filtra risultati
                    </SheetTitle>
                    <SheetDescription className="text-neutral-400">
                      Personalizza la tua ricerca con i filtri disponibili
                    </SheetDescription>
                  </SheetHeader>
                  <div className="px-6 py-8">
                    {/* Mobile Filters - Same as sidebar */}
                    {/* Partner Type Filter */}
                    <div className="mb-6">
                      <h4 className="mb-3 text-sm font-medium text-neutral-300">
                        Tipo di Partner
                      </h4>
                      <div className="space-y-2">
                        {[
                          { value: "hotel", label: "Hotels" },
                          { value: "restaurant", label: "Ristoranti" },
                          { value: "tour", label: "Tour" },
                          { value: "shuttle", label: "Trasporti" },
                        ].map(type => (
                          <label
                            key={type.value}
                            className="flex items-center gap-2 text-sm text-neutral-300"
                          >
                            <input
                              type="checkbox"
                              className="rounded border-neutral-600 bg-neutral-800"
                              checked={selectedPartnerTypes.includes(
                                type.value
                              )}
                              onChange={e =>
                                handlePartnerTypeChange(
                                  type.value,
                                  e.target.checked
                                )
                              }
                            />
                            {type.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Price Range */}
                    <div className="mb-6">
                      <h4 className="mb-3 text-sm font-medium text-neutral-300">
                        Fascia di prezzo
                      </h4>
                      <div className="px-3">
                        <Slider
                          value={priceRange}
                          onValueChange={handlePriceRangeChange}
                          min={1}
                          max={5}
                          step={1}
                          className="mb-3"
                        />
                        <div className="flex justify-between text-sm text-neutral-400">
                          <span>{getPriceRangeLabel(priceRange[0])}</span>
                          <span>{getPriceRangeLabel(priceRange[1])}</span>
                        </div>
                      </div>
                    </div>

                    {/* Clear Filters Button */}
                    <div className="pt-4">
                      <Button
                        onClick={clearAllFilters}
                        variant="outline"
                        className="w-full border-neutral-600 bg-transparent text-white hover:bg-neutral-800"
                      >
                        Rimuovi tutti i filtri
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto flex gap-4 px-4 py-6 lg:gap-6 lg:px-6">
        {/* Left Sidebar Filters */}
        <div className="hidden w-72 shrink-0 lg:block xl:w-80 2xl:w-96">
          <Card className="sticky top-24 border-neutral-700 bg-neutral-900/50 p-4 xl:p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">
              Filtra risultati
            </h3>

            {/* Advanced Filters Toggle */}
            <div className="mb-4">
              <Button
                variant="ghost"
                onClick={() => {
                  console.log(
                    "⚙️ Advanced filters toggled:",
                    !showAdvancedFilters
                  );
                  setShowAdvancedFilters(!showAdvancedFilters);
                  updateURLParams({ showAdvanced: !showAdvancedFilters });
                }}
                className="w-full justify-between p-0 text-neutral-300 hover:text-white"
              >
                <span className="text-sm font-medium">Filtri avanzati</span>
                {showAdvancedFilters ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Advanced Filters Section */}
            {showAdvancedFilters && (
              <div className="space-y-6">
                {/* Current Filters */}
                {(currentFilters.destination ||
                  currentFilters.duration ||
                  currentFilters.budget ||
                  currentFilters.type) && (
                  <div className="mb-6">
                    <h4 className="mb-3 text-sm font-medium text-neutral-300">
                      Filtri attivi
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {currentFilters.destination && (
                        <Badge
                          variant="secondary"
                          className="bg-primary-500/20 text-primary-300"
                        >
                          <MapPin className="mr-1 h-3 w-3" />
                          {currentFilters.destination}
                        </Badge>
                      )}
                      {selectedPartnerTypes.length > 0 &&
                        selectedPartnerTypes.map(type => (
                          <Badge
                            key={type}
                            variant="secondary"
                            className="bg-blue-500/20 text-blue-300"
                          >
                            <Clock className="mr-1 h-3 w-3" />
                            {getPartnerTypeLabel(type)}
                            <button
                              onClick={() => removeFilter("partnerType", type)}
                              className="ml-1 rounded hover:bg-blue-600/20"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      {currentFilters.budget && (
                        <Badge
                          variant="secondary"
                          className="bg-green-500/20 text-green-300"
                        >
                          <Euro className="mr-1 h-3 w-3" />
                          {getBudgetLabel(currentFilters.budget)}
                        </Badge>
                      )}
                      {currentFilters.type && (
                        <Badge
                          variant="secondary"
                          className="bg-purple-500/20 text-purple-300"
                        >
                          {getTypeLabel(currentFilters.type)}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Price Range */}
                <div className="mb-6">
                  <h4 className="mb-3 text-sm font-medium text-neutral-300">
                    Fascia di prezzo
                  </h4>
                  <div className="px-3">
                    <Slider
                      value={priceRange}
                      onValueChange={handlePriceRangeChange}
                      min={1}
                      max={5}
                      step={1}
                      className="mb-3"
                    />
                    <div className="flex justify-between text-sm text-neutral-400">
                      <span>{getPriceRangeLabel(priceRange[0])}</span>
                      <span>{getPriceRangeLabel(priceRange[1])}</span>
                    </div>
                  </div>
                </div>

                {/* Partner Type Filter */}
                <div className="mb-6">
                  <h4 className="mb-3 text-sm font-medium text-neutral-300">
                    Tipo di Partner
                  </h4>
                  <div className="space-y-2">
                    {[
                      { value: "hotel", label: "Hotels" },
                      { value: "restaurant", label: "Ristoranti" },
                      { value: "tour", label: "Tour" },
                      { value: "shuttle", label: "Trasporti" },
                    ].map(type => (
                      <label
                        key={type.value}
                        className="flex items-center gap-2 text-sm text-neutral-300"
                      >
                        <input
                          type="checkbox"
                          className="rounded border-neutral-600 bg-neutral-800"
                          checked={selectedPartnerTypes.includes(type.value)}
                          onChange={e =>
                            handlePartnerTypeChange(
                              type.value,
                              e.target.checked
                            )
                          }
                        />
                        {type.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Locations Filter */}
                <div className="mb-6">
                  <h4 className="mb-3 text-sm font-medium text-neutral-300">
                    Località
                  </h4>
                  <div className="max-h-32 space-y-2 overflow-y-auto">
                    {availableLocations.slice(0, 8).map(location => (
                      <label
                        key={location}
                        className="flex items-center gap-2 text-sm text-neutral-300"
                      >
                        <input
                          type="checkbox"
                          className="rounded border-neutral-600 bg-neutral-800"
                          checked={selectedLocations.includes(location)}
                          onChange={e =>
                            handleLocationChange(location, e.target.checked)
                          }
                        />
                        {location}
                      </label>
                    ))}
                    {loadingOptions && (
                      <div className="text-sm text-neutral-400">
                        Caricamento...
                      </div>
                    )}
                  </div>
                </div>

                {/* Cuisine Types Filter (for restaurants) */}
                {selectedPartnerTypes.includes("restaurant") && (
                  <div className="mb-6">
                    <h4 className="mb-3 text-sm font-medium text-neutral-300">
                      Tipo di Cucina
                    </h4>
                    <div className="max-h-32 space-y-2 overflow-y-auto">
                      {availableCuisineTypes.slice(0, 6).map(cuisine => (
                        <label
                          key={cuisine}
                          className="flex items-center gap-2 text-sm text-neutral-300"
                        >
                          <input
                            type="checkbox"
                            className="rounded border-neutral-600 bg-neutral-800"
                            checked={selectedCuisineTypes.includes(cuisine)}
                            onChange={e =>
                              handleCuisineTypeChange(cuisine, e.target.checked)
                            }
                          />
                          {cuisine}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tour Types Filter (for tours) */}
                {selectedPartnerTypes.includes("tour") && (
                  <div className="mb-6">
                    <h4 className="mb-3 text-sm font-medium text-neutral-300">
                      Tipo di Tour
                    </h4>
                    <div className="max-h-32 space-y-2 overflow-y-auto">
                      {availableTourTypes.slice(0, 6).map(tourType => (
                        <label
                          key={tourType}
                          className="flex items-center gap-2 text-sm text-neutral-300"
                        >
                          <input
                            type="checkbox"
                            className="rounded border-neutral-600 bg-neutral-800"
                            checked={selectedTourTypes.includes(tourType)}
                            onChange={e =>
                              handleTourTypeChange(tourType, e.target.checked)
                            }
                          />
                          {tourType}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Service Types Filter (for shuttles) */}
                {selectedPartnerTypes.includes("shuttle") && (
                  <div className="mb-6">
                    <h4 className="mb-3 text-sm font-medium text-neutral-300">
                      Tipo di Servizio
                    </h4>
                    <div className="max-h-32 space-y-2 overflow-y-auto">
                      {availableServiceTypes.slice(0, 6).map(serviceType => (
                        <label
                          key={serviceType}
                          className="flex items-center gap-2 text-sm text-neutral-300"
                        >
                          <input
                            type="checkbox"
                            className="rounded border-neutral-600 bg-neutral-800"
                            checked={selectedServiceTypes.includes(serviceType)}
                            onChange={e =>
                              handleServiceTypeChange(
                                serviceType,
                                e.target.checked
                              )
                            }
                          />
                          {serviceType}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clear All Filters Button */}
                <div className="border-t border-neutral-700 pt-4">
                  <Button
                    onClick={clearAllFilters}
                    variant="outline"
                    className="w-full border-neutral-600 bg-transparent text-white hover:bg-neutral-800"
                  >
                    Rimuovi tutti i filtri
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Results Header */}
          <div className="mb-6">
            <h1 className="mb-2 text-2xl font-bold text-white">
              {loading ? "Ricerca in corso..." : `Trovati ${total} partner`}
            </h1>
            <p className="text-neutral-400">
              {searchQuery
                ? `Risultati per "${searchQuery}"`
                : "I migliori partner per il tuo viaggio"}
            </p>
            {error && (
              <div className="mt-2 text-sm text-red-400">Errore: {error}</div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card
                  key={i}
                  className="overflow-hidden border-neutral-700 bg-neutral-900/50"
                >
                  <div className="flex">
                    {/* Image skeleton */}
                    <div className="relative h-48 w-80 flex-shrink-0">
                      <Skeleton className="h-full w-full" />
                      <div className="absolute top-3 left-3">
                        <Skeleton className="h-6 w-16" />
                      </div>
                      <div className="absolute top-3 right-3">
                        <Skeleton className="h-8 w-12" />
                      </div>
                    </div>

                    {/* Content skeleton */}
                    <div className="flex-1 space-y-4 p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-6 w-3/4" />
                          <div className="flex items-center gap-4">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-5 w-16" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, index) => (
                              <Skeleton
                                key={index}
                                className="h-4 w-4 rounded-full"
                              />
                            ))}
                          </div>
                          <Skeleton className="h-4 w-8" />
                        </div>
                      </div>

                      <Skeleton className="h-12 w-full" />

                      <div className="flex flex-wrap gap-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-18" />
                        <Skeleton className="h-6 w-14" />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Skeleton className="h-9 w-24" />
                        <Skeleton className="h-9 w-20" />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Results Content */}
          {!loading && viewMode === "map" && (
            <div className="h-[600px] overflow-hidden rounded-lg border border-neutral-700">
              <MapView
                partners={partners
                  .filter(
                    p =>
                      p.type === "hotel" ||
                      p.type === "restaurant" ||
                      p.type === "tour" ||
                      p.type === "transport"
                  )
                  .map(p => ({
                    ...p,
                    price_range: p.priceRange,
                    location: p.location.city,
                    type: p.type as "hotel" | "restaurant" | "tour" | "shuttle",
                  }))}
                selectedPartnerId={
                  selectedPartnerTypes.length > 0 ? partners[0]?.id : undefined
                }
                onPartnerSelect={partnerId => {
                  console.log("Selected partner:", partnerId);
                  // You can add navigation to partner details here
                }}
              />
            </div>
          )}

          {/* Results List */}
          {!loading && viewMode === "list" && (
            <div className="space-y-4">
              {partners.map(partner => (
                <Card
                  key={partner.id}
                  className="overflow-hidden border-0 bg-transparent transition-all duration-300 hover:bg-neutral-900/30"
                >
                  <div className="flex flex-row items-center">
                    {/* Image */}
                    <div className="relative h-24 w-24 flex-shrink-0 sm:h-28 sm:w-28 md:h-32 md:w-64 lg:h-36 lg:w-72">
                      <Image
                        src={
                          partner.images[0] ||
                          `/images/${partner.type}-placeholder.jpg`
                        }
                        alt={partner.name}
                        fill
                        className="object-cover md:object-center"
                      />
                      <div className="bg-primary-500 absolute top-3 right-3 rounded-lg px-2 py-1 text-xs font-semibold text-white">
                        {getPriceRangeLabel(
                          partner.priceRange === "budget"
                            ? 1
                            : partner.priceRange === "mid-range"
                              ? 2
                              : partner.priceRange === "luxury"
                                ? 3
                                : partner.priceRange === "premium"
                                  ? 4
                                  : 2
                        )}
                      </div>
                      <div className="absolute top-3 left-3 rounded bg-neutral-900/80 px-2 py-1 text-xs text-white">
                        {getPartnerTypeLabel(partner.type)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-3 sm:p-4 md:p-6">
                      {/* Desktop: Row layout, Mobile: Column layout */}
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                        {/* Main Content */}
                        <div className="mb-4 flex-1 md:mr-6 md:mb-0">
                          <div className="mb-3">
                            <div className="mb-2 flex items-start justify-between">
                              <h3 className="line-clamp-1 text-base font-bold text-white sm:text-lg md:text-xl">
                                {partner.name}
                              </h3>
                              {/* Rating - Show on mobile next to title, on desktop in right section */}
                              {partner.rating && (
                                <div className="ml-2 flex items-center gap-1 md:hidden">
                                  <div className="flex gap-0.5">
                                    {renderStars(partner.rating)}
                                  </div>
                                  <span className="text-sm font-medium text-white">
                                    {partner.rating.toFixed(1)}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-neutral-400">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">
                                  {partner.location.city}
                                </span>
                              </div>
                              {partner.isVerified && (
                                <Badge
                                  variant="outline"
                                  className="border-green-600 bg-green-900/20 text-xs text-green-400"
                                >
                                  Verificato
                                </Badge>
                              )}
                              {partner.rating && (
                                <span className="text-xs text-neutral-500">
                                  ({partner.reviewCount} recensioni)
                                </span>
                              )}
                              {/* Mobile Price Range */}
                              <div className="md:hidden">
                                <Badge
                                  variant="outline"
                                  className="border-primary-600 bg-primary-900/20 text-primary-400 text-xs"
                                >
                                  {getPriceRangeLabel(
                                    partner.priceRange === "budget"
                                      ? 1
                                      : partner.priceRange === "mid-range"
                                        ? 2
                                        : partner.priceRange === "luxury"
                                          ? 3
                                          : partner.priceRange === "premium"
                                            ? 4
                                            : 2
                                  )}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <p className="mb-3 line-clamp-2 text-sm text-neutral-300 md:line-clamp-1">
                            {partner.description}
                          </p>

                          {/* Features */}
                          <div className="mb-2 flex flex-wrap gap-1.5 md:mb-3">
                            {/* Mobile: Show first 2 features */}
                            <div className="flex flex-wrap gap-1.5 md:hidden">
                              {partner.features
                                .slice(0, 2)
                                .map((feature, index) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="border-neutral-600 bg-neutral-800/50 text-xs text-neutral-300"
                                  >
                                    {feature}
                                  </Badge>
                                ))}
                              {partner.features.length > 2 && (
                                <Badge
                                  variant="outline"
                                  className="border-neutral-600 bg-neutral-800/50 text-xs text-neutral-400"
                                >
                                  +{partner.features.length - 2}
                                </Badge>
                              )}
                            </div>

                            {/* Desktop: Show first 4 features */}
                            <div className="hidden md:flex md:flex-wrap md:gap-1.5">
                              {partner.features
                                .slice(0, 4)
                                .map((feature, index) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="border-neutral-600 bg-neutral-800/50 text-xs text-neutral-300"
                                  >
                                    {feature}
                                  </Badge>
                                ))}
                              {partner.features.length > 4 && (
                                <Badge
                                  variant="outline"
                                  className="border-neutral-600 bg-neutral-800/50 text-xs text-neutral-400"
                                >
                                  +{partner.features.length - 4}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Section - Desktop Only */}
                        <div className="hidden md:block md:flex-shrink-0 md:text-right">
                          {/* Desktop Rating */}
                          {partner.rating && (
                            <div className="mb-3">
                              <div className="mb-1 flex items-center justify-end gap-1">
                                <div className="flex gap-0.5">
                                  {renderStars(partner.rating)}
                                </div>
                                <span className="text-lg font-bold text-white">
                                  {partner.rating.toFixed(1)}
                                </span>
                              </div>
                              <div className="text-xs text-neutral-500">
                                {partner.reviewCount} recensioni
                              </div>
                            </div>
                          )}

                          {/* Price Range */}
                          <div className="mb-4">
                            <div className="text-primary-400 text-lg font-bold">
                              {getPriceRangeLabel(
                                partner.priceRange === "budget"
                                  ? 1
                                  : partner.priceRange === "mid-range"
                                    ? 2
                                    : partner.priceRange === "luxury"
                                      ? 3
                                      : partner.priceRange === "premium"
                                        ? 4
                                        : 2
                              )}
                            </div>
                            <div className="text-xs text-neutral-400">
                              {partner.priceRange === "budget" && "Economico"}
                              {partner.priceRange === "mid-range" && "Medio"}
                              {partner.priceRange === "luxury" && "Lusso"}
                              {partner.priceRange === "premium" && "Premium"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-neutral-600 text-black hover:bg-neutral-800"
                        >
                          Dettagli
                        </Button>
                        {partner.contact.website && (
                          <Button
                            size="sm"
                            className="bg-primary-500 hover:bg-primary-600 flex-1 text-white"
                            onClick={() =>
                              window.open(partner.contact.website, "_blank")
                            }
                          >
                            Sito Web
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {!loading && partners.length === 0 && (
            <div className="py-12 text-center">
              <div className="mb-4 text-6xl">
                {viewMode === "map" ? "🗺️" : "🔍"}
              </div>
              <h3 className="mb-2 text-xl font-bold text-white">
                Nessun partner trovato
              </h3>
              <p className="mb-6 text-neutral-400">
                {searchQuery
                  ? `Nessun risultato per "${searchQuery}". Prova con una ricerca diversa.`
                  : "Prova a modificare i filtri di ricerca o cerca una destinazione diversa."}
              </p>
              <div className="flex justify-center gap-3">
                <Button
                  onClick={clearAllFilters}
                  variant="outline"
                  className="border-neutral-600 bg-transparent text-white hover:bg-neutral-800"
                >
                  Rimuovi filtri
                </Button>
                <Button
                  onClick={() => window.history.back()}
                  className="bg-primary-500 hover:bg-primary-600 text-white"
                >
                  Torna alla ricerca
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Assistant Modal */}
      <AIAssistantModal
        open={isAIAssistantOpen}
        onOpenChange={setIsAIAssistantOpen}
        onApplyFilters={handleAISuggestions}
      />
    </div>
  );
};
