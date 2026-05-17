import { cn } from "@/lib/utils";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

type Props = {
  /**
   * Array of 7 entries, Mon → Sun.
   * Each entry: total hours logged that day.
   */
  days: number[];
};

/**
 * 7-circle heatmap, Mon → Sun.
 *
 * Color intensity by hours:
 *   0h   → muted gray (no session)
 *   0-1h → light green
 *   1-3h → green
 *   3h+  → dark green
 */
export function WeekHeatmap({ days }: Props) {
  return (
    <div className="flex items-end gap-2">
      {DAY_LABELS.map((label, i) => {
        const hrs = days[i] ?? 0;
        return (
          <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className={cn("h-8 w-8 rounded-full border", circleClass(hrs))}
              title={`${label}: ${hrs > 0 ? `${Math.round(hrs * 10) / 10}h` : "no session"}`}
            />
            <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function circleClass(hours: number): string {
  if (hours === 0) return "border-border bg-muted/40";
  if (hours < 1) return "border-emerald-200 bg-emerald-100";
  if (hours < 3) return "border-emerald-400 bg-emerald-300";
  return "border-emerald-600 bg-emerald-500";
}
