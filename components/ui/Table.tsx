"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: keyof T | string;
  title: string;
  sortable?: boolean;
  render?: (value: unknown, record: T, index: number) => React.ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor?: (record: T, index: number) => string | number;
  onSort?: (key: string, direction: "asc" | "desc") => void;
  loading?: boolean;
  emptyState?: React.ReactNode;
  className?: string;
  striped?: boolean;
  hoverable?: boolean;
}

type SortState = {
  key: string | null;
  direction: "asc" | "desc" | null;
};

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  onSort,
  loading = false,
  emptyState,
  className,
  striped = false,
  hoverable = true,
}: TableProps<T>) {
  const [sortState, setSortState] = useState<SortState>({ key: null, direction: null });

  const handleSort = (columnKey: string) => {
    const newDirection =
      sortState.key === columnKey && sortState.direction === "asc" ? "desc" : "asc";
    setSortState({ key: columnKey, direction: newDirection });
    onSort?.(columnKey, newDirection);
  };

  const getSortIcon = (columnKey: string) => {
    if (sortState.key !== columnKey) {
      return <ChevronsUpDown className="ml-2 h-4 w-4 text-gray-400" />;
    }
    return sortState.direction === "asc" ? (
      <ChevronUp className="ml-2 h-4 w-4 text-purple-600 dark:text-purple-400" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4 text-purple-600 dark:text-purple-400" />
    );
  };

  const getAlignClass = (align?: "left" | "center" | "right") => {
    switch (align) {
      case "center":
        return "text-center";
      case "right":
        return "text-right";
      default:
        return "text-left";
    }
  };

  if (loading) {
    return (
      <div className="w-full overflow-x-auto">
        <table className={cn("w-full border-collapse", className)}>
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="bg-gray-50 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, index) => (
              <tr key={index} className="border-b border-gray-200 dark:border-gray-800">
                {columns.map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0 && emptyState) {
    return <div>{emptyState}</div>;
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full border-collapse", className)}>
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-800">
            {columns.map((column, index) => (
              <th
                key={index}
                className={cn(
                  "bg-gray-50 px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-700 dark:bg-gray-800 dark:text-gray-300",
                  getAlignClass(column.align),
                  column.sortable &&
                    "cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
                style={{ width: column.width }}
                onClick={() => column.sortable && handleSort(column.key as string)}
              >
                <div className="flex items-center justify-between">
                  <span>{column.title}</span>
                  {column.sortable && getSortIcon(column.key as string)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((record, rowIndex) => {
            const key = keyExtractor ? keyExtractor(record, rowIndex) : rowIndex;
            return (
              <tr
                key={key}
                className={cn(
                  "border-b border-gray-200 dark:border-gray-800",
                  striped && rowIndex % 2 === 1 && "bg-gray-50 dark:bg-gray-800/50",
                  hoverable && "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                )}
              >
                {columns.map((column, colIndex) => {
                  const value = record[column.key as keyof T];
                  const content = column.render
                    ? column.render(value, record, rowIndex)
                    : (value as React.ReactNode);

                  return (
                    <td
                      key={colIndex}
                      className={cn(
                        "px-6 py-4 text-sm text-gray-900 dark:text-gray-100",
                        getAlignClass(column.align)
                      )}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
