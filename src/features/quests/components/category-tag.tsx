import { CATEGORY_META } from "@/lib/constants";
import type { QuestCategory } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

type Props = {
  category: QuestCategory;
  size?: "sm" | "md";
  withDot?: boolean;
};

/**
 * Small colored pill for a quest's category (Life / Work / Side).
 */
export function CategoryTag({ category, size = "sm", withDot = true }: Props) {
  const meta = CATEGORY_META[category];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border font-medium",
        meta.tagBg,
        meta.tagText,
        meta.tagBorder,
        size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-[12px]",
      )}
    >
      {withDot && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: meta.color }}
          aria-hidden="true"
        />
      )}
      {meta.label}
    </span>
  );
}
