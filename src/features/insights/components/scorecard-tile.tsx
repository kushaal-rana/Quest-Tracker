import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string | number;
  subtext?: string;
  Icon: LucideIcon;
  /** Tailwind text color class for the icon. Default: text-muted-foreground */
  iconColor?: string;
  /** Tailwind text color class for the value. Default: text-foreground */
  valueColor?: string;
};

/**
 * Scorecard tile — used in the dashboard header and page summaries.
 *
 * Compact card: icon + label on top, big value + subtext below.
 */
export function ScorecardTile({ label, value, subtext, Icon, iconColor, valueColor }: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <Icon
          className={cn("h-4 w-4 shrink-0", iconColor ?? "text-muted-foreground")}
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <span className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div>
        <div className={cn("font-mono text-[28px] font-semibold leading-none", valueColor ?? "text-foreground")}>
          {value}
        </div>
        {subtext && (
          <div className="mt-1 text-[12px] text-muted-foreground">{subtext}</div>
        )}
      </div>
    </div>
  );
}
