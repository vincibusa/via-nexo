/**
 * useMediaQuery Hook
 * Tracks a CSS media query and returns a boolean
 */

import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  // Initialize state with undefined width/height so server and client renders match
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQueryList = window.matchMedia(query);
    const documentChangeHandler = () => setMatches(mediaQueryList.matches);

    // Set the initial value
    setMatches(mediaQueryList.matches);

    // Listen for changes
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener("change", documentChangeHandler);
    } else {
      // Fallback for older browsers
      mediaQueryList.addListener(documentChangeHandler);
    }

    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener("change", documentChangeHandler);
      } else {
        // Fallback for older browsers
        mediaQueryList.removeListener(documentChangeHandler);
      }
    };
  }, [query]);

  return matches;
}

// Convenience hooks for common breakpoints
export const useIsMobile = (): boolean => useMediaQuery("(max-width: 768px)");
export const useIsTablet = (): boolean =>
  useMediaQuery("(min-width: 769px) and (max-width: 1024px)");
export const useIsDesktop = (): boolean => useMediaQuery("(min-width: 1025px)");
export const useIsTouchDevice = (): boolean =>
  useMediaQuery("(hover: none) and (pointer: coarse)");
