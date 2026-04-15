"use client";

import { SearchBar } from "@/components/features/SearchBar";

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
  return (
    <SearchBar
      className={className}
      placeholder={placeholder}
      showRecentSearches
      onSearch={(value) => {
        if (!onSearch) return;
        onSearch(value);
      }}
    />
  );
}
