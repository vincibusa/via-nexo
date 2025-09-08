/**
 * useFavorites Hook
 * Manages user favorites with localStorage persistence
 */

import { useState, useEffect, useCallback } from "react";

const FAVORITES_STORAGE_KEY = "via-nexo-favorites";

interface UseFavoritesReturn {
  favorites: string[];
  isFavorite: (id: string) => boolean;
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  toggleFavorite: (id: string) => void;
  clearAllFavorites: () => void;
}

export function useFavorites(): UseFavoritesReturn {
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const parsedFavorites = JSON.parse(stored);
        if (Array.isArray(parsedFavorites)) {
          setFavorites(parsedFavorites);
        }
      }
    } catch (error) {
      console.error("Failed to load favorites:", error);
      localStorage.removeItem(FAVORITES_STORAGE_KEY);
    }
  }, []);

  // Save favorites to localStorage whenever they change
  const saveFavorites = useCallback((newFavorites: string[]) => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (error) {
      console.error("Failed to save favorites:", error);
    }
  }, []);

  const isFavorite = useCallback(
    (id: string): boolean => {
      return favorites.includes(id);
    },
    [favorites]
  );

  const addFavorite = useCallback(
    (id: string) => {
      if (!favorites.includes(id)) {
        const newFavorites = [...favorites, id];
        saveFavorites(newFavorites);
      }
    },
    [favorites, saveFavorites]
  );

  const removeFavorite = useCallback(
    (id: string) => {
      const newFavorites = favorites.filter(fav => fav !== id);
      saveFavorites(newFavorites);
    },
    [favorites, saveFavorites]
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      if (isFavorite(id)) {
        removeFavorite(id);
      } else {
        addFavorite(id);
      }
    },
    [isFavorite, addFavorite, removeFavorite]
  );

  const clearAllFavorites = useCallback(() => {
    localStorage.removeItem(FAVORITES_STORAGE_KEY);
    setFavorites([]);
  }, []);

  return {
    favorites,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    clearAllFavorites,
  };
}
