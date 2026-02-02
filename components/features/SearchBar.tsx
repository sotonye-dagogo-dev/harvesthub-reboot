"use client";

import { Search, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-10 text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-400 dark:focus:border-purple-400"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="max-h-96 overflow-y-auto">
            {suggestions.map((product) => (
              <button
                key={product.id}
                onClick={() => handleSuggestionClick(product.id)}
                className="flex w-full items-center gap-3 border-b border-gray-100 p-3 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
              >
                <img
                  src={product.images[0] || "/placeholder-product.jpg"}
                  alt={product.name}
                  className="h-12 w-12 rounded object-cover"
                />
                <div className="flex-1 overflow-hidden">
                  <h4 className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {product.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ₦{product.price.toLocaleString()}
                  </p>
                </div>
              </button>
            ))}
          </div>
          <Link
            href={`/products?search=${encodeURIComponent(query)}`}
            onClick={() => setShowDropdown(false)}
            className="block border-t border-gray-200 p-3 text-center text-sm text-purple-600 hover:bg-gray-50 dark:border-gray-700 dark:text-purple-400 dark:hover:bg-gray-700/50"
          >
            View all results for "{query}"
          </Link>
        </div>
      )}
    </div>
  );
}
