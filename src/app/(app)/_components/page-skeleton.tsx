import { Skeleton } from "./skeleton";

/**
 * Generic page-level loading skeleton.
 * Used by sidebar page loading.tsx files — shows immediately on navigation
 * while the RSC fetches data from the database.
 */
export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Page title */}
      <div className="space-y-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-5 w-72" />
      </div>

      {/* Scorecard tiles row */}
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>

      {/* Main content card */}
      <Skeleton className="h-64 rounded-xl" />

      {/* Secondary card */}
      <Skeleton className="h-40 rounded-xl" />
    </div>
  );
}
