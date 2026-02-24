"use client";

import { Search, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { mockProducts } from "@/lib/data/mockData";

export interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  defaultValue?: string;
  className?: string;
  showSuggestions?: boolean;
}

export function SearchBar({
  onSearch,
  placeholder = "Search products...",
  defaultValue = "",
  className,
  showSuggestions = true,
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<typeof mockProducts>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update suggestions as user types
  useEffect(() => {
    if (!showSuggestions || !query || query.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const searchQuery = query.toLowerCase();
    const filtered = mockProducts
      .filter(
        (product) =>
          product.isActive &&
          (product.name.toLowerCase().includes(searchQuery) ||
            product.description?.toLowerCase().includes(searchQuery) ||
            product.category.toLowerCase().includes(searchQuery))
      )
      .slice(0, 5); // Limit to 5 suggestions

    setSuggestions(filtered);
    setShowDropdown(filtered.length > 0);
  }, [query, showSuggestions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
    setShowDropdown(false);
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleSuggestionClick = (productId: string) => {
    setShowDropdown(false);
    router.push(`/products/${productId}`);
  };

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ds-text-placeholder" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-ds-border-base bg-ds-surface-base py-2 pl-10 pr-10 text-ds-text-primary placeholder-ds-text-placeholder focus:border-ds-border-focus focus:outline-none focus:ring-2 focus:ring-ds-focus-ring/20 dark:bg-ds-surface-base dark:text-ds-text-primary dark:placeholder-ds-text-placeholder dark:focus:border-ds-brand-accent"
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
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-ds-overlay mt-2 w-full rounded-lg border border-ds-border-base bg-ds-surface-base shadow-ds-lg">
          <div className="max-h-96 overflow-y-auto">
            {suggestions.map((product) => (
              <button
                key={product.id}
                onClick={() => handleSuggestionClick(product.id)}
                className="flex w-full items-center gap-3 border-b border-ds-border-subtle p-3 text-left transition-colors hover:bg-ds-surface-sunken dark:hover:bg-ds-surface-overlay/50"
              >
                <Image
                  src={product.images[0] || "/placeholder-product.jpg"}
                  alt={product.name}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded object-cover"
                />
                <div className="flex-1 overflow-hidden">
                  <h4 className="truncate text-sm font-medium text-ds-text-primary">
                    {product.name}
                  </h4>
                  <p className="text-sm text-ds-text-secondary">
                    ₦{product.price.toLocaleString()}
                  </p>
                </div>
              </button>
            ))}
          </div>
          <Link
            href={`/products?search=${encodeURIComponent(query)}`}
            onClick={() => setShowDropdown(false)}
            className="block border-t border-ds-border-base p-3 text-center text-sm text-ds-text-brand hover:bg-ds-surface-sunken dark:hover:bg-ds-surface-overlay/50"
          >
            View all results for &quot;{query}&quot;
          </Link>
        </div>
      )}
    </div>
  );
}
