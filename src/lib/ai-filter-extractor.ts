export interface FilterSuggestions {
  partnerTypes?: string[];
  locations?: string[];
  priceRange?: [number, number];
  cuisineTypes?: string[];
  tourTypes?: string[];
  serviceTypes?: string[];
  searchQuery?: string;
}

export function extractFilterSuggestionsFromAIResponse(
  aiResponse: string
): FilterSuggestions {
  const suggestions: FilterSuggestions = {};

  // Extract partner types
  const partnerTypePatterns = [
    /(hotel|albergo)/gi,
    /(ristorante|cena|ristoranti)/gi,
    /(tour|escursione|visita guidata)/gi,
    /(trasporto|shuttle|noleggio|taxi)/gi,
  ];

  const foundPartnerTypes = new Set<string>();
  partnerTypePatterns.forEach(pattern => {
    const matches = aiResponse.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const normalized = match.toLowerCase();
        if (normalized.includes("hotel") || normalized.includes("albergo")) {
          foundPartnerTypes.add("hotel");
        } else if (
          normalized.includes("ristorante") ||
          normalized.includes("cena")
        ) {
          foundPartnerTypes.add("restaurant");
        } else if (
          normalized.includes("tour") ||
          normalized.includes("escursione")
        ) {
          foundPartnerTypes.add("tour");
        } else if (
          normalized.includes("trasporto") ||
          normalized.includes("shuttle")
        ) {
          foundPartnerTypes.add("shuttle");
        }
      });
    }
  });

  if (foundPartnerTypes.size > 0) {
    suggestions.partnerTypes = Array.from(foundPartnerTypes);
  }

  // Extract locations
  const locationPatterns = [
    /\b(Roma|Rome)\b/gi,
    /\b(Firenze|Florence)\b/gi,
    /\b(Venezia|Venice)\b/gi,
    /\b(Milano|Milan)\b/gi,
    /\b(Napoli|Naples)\b/gi,
    /\b(Torino|Turin)\b/gi,
    /\b(Bologna)\b/gi,
    /\b(Genova|Genoa)\b/gi,
    /\b(Palermo)\b/gi,
    /\b(Catania)\b/gi,
  ];

  const foundLocations = new Set<string>();
  locationPatterns.forEach(pattern => {
    const matches = aiResponse.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const normalized =
          match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
        foundLocations.add(normalized);
      });
    }
  });

  if (foundLocations.size > 0) {
    suggestions.locations = Array.from(foundLocations);
  }

  // Extract price range
  if (
    aiResponse.toLowerCase().includes("economico") ||
    aiResponse.toLowerCase().includes("budget")
  ) {
    suggestions.priceRange = [1, 2];
  } else if (
    aiResponse.toLowerCase().includes("lusso") ||
    aiResponse.toLowerCase().includes("luxury")
  ) {
    suggestions.priceRange = [4, 5];
  } else if (
    aiResponse.toLowerCase().includes("medio") ||
    aiResponse.toLowerCase().includes("mid-range")
  ) {
    suggestions.priceRange = [2, 3];
  }

  // Extract cuisine types
  const cuisinePatterns = [
    /(italiana|italian)/gi,
    /(pizza)/gi,
    /(frutti di mare|seafood)/gi,
    /(carne|meat)/gi,
    /(vegetariana|vegetarian)/gi,
    /(vegana|vegan)/gi,
    /(internazionale|international)/gi,
    /(asiatica|asian)/gi,
  ];

  const foundCuisines = new Set<string>();
  cuisinePatterns.forEach(pattern => {
    const matches = aiResponse.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const normalized =
          match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
        foundCuisines.add(normalized);
      });
    }
  });

  if (foundCuisines.size > 0) {
    suggestions.cuisineTypes = Array.from(foundCuisines);
  }

  // Extract tour types and map to actual database values
  const tourPatterns = [
    { pattern: /(storico|historical)/gi, mappedValue: "Cultural Historical" },
    { pattern: /(culturale|cultural)/gi, mappedValue: "Cultural Art" },
    { pattern: /(gastronomico|food)/gi, mappedValue: "Gastronomico" },
    { pattern: /(notturno|night)/gi, mappedValue: "Culturale/Notturno" },
    { pattern: /(privato|private)/gi, mappedValue: "Private Tour" },
    { pattern: /(di gruppo|group)/gi, mappedValue: "Adventure Group" },
    { pattern: /(avventura|adventure)/gi, mappedValue: "Adventure Hiking" },
    { pattern: /(famiglia|family)/gi, mappedValue: "Family Adventure" },
    { pattern: /(romantico|romantic)/gi, mappedValue: "Romantic Walking" },
    {
      pattern: /(archeologico|archeological)/gi,
      mappedValue: "Culturale/Archeologico",
    },
    { pattern: /(panoramico|scenic)/gi, mappedValue: "Panoramico/Culturale" },
  ];

  const foundTourTypes = new Set<string>();
  tourPatterns.forEach(({ pattern, mappedValue }) => {
    const matches = aiResponse.match(pattern);
    if (matches) {
      foundTourTypes.add(mappedValue);
    }
  });

  if (foundTourTypes.size > 0) {
    suggestions.tourTypes = Array.from(foundTourTypes);
  }

  // Extract service types
  const servicePatterns = [
    /(aeroporto|airport)/gi,
    /(stazione|station)/gi,
    /(transfer)/gi,
    /(noleggio|rental)/gi,
  ];

  const foundServiceTypes = new Set<string>();
  servicePatterns.forEach(pattern => {
    const matches = aiResponse.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const normalized =
          match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
        foundServiceTypes.add(normalized);
      });
    }
  });

  if (foundServiceTypes.size > 0) {
    suggestions.serviceTypes = Array.from(foundServiceTypes);
  }

  return suggestions;
}
