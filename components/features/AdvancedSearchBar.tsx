/**
 * Advanced Search Bar Component
 *
 * Features:
 * - Real-time search with debouncing
 * - Search history
 * - Autocomplete suggestions
 * - Category filter
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Input, Button } from "antd";
import { Search, X, History } from "lucide-react";
import { useRouter } from "next/navigation";
import { debounce } from "lodash";
import type { Product } from "@/lib/types";

const { Search: AntSearch } = Input;

interface SearchHistory {
  query: string;
  timestamp: Date;
}

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (value: string) => void;
  className?: string;
}

export function AdvancedSearchBar({
  placeholder = "Search products, vendors...",
  onSearch,
  className = "",
}: SearchBarProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem("searchHistory");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Fetch autocomplete suggestions
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchSuggestions = useCallback(
    debounce(async (query: string) => {
      if (!query || query.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&limit=5`);
        const data = await res.json();

        if (data.success && data.products) {
          const productNames = data.products.map((p: Product) => p.name);
          setSuggestions(productNames);
        }
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
      }
    }, 300),
    []
  );

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    fetchSuggestions(value);
  };

  // Handle search submission
  const handleSearch = (value: string) => {
    if (!value.trim()) return;

    // Save to history
    const newHistory = [
      { query: value, timestamp: new Date() },
      ...history.filter((h) => h.query !== value),
    ].slice(0, 10); // Keep only 10 most recent

    setHistory(newHistory);
    localStorage.setItem("searchHistory", JSON.stringify(newHistory));

    // Navigate to search results
    router.push(`/products?search=${encodeURIComponent(value)}`);
    setShowHistory(false);

    // Call custom handler if provided
    if (onSearch) {
      onSearch(value);
    }
  };

  // Clear search history
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("searchHistory");
  };

  // Remove single history item
  const removeHistoryItem = (query: string) => {
    const newHistory = history.filter((h) => h.query !== query);
    setHistory(newHistory);
    localStorage.setItem("searchHistory", JSON.stringify(newHistory));
  };

  return (
    <div className={`relative w-full ${className}`}>
      <AntSearch
        placeholder={placeholder}
        value={searchValue}
        onChange={(e) => handleSearchChange(e.target.value)}
        onSearch={handleSearch}
        onFocus={() => setShowHistory(true)}
        onBlur={() => setTimeout(() => setShowHistory(false), 200)}
        enterButton={
          <Button type="primary" icon={<Search className="h-4 w-4" />}>
            Search
          </Button>
        }
        size="large"
        allowClear
        className="search-bar"
      />

      {/* Search History Dropdown */}
      {showHistory && history.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-ds-surface-base rounded-lg shadow-ds-lg border border-ds-border-base z-ds-overlay max-h-80 overflow-y-auto">
          <div className="p-3 border-b border-ds-border-base flex justify-between items-center">
            <span className="text-sm font-semibold text-ds-text-secondary flex items-center gap-2">
              <History className="h-4 w-4" />
              Recent Searches
            </span>
            <Button
              type="text"
              size="small"
              onClick={clearHistory}
              className="text-xs text-ds-text-tertiary hover:text-ds-text-secondary dark:text-ds-text-placeholder"
            >
              Clear All
            </Button>
          </div>
          <div className="p-2">
            {history.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-3 py-2 hover:bg-ds-surface-sunken dark:hover:bg-ds-surface-overlay rounded cursor-pointer group"
                onClick={() => {
                  setSearchValue(item.query);
                  handleSearch(item.query);
                }}
              >
                <span className="text-sm text-ds-text-secondary flex items-center gap-2">
                  <Search className="h-3 w-3 text-ds-text-placeholder" />
                  {item.query}
                </span>
                <Button
                  type="text"
                  size="small"
                  icon={<X className="h-3 w-3" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeHistoryItem(item.query);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Autocomplete Suggestions */}
      {suggestions.length > 0 && searchValue && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-ds-surface-base rounded-lg shadow-ds-lg border border-ds-border-base z-ds-overlay">
          <div className="p-2">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="px-3 py-2 hover:bg-ds-surface-sunken dark:hover:bg-ds-surface-overlay rounded cursor-pointer"
                onClick={() => {
                  setSearchValue(suggestion);
                  handleSearch(suggestion);
                }}
              >
                <span className="text-sm text-ds-text-secondary">{suggestion}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
