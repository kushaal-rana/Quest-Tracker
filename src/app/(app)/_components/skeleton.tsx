import { cn } from "@/lib/utils";

/**
 * Loading skeleton block — pulsing gray rectangle.
 *
 * Used by route-level `loading.tsx` files to show placeholders while
 * Server Components fetch data. Width/height/shape controlled by className.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/60", className)}
      aria-hidden="true"
    />
  );
}
