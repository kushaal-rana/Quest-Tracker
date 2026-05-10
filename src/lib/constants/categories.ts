import type { QuestCategory } from "@/lib/db/schema";

/**
 * Quest categories — visual + semantic metadata for each.
 *
 * Color psychology choices (locked):
 * - Life     → green   (vitality, growth, balance)
 * - Work     → indigo  (focus, depth, professional)
 * - Side     → amber   (energy, exploration, side-bet)
 *
 * Hex values map to the OKLCH design tokens in globals.css for consistency
 * with charts, sparklines, and pace indicators.
 */
export const CATEGORY_META: Record<
  QuestCategory,
  {
    label: string;
    description: string;
    /** Hex for storage in DB.color column (used by sparklines, dots, charts). */
    color: string;
    /** Tailwind background utility for category tag pills. */
    tagBg: string;
    /** Tailwind text utility for category tag pills. */
    tagText: string;
    /** Tailwind border utility for tag pills. */
    tagBorder: string;
  }
> = {
  life: {
    label: "Life",
    description: "Health, relationships, personal growth",
    color: "#10B981", // green-500 (matches --pace-good)
    tagBg: "bg-emerald-50",
    tagText: "text-emerald-700",
    tagBorder: "border-emerald-200",
  },
  work: {
    label: "Work",
    description: "Career, deep work, professional projects",
    color: "#6366F1", // indigo-500 (matches --primary)
    tagBg: "bg-indigo-50",
    tagText: "text-indigo-700",
    tagBorder: "border-indigo-200",
  },
  side: {
    label: "Side",
    description: "Side projects, hobbies, exploration",
    color: "#F59E0B", // amber-500 (matches --pace-warn)
    tagBg: "bg-amber-50",
    tagText: "text-amber-700",
    tagBorder: "border-amber-200",
  },
};

/**
 * For form selects + display lists, in display order.
 */
export const CATEGORY_OPTIONS: ReadonlyArray<{
  value: QuestCategory;
  label: string;
  color: string;
  description: string;
}> = (Object.entries(CATEGORY_META) as Array<[QuestCategory, (typeof CATEGORY_META)[QuestCategory]]>).map(
  ([value, meta]) => ({
    value,
    label: meta.label,
    color: meta.color,
    description: meta.description,
  }),
);

/**
 * Resolve the canonical color for a quest from its category.
 * Saves the form from asking "what color?" — derive from category.
 */
export function colorForCategory(category: QuestCategory): string {
  return CATEGORY_META[category].color;
}
