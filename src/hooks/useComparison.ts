/**
 * useComparison Hook
 * Manages partner comparison with localStorage persistence
 */

import { useState, useEffect, useCallback } from "react";

const COMPARISON_STORAGE_KEY = "via-nexo-comparison";
const MAX_COMPARISON_ITEMS = 4;

interface UseComparisonReturn {
  comparisonItems: string[];
  isInComparison: (id: string) => boolean;
  addToComparison: (id: string) => boolean;
  removeFromComparison: (id: string) => void;
  toggleComparison: (id: string) => boolean;
  clearComparison: () => void;
  canAddMore: boolean;
}

export function useComparison(): UseComparisonReturn {
  const [comparisonItems, setComparisonItems] = useState<string[]>([]);

  // Load comparison items from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(COMPARISON_STORAGE_KEY);
      if (stored) {
        const parsedItems = JSON.parse(stored);
        if (Array.isArray(parsedItems)) {
          setComparisonItems(parsedItems);
        }
      }
    } catch (error) {
      console.error("Failed to load comparison items:", error);
      localStorage.removeItem(COMPARISON_STORAGE_KEY);
    }
  }, []);

  // Save comparison items to localStorage whenever they change
  const saveComparisonItems = useCallback((newItems: string[]) => {
    try {
      localStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(newItems));
      setComparisonItems(newItems);
    } catch (error) {
      console.error("Failed to save comparison items:", error);
    }
  }, []);

  const isInComparison = useCallback(
    (id: string): boolean => {
      return comparisonItems.includes(id);
    },
    [comparisonItems]
  );

  const addToComparison = useCallback(
    (id: string): boolean => {
      if (comparisonItems.length >= MAX_COMPARISON_ITEMS) {
        return false; // Cannot add more items
      }

      if (!comparisonItems.includes(id)) {
        const newItems = [...comparisonItems, id];
        saveComparisonItems(newItems);
        return true;
      }
      return false; // Already in comparison
    },
    [comparisonItems, saveComparisonItems]
  );

  const removeFromComparison = useCallback(
    (id: string) => {
      const newItems = comparisonItems.filter(item => item !== id);
      saveComparisonItems(newItems);
    },
    [comparisonItems, saveComparisonItems]
  );

  const toggleComparison = useCallback(
    (id: string): boolean => {
      if (isInComparison(id)) {
        removeFromComparison(id);
        return false;
      } else {
        return addToComparison(id);
      }
    },
    [isInComparison, addToComparison, removeFromComparison]
  );

  const clearComparison = useCallback(() => {
    localStorage.removeItem(COMPARISON_STORAGE_KEY);
    setComparisonItems([]);
  }, []);

  const canAddMore = comparisonItems.length < MAX_COMPARISON_ITEMS;

  return {
    comparisonItems,
    isInComparison,
    addToComparison,
    removeFromComparison,
    toggleComparison,
    clearComparison,
    canAddMore,
  };
}
