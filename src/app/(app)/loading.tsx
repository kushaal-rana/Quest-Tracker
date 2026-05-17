import { Skeleton } from "./_components/skeleton";

/**
 * Dashboard loading skeleton.
 *
 * Shown by Next.js automatically while `/` is fetching user + quarter + quests.
 * Mimics the dashboard layout so the page doesn't jump on hand-off.
 */
export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl">
      {/* "Q2 2026 · Day X of Y" line */}
      <Skeleton className="mb-3 h-4 w-48" />

      {/* "Good morning, ..." + button row */}
      <div className="flex items-end justify-between gap-4">
        <Skeleton className="h-12 w-80 md:h-14" />
        <Skeleton className="h-11 w-32" />
      </div>

      {/* Subtitle */}
      <Skeleton className="mt-3 h-5 w-64" />

      {/* Table */}
      <div className="mt-10 rounded-xl border border-border bg-card">
        {/* Header */}
        <div className="grid grid-cols-[minmax(0,2.4fr)_minmax(0,3fr)_minmax(0,1.6fr)_auto] gap-6 border-b border-border px-4 py-2.5">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-3 w-10 justify-self-end" />
        </div>
        {/* Rows */}
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="grid grid-cols-[minmax(0,2.4fr)_minmax(0,3fr)_minmax(0,1.6fr)_auto] items-center gap-6 border-b border-border px-4 py-4 last:border-b-0"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-2.5 w-2.5 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-20 justify-self-end rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
