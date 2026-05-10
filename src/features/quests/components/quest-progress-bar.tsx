import { progressBarColor } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Props = {
  /** 0..1+ — values > 1 are clamped to 100% visually but still color "complete" */
  progress: number;
  /** Optional override for height — default `h-2` */
  className?: string;
  /** Show numeric % at the right end */
  showLabel?: boolean;
};

/**
 * Linear progress bar, color-coded by completion.
 *   < 25%  → red
 *   25–60% → amber
 *   > 60%  → green
 *
 * Accessible: includes aria-valuenow / valuemin / valuemax + role="progressbar".
 */
export function QuestProgressBar({ progress, className, showLabel = false }: Props) {
  const clamped = Math.max(0, Math.min(1, progress));
  const pct = Math.round(clamped * 100);
  const color = progressBarColor(clamped);

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-500", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="w-10 shrink-0 text-right font-mono text-[12px] tabular-nums text-muted-foreground">
          {pct}%
        </span>
      )}
    </div>
  );
}
