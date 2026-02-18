"use client";

import { useState, useEffect } from "react";

const RECENT_SEARCHES_KEY = "filofax_recent_searches";
const MAX_RECENT_SEARCHES = 5;

export interface RecentSearch {
  query: string;
  timestamp: number;
}

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  useEffect(() => {
    // Load recent searches from localStorage on mount
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as RecentSearch[];
        setRecentSearches(parsed);
      } catch (error) {
        console.error("Failed to parse recent searches:", error);
        localStorage.removeItem(RECENT_SEARCHES_KEY);
      }
    }
  }, []);

  const addRecentSearch = (query: string) => {
    if (!query.trim()) return;

    setRecentSearches((prev) => {
      // Remove existing entry if present
      const filtered = prev.filter((s) => s.query !== query);

      // Add new entry at the beginning
      const updated = [
        { query, timestamp: Date.now() },
        ...filtered,
      ].slice(0, MAX_RECENT_SEARCHES);

      // Persist to localStorage
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));

      return updated;
    });
  };

  const removeRecentSearch = (query: string) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.query !== query);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(filtered));
      return filtered;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  return {
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  };
}
