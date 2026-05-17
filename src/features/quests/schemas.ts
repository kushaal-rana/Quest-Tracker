import { z } from "zod";
import { QUEST_CATEGORIES, QUEST_MEASURES, QUEST_TYPES } from "@/lib/db/schema";

/**
 * Zod schemas — runtime validation source of truth.
 *
 * Used by:
 * - Server Actions (parse FormData)
 * - Forms (derive field types + error messages)
 *
 * TS types are inferred via z.infer so we never define a shape twice.
 */

const trimmed = (max: number) =>
  z.string().trim().min(1, "Required").max(max, `Must be ${max} characters or fewer`);

/** Lessons paste-block: split by newline, trim, drop empties. */
const lessonsList = z
  .string()
  .optional()
  .transform((raw) =>
    (raw ?? "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
  )
  .pipe(z.array(z.string().max(200)).max(200));

export const createQuestSchema = z.object({
  name: trimmed(100),
  type: z.enum(QUEST_TYPES),
  category: z.enum(QUEST_CATEGORIES),
  measure: z.enum(QUEST_MEASURES),
  targetCount: z.coerce.number().int().min(1, "Must be at least 1").max(10_000),
  /** Optional newline-separated lesson titles (only meaningful when measure=lessons). */
  lessons: lessonsList.optional(),
});

export type CreateQuestInput = z.infer<typeof createQuestSchema>;

export const updateQuestSchema = z.object({
  id: z.string().uuid(),
  name: trimmed(100),
  type: z.enum(QUEST_TYPES),
  category: z.enum(QUEST_CATEGORIES),
  targetCount: z.coerce.number().int().min(1).max(10_000),
});

export type UpdateQuestInput = z.infer<typeof updateQuestSchema>;

export const archiveQuestSchema = z.object({
  id: z.string().uuid(),
});

export type ArchiveQuestInput = z.infer<typeof archiveQuestSchema>;

// FormState + INITIAL_FORM_STATE moved to @/lib/forms (shared across features).
// Re-exported here for backwards-compatible imports from inside the quests feature.
export { type FormState, INITIAL_FORM_STATE } from "@/lib/forms";
