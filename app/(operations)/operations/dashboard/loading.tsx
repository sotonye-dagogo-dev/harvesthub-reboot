export default function OperationsDashboardLoading() {
  return (
    <div className="container mx-auto px-4 py-8 sm:py-10">
      <div className="h-8 w-56 animate-pulse rounded-ds-md bg-ds-surface-disabled" />
      <div className="mt-3 h-4 w-full max-w-2xl animate-pulse rounded-ds-md bg-ds-surface-disabled" />

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={`metric-skeleton-${idx}`}
            className="rounded-ds-lg border border-ds-border-base bg-ds-surface-base p-5"
          >
            <div className="h-5 w-24 animate-pulse rounded-ds-md bg-ds-surface-disabled" />
            <div className="mt-3 h-9 w-20 animate-pulse rounded-ds-md bg-ds-surface-disabled" />
            <div className="mt-3 h-4 w-full animate-pulse rounded-ds-md bg-ds-surface-disabled" />
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={`quick-action-skeleton-${idx}`}
            className="rounded-ds-lg border border-ds-border-base bg-ds-surface-base p-4"
          >
            <div className="h-5 w-36 animate-pulse rounded-ds-md bg-ds-surface-disabled" />
            <div className="mt-2 h-4 w-full animate-pulse rounded-ds-md bg-ds-surface-disabled" />
          </div>
        ))}
      </div>
    </div>
  );
}
