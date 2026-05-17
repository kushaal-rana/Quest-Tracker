import { Skeleton } from "../../../_components/skeleton";

export default function EditQuestLoading() {
  return (
    <div className="mx-auto max-w-4xl">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-5 h-11 w-48" />
      <Skeleton className="mt-3 h-5 w-3/4" />

      <div className="mt-10 space-y-8">
        {/* Quest name */}
        <div>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-2.5 h-4 w-48" />
          <Skeleton className="mt-2 h-11 w-full" />
        </div>

        {/* Type + Category */}
        <div className="grid gap-8 sm:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-11 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-11 w-full" />
          </div>
        </div>

        {/* Measure + Target */}
        <div className="grid gap-8 sm:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-11 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-11 w-full" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-border pt-6">
          <Skeleton className="h-11 w-20" />
          <Skeleton className="h-11 w-32" />
        </div>
      </div>
    </div>
  );
}
