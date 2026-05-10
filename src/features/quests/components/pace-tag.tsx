import { classifyPace, PACE_META } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Props = {
  /** 0..1+ progress fraction */
  progress: number;
  /** 0..1 quarter elapsed fraction */
  elapsed: number;
  /** Smaller variant for table rows */
  size?: "sm" | "md";
};

/**
 * Color-coded pace status pill: ✓ On pace · ↑ Ahead · ↓ Slowing · ⚠ At risk
 */
export function PaceTag({ progress, elapsed, size = "sm" }: Props) {
  const state = classifyPace(progress, elapsed);
  const meta = PACE_META[state];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium tabular-nums",
        meta.bg,
        meta.text,
        meta.border,
        size === "sm" ? "px-2 py-0.5 text-[12px]" : "px-2.5 py-1 text-[13px]",
      )}
      title={`Progress vs quarter elapsed`}
    >
      <span aria-hidden="true">{meta.icon}</span>
      <span>{meta.label}</span>
    </span>
  );
}
