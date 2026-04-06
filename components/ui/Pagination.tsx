"use client";

import { cn } from "@/lib/utils";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  maxVisiblePages?: number;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  maxVisiblePages = 5,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    const half = Math.floor(maxVisiblePages / 2);

    const start = Math.max(1, currentPage - half);
    const end = Math.min(totalPages, start + maxVisiblePages - 1);
    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push("...");
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  const handlePrevious = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  const handleFirst = () => onPageChange(1);
  const handleLast = () => onPageChange(totalPages);

  return (
    <div className={cn("flex items-center justify-center gap-1", className)}>
      {showFirstLast && (
        <button
          onClick={handleFirst}
          disabled={currentPage === 1}
          className="rounded-ds-md px-3 py-2 text-sm font-medium text-ds-text-secondary hover:bg-ds-surface-sunken disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="First page"
        >
          First
        </button>
      )}

      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="rounded-ds-md px-3 py-2 text-sm font-medium text-ds-text-secondary hover:bg-ds-surface-sunken disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Previous page"
      >
        Previous
      </button>

      {visiblePages.map((page, index) => {
        if (page === "...") {
          return (
            <span key={`ellipsis-${index}`} className="px-3 py-2 text-ds-text-tertiary">
              ...
            </span>
          );
        }

        const pageNum = page as number;
        const isActive = pageNum === currentPage;

        return (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={cn(
              "rounded-ds-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-ds-brand-primary text-ds-text-inverse hover:bg-ds-brand-primary-hover"
                : "text-ds-text-secondary hover:bg-ds-surface-sunken"
            )}
            aria-label={`Page ${pageNum}`}
            aria-current={isActive ? "page" : undefined}
          >
            {pageNum}
          </button>
        );
      })}

      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="rounded-ds-md px-3 py-2 text-sm font-medium text-ds-text-secondary hover:bg-ds-surface-sunken disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Next page"
      >
        Next
      </button>

      {showFirstLast && (
        <button
          onClick={handleLast}
          disabled={currentPage === totalPages}
          className="rounded-ds-md px-3 py-2 text-sm font-medium text-ds-text-secondary hover:bg-ds-surface-sunken disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Last page"
        >
          Last
        </button>
      )}
    </div>
  );
}

export interface SimplePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function SimplePagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: SimplePaginationProps) {
  const handlePrevious = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="rounded-ds-md px-4 py-2 text-sm font-medium text-ds-text-secondary hover:bg-ds-surface-sunken disabled:cursor-not-allowed disabled:opacity-50"
      >
        Previous
      </button>

      <span className="text-sm text-ds-text-secondary">
        Page {currentPage} of {totalPages}
      </span>

      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="rounded-ds-md px-4 py-2 text-sm font-medium text-ds-text-secondary hover:bg-ds-surface-sunken disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
