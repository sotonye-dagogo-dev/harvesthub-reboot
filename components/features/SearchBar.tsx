"use client";

import { Clock3, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getProductsClient } from "@/lib/data/clientDataFetchers";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cn, formatCurrency } from "@/lib/utils";
import type { Product } from "@/lib/types";

export interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  defaultValue?: string;
  className?: string;
  expandDropdownOnDesktop?: boolean;
  showSuggestions?: boolean;
  showRecentSearches?: boolean;
  recentSearchKey?: string;
  recentSearchLimit?: number;
  suggestionLimit?: number;
}

const DEFAULT_RECENT_SEARCH_KEY = "myharvesthub.search.recent.v1";

type SafeStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function getSafeStorage(): SafeStorage | null {
  if (typeof window === "undefined") return null;
  const candidate = window.localStorage as Partial<Storage> | undefined;
  if (!candidate) return null;
  if (
    typeof candidate.getItem !== "function" ||
    typeof candidate.setItem !== "function" ||
    typeof candidate.removeItem !== "function"
  ) {
    return null;
  }
  return {
    getItem: candidate.getItem.bind(candidate),
    setItem: candidate.setItem.bind(candidate),
    removeItem: candidate.removeItem.bind(candidate),
  };
}

function safeParseRecent(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string").slice(0, 10);
  } catch {
    return [];
  }
}

export function SearchBar({
  onSearch,
  placeholder = "Search products...",
  defaultValue = "",
  className,
  expandDropdownOnDesktop = false,
  showSuggestions = true,
  showRecentSearches = false,
  recentSearchKey = DEFAULT_RECENT_SEARCH_KEY,
  recentSearchLimit = 6,
  suggestionLimit = 6,
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const trimmedQuery = query.trim();
  const activeRecentSearches = useMemo(
    () => (showRecentSearches ? recentSearches.slice(0, recentSearchLimit) : []),
    [recentSearchLimit, recentSearches, showRecentSearches]
  );

  useEffect(() => {
    if (!showRecentSearches) return;
    const storage = getSafeStorage();
    if (!storage) return;
    setRecentSearches(safeParseRecent(storage.getItem(recentSearchKey)));
  }, [recentSearchKey, showRecentSearches]);

  const persistRecentSearch = useCallback(
    (value: string) => {
      if (!showRecentSearches) return;
      const storage = getSafeStorage();
      if (!storage) return;
      const normalized = value.trim();
      if (!normalized) return;
      const next = [normalized, ...recentSearches.filter((item) => item !== normalized)].slice(
        0,
        Math.max(1, recentSearchLimit)
      );
      setRecentSearches(next);
      storage.setItem(recentSearchKey, JSON.stringify(next));
    },
    [recentSearchKey, recentSearchLimit, recentSearches, showRecentSearches]
  );

  const removeRecentSearch = useCallback(
    (value: string) => {
      if (!showRecentSearches) return;
      const storage = getSafeStorage();
      if (!storage) return;
      const next = recentSearches.filter((item) => item !== value);
      setRecentSearches(next);
      storage.setItem(recentSearchKey, JSON.stringify(next));
    },
    [recentSearchKey, recentSearches, showRecentSearches]
  );

  const clearRecentSearches = useCallback(() => {
    if (!showRecentSearches) return;
    const storage = getSafeStorage();
    if (!storage) return;
    setRecentSearches([]);
    storage.removeItem(recentSearchKey);
  }, [recentSearchKey, showRecentSearches]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update suggestions as user types via API-backed search.
  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function load() {
      if (!showSuggestions || trimmedQuery.length < 2) {
        setIsLoading(false);
        setLoadError(null);
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      setLoadError(null);
      try {
        const res = await getProductsClient({ search: trimmedQuery, limit: suggestionLimit });
        if (!mounted) return;
        const list = Array.isArray(res) ? res : [];
        setSuggestions((list as Product[]).slice(0, suggestionLimit));
      } catch {
        if (!mounted) return;
        setSuggestions([]);
        setLoadError("Unable to load search suggestions right now.");
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    timer = setTimeout(load, 220);
    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [showSuggestions, suggestionLimit, trimmedQuery]);

  const dropdownMode =
    trimmedQuery.length >= 2 && showSuggestions ? "suggestions" : "recent";
  const dropdownCount = dropdownMode === "suggestions" ? suggestions.length : activeRecentSearches.length;

  useEffect(() => {
    setHighlightedIndex(dropdownCount > 0 ? 0 : -1);
  }, [dropdownCount, dropdownMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmedQuery) return;
    persistRecentSearch(trimmedQuery);
    onSearch(trimmedQuery);
    setShowDropdown(false);
    setHighlightedIndex(-1);
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
    setLoadError(null);
    setSuggestions([]);
    if (showRecentSearches && recentSearches.length > 0) {
      setShowDropdown(true);
      setHighlightedIndex(0);
    } else {
      setShowDropdown(false);
      setHighlightedIndex(-1);
    }
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    const trimmed = value.trim();
    if (trimmed.length >= 2 && showSuggestions) {
      setShowDropdown(true);
      return;
    }
    if (showRecentSearches && recentSearches.length > 0) {
      setShowDropdown(true);
      return;
    }
    setShowDropdown(false);
  };

  const handleSuggestionClick = (productId: string) => {
    if (trimmedQuery) {
      persistRecentSearch(trimmedQuery);
    }
    setShowDropdown(false);
    setHighlightedIndex(-1);
    router.push(`/products/${productId}`);
  };

  const runRecentSearch = (term: string) => {
    setQuery(term);
    persistRecentSearch(term);
    onSearch(term);
    setShowDropdown(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setShowDropdown(false);
      setHighlightedIndex(-1);
      return;
    }

    if (!showDropdown || dropdownCount === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev + 1 + dropdownCount) % dropdownCount);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + dropdownCount) % dropdownCount);
      return;
    }

    if (event.key === "Enter" && highlightedIndex >= 0) {
      event.preventDefault();
      if (dropdownMode === "suggestions") {
        const selectedSuggestion = suggestions[highlightedIndex];
        if (selectedSuggestion) {
          handleSuggestionClick(selectedSuggestion.id);
        }
      } else {
        const selectedRecent = activeRecentSearches[highlightedIndex];
        if (selectedRecent) {
          runRecentSearch(selectedRecent);
        }
      }
    }
  };

  const showSuggestionState = dropdownMode === "suggestions";
  const showRecentState = dropdownMode === "recent" && showRecentSearches;
  const shouldShowNoSuggestionState =
    showSuggestionState && !isLoading && !loadError && suggestions.length === 0;
  const shouldRenderDropdown =
    showDropdown &&
    (showRecentState || showSuggestionState) &&
    (isLoading ||
      Boolean(loadError) ||
      suggestions.length > 0 ||
      activeRecentSearches.length > 0 ||
      shouldShowNoSuggestionState);

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ds-text-placeholder" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              const hasSuggestions = suggestions.length > 0 || trimmedQuery.length >= 2;
              const hasRecent = showRecentSearches && recentSearches.length > 0;
              setShowDropdown(hasSuggestions || hasRecent);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full rounded-ds-md border border-ds-border-base bg-ds-surface-base py-2 pl-10 pr-10 text-ds-text-primary placeholder-ds-text-placeholder focus:border-ds-border-focus focus:outline-none focus:ring-2 focus:ring-ds-focus-ring/20 dark:bg-ds-surface-base dark:text-ds-text-primary dark:placeholder-ds-text-placeholder dark:focus:border-ds-brand-accent"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ds-text-placeholder hover:text-ds-text-secondary dark:hover:text-ds-text-placeholder"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {shouldRenderDropdown ? (
        <div
          className={cn(
            "absolute z-ds-overlay mt-2 w-full overflow-hidden rounded-ds-md border border-ds-border-base bg-ds-surface-base shadow-ds-lg",
            expandDropdownOnDesktop &&
              "md:left-1/2 md:w-[min(44rem,calc(100vw-2rem))] md:-translate-x-1/2"
          )}
        >
          {showRecentState ? (
            <div className="max-h-[60vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-ds-border-base px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-ds-text-secondary">
                  Recent searches
                </p>
                {activeRecentSearches.length > 0 ? (
                  <button
                    type="button"
                    onClick={clearRecentSearches}
                    className="text-xs text-ds-text-brand hover:underline"
                  >
                    Clear all
                  </button>
                ) : null}
              </div>
              {activeRecentSearches.length === 0 ? (
                <p className="px-3 py-3 text-sm text-ds-text-secondary">
                  No recent searches yet.
                </p>
              ) : (
                activeRecentSearches.map((recentQuery, index) => (
                  <div
                    key={recentQuery}
                    className={cn(
                      "flex items-center gap-2 border-b border-ds-border-subtle px-3 py-2",
                      highlightedIndex === index && "bg-ds-surface-sunken"
                    )}
                  >
                    <button
                      type="button"
                      className="flex flex-1 items-center gap-2 text-left text-sm text-ds-text-primary"
                      onClick={() => runRecentSearch(recentQuery)}
                    >
                      <Clock3 className="h-4 w-4 text-ds-text-placeholder" />
                      <span className="truncate">{recentQuery}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRecentSearch(recentQuery)}
                      className="rounded-ds-sm p-1 text-ds-text-placeholder hover:bg-ds-surface-sunken hover:text-ds-text-secondary"
                      aria-label={`Remove ${recentQuery} from recent searches`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : null}

          {showSuggestionState ? (
            <>
              <div className="max-h-[60vh] overflow-y-auto">
                {isLoading ? (
                  <p className="px-3 py-3 text-sm text-ds-text-secondary">Loading suggestions...</p>
                ) : null}
                {loadError ? (
                  <p className="px-3 py-3 text-sm text-ds-status-error-text">{loadError}</p>
                ) : null}
                {!isLoading && !loadError
                  ? suggestions.map((product, index) => (
                      <button
                        key={product.id}
                        onClick={() => handleSuggestionClick(product.id)}
                        className={cn(
                          "flex w-full items-center gap-3 border-b border-ds-border-subtle p-3 text-left transition-colors hover:bg-ds-surface-sunken dark:hover:bg-ds-surface-overlay/50",
                          highlightedIndex === index && "bg-ds-surface-sunken"
                        )}
                      >
                        <Image
                          src={product.images[0] || "/placeholder-product.jpg"}
                          alt={product.name}
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-ds-xs object-cover"
                        />
                        <div className="flex-1 overflow-hidden">
                          <h4 className="truncate text-sm font-medium text-ds-text-primary">
                            {product.name}
                          </h4>
                          <p className="text-sm text-ds-text-secondary">
                            {formatCurrency(product.price)}
                          </p>
                        </div>
                      </button>
                    ))
                  : null}
                {shouldShowNoSuggestionState ? (
                  <p className="px-3 py-3 text-sm text-ds-text-secondary">
                    No results found for &quot;{trimmedQuery}&quot;.
                  </p>
                ) : null}
              </div>

              <Link
                href={`/products?search=${encodeURIComponent(trimmedQuery)}`}
                onClick={() => {
                  persistRecentSearch(trimmedQuery);
                  setShowDropdown(false);
                }}
                className="block border-t border-ds-border-base p-3 text-center text-sm text-ds-text-brand hover:bg-ds-surface-sunken dark:hover:bg-ds-surface-overlay/50"
              >
                View all results for &quot;{trimmedQuery}&quot;
              </Link>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
