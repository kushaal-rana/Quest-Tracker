import type { QuestMeasure } from "@/lib/db/schema";

/**
 * How a quest's progress is measured.
 *
 * lessons → discrete checkboxes (e.g. "Lesson 3 of 12 complete")
 *           Progress = completedLessons / targetCount
 *
 * hours   → continuous logged time (e.g. "23.5 / 40 hours")
 *           Progress = sumOfHours / targetCount
 */
export const MEASURE_META: Record<
  QuestMeasure,
  {
    label: string;
    /** Singular unit name, lowercase, used inline ("12 lessons", "40 hours") */
    unitPlural: string;
    /** Singular form, used when count == 1 ("1 lesson", "1 hour") */
    unitSingular: string;
    description: string;
  }
> = {
  lessons: {
    label: "Lessons",
    unitPlural: "lessons",
    unitSingular: "lesson",
    description: "Track discrete items completed (e.g. course chapters)",
  },
  hours: {
    label: "Hours",
    unitPlural: "hours",
    unitSingular: "hour",
    description: "Track time invested (e.g. practice, deep work)",
  },
};

export const MEASURE_OPTIONS: ReadonlyArray<{
  value: QuestMeasure;
  label: string;
  description: string;
}> = (Object.entries(MEASURE_META) as Array<[QuestMeasure, (typeof MEASURE_META)[QuestMeasure]]>).map(
  ([value, meta]) => ({
    value,
    label: meta.label,
    description: meta.description,
  }),
);

/**
 * Pluralize a count for the given measure.
 *   formatMeasure(1, "hours")  → "1 hour"
 *   formatMeasure(2.5, "hours") → "2.5 hours"
 *   formatMeasure(12, "lessons") → "12 lessons"
 */
export function formatMeasure(count: number, measure: QuestMeasure): string {
  const meta = MEASURE_META[measure];
  const unit = count === 1 ? meta.unitSingular : meta.unitPlural;
  return `${count} ${unit}`;
}
