"use client";

import { Skeleton } from "antd";
import { LoadingSpinner } from "@/components/ui";

export default function BuyerLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page title skeleton */}
      <Skeleton.Input active className="mb-6 w-48 h-8" />

      {/* Content grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-ds-surface-base rounded-ds-lg overflow-hidden shadow-ds-sm">
            <div className="relative h-48 w-full animate-pulse bg-ds-surface-sunken">
              <div className="absolute inset-0 flex items-center justify-center">
                <LoadingSpinner size="sm" className="text-ds-brand-muted" />
              </div>
            </div>
            <div className="p-4 space-y-2">
              <Skeleton active paragraph={{ rows: 2 }} title={false} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
