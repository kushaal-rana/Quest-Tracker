import { Skeleton } from "../../_components/skeleton";

/**
 * Quest detail page loading skeleton.
 *
 * Shown by Next.js automatically while `/quest/[id]` fetches quest, activity,
 * sessions, and lessons (4 parallel queries). Mirrors the actual page layout
 * so the transition feels instant and there's no shift on hand-off.
 */
export default function QuestDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Back link */}
      <Skeleton className="h-4 w-32" />

      {/* Title row */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-3.5 w-3.5 rounded-full" />
            <Skeleton className="h-12 w-72 md:h-14" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-md" />
            <Skeleton className="h-6 w-20 rounded-md" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Sparkline card */}
      <div className="rounded-xl border border-border bg-card p-5">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="mt-2 h-14 w-full" />
      </div>

      {/* Session log form */}
      <div className="rounded-xl border border-border bg-card p-5">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="mt-1 h-4 w-3/4" />
        <div className="mt-4 grid gap-3 md:grid-cols-[150px_1fr_auto]">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Lessons card */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3.5 border-b border-border px-5 py-3 last:border-b-0"
          >
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-4 flex-1 max-w-md" />
          </div>
        ))}
      </div>

      {/* Recent sessions card */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-3/4" />
        </div>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="grid grid-cols-[120px_minmax(0,1fr)_auto] items-center gap-4 border-b border-border px-5 py-3.5 last:border-b-0"
          >
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
