/**
 * Search History Component
 *
 * Features:
 * - Display recent searches
 * - Quick access to saved searches
 * - Clear history option
 */

"use client";

import { useState, useEffect } from "react";
import { Button, Space, Tag, Empty } from "antd";
import { Clock, X, Star, StarOff } from "lucide-react";

interface SearchHistoryProps {
  onSearchClick: (query: string) => void;
  maxItems?: number;
}

interface SearchItem {
  query: string;
  timestamp: number;
  isSaved?: boolean;
}

export function SearchHistory({ onSearchClick, maxItems = 10 }: SearchHistoryProps) {
  const [history, setHistory] = useState<SearchItem[]>([]);
  const [savedSearches, setSavedSearches] = useState<SearchItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("searchHistory");
    const saved = localStorage.getItem("savedSearches");

    if (stored) {
      setHistory(JSON.parse(stored));
    }

    if (saved) {
      setSavedSearches(JSON.parse(saved));
    }
  }, []);

  const handleRemove = (query: string) => {
    const updated = history.filter((item) => item.query !== query);
    setHistory(updated);
    localStorage.setItem("searchHistory", JSON.stringify(updated));
  };

  const handleToggleSaved = (query: string) => {
    const existing = savedSearches.find((s) => s.query === query);

    if (existing) {
      // Remove from saved
      const updated = savedSearches.filter((s) => s.query !== query);
      setSavedSearches(updated);
      localStorage.setItem("savedSearches", JSON.stringify(updated));
    } else {
      // Add to saved
      const newSaved = [...savedSearches, { query, timestamp: Date.now(), isSaved: true }];
      setSavedSearches(newSaved);
      localStorage.setItem("savedSearches", JSON.stringify(newSaved));
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem("searchHistory");
  };

  const isSaved = (query: string) => savedSearches.some((s) => s.query === query);
  const recentHistory = history.slice(0, maxItems);

  if (history.length === 0 && savedSearches.length === 0) {
    return <Empty description="No search history" className="py-8" />;
  }

  return (
    <div className="space-y-6">
      {savedSearches.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Saved Searches</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {savedSearches.map((item) => (
              <Tag
                key={item.query}
                icon={<Star size={14} className="text-yellow-500" />}
                closable
                onClose={() => handleToggleSaved(item.query)}
                onClick={() => onSearchClick(item.query)}
                className="cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/30"
              >
                {item.query}
              </Tag>
            ))}
          </div>
        </div>
      )}

      {recentHistory.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Recent Searches</h3>
            <Button type="text" size="small" onClick={handleClearHistory}>
              Clear all
            </Button>
          </div>
          <Space direction="vertical" className="w-full">
            {recentHistory.map((item) => (
              <div
                key={item.query}
                className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
              >
                <div
                  onClick={() => onSearchClick(item.query)}
                  className="flex items-center gap-2 flex-1"
                >
                  <Clock size={16} className="text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">{item.query}</span>
                </div>
                <Space>
                  <Button
                    type="text"
                    size="small"
                    icon={
                      isSaved(item.query) ? (
                        <Star size={14} className="text-yellow-500" />
                      ) : (
                        <StarOff size={14} />
                      )
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSaved(item.query);
                    }}
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<X size={14} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(item.query);
                    }}
                  />
                </Space>
              </div>
            ))}
          </Space>
        </div>
      )}
    </div>
  );
}

// Helper function to add search to history (export for use in search pages)
export function addToSearchHistory(query: string) {
  if (!query.trim()) return;

  const stored = localStorage.getItem("searchHistory");
  const history: SearchItem[] = stored ? JSON.parse(stored) : [];

  // Remove duplicate if exists
  const filtered = history.filter((item) => item.query !== query);

  // Add to beginning
  const updated = [{ query, timestamp: Date.now() }, ...filtered].slice(0, 50);

  localStorage.setItem("searchHistory", JSON.stringify(updated));
}
