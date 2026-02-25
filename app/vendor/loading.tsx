"use client";

import { Skeleton } from "antd";

export default function VendorLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <Skeleton.Input active className="w-48 h-8" />
        <Skeleton.Button active className="w-32 h-9" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-ds-surface-base rounded-ds-lg p-5 shadow-ds-sm">
            <Skeleton active paragraph={{ rows: 2 }} />
          </div>
        ))}
      </div>

      {/* Content area skeleton */}
      <div className="bg-ds-surface-base rounded-ds-lg p-5 shadow-ds-sm">
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    </div>
  );
}
