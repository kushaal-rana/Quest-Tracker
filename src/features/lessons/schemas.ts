import { z } from "zod";

/**
 * Lessons — Zod schemas.
 *
 * Lessons are the user-managed checklist for `measure='lessons'` quests.
 * Hard delete is allowed (Phase 3 Q1 = A) — sessions that referenced the lesson
 * keep their row but get `lesson_id = null` via the schema's ON DELETE SET NULL.
 */

const trimmed = (max: number) =>
  z.string().trim().min(1, "Required").max(max, `Must be ${max} characters or fewer`);

export const createLessonSchema = z.object({
  questId: z.string().uuid(),
  title: trimmed(200),
});
export type CreateLessonInput = z.infer<typeof createLessonSchema>;

export const updateLessonTitleSchema = z.object({
  id: z.string().uuid(),
  title: trimmed(200),
});
export type UpdateLessonTitleInput = z.infer<typeof updateLessonTitleSchema>;

export const toggleLessonSchema = z.object({
  id: z.string().uuid(),
  /** Pass "true" if currently complete (so we should un-complete) */
  currentlyComplete: z.enum(["true", "false"]),
});
export type ToggleLessonInput = z.infer<typeof toggleLessonSchema>;

export const deleteLessonSchema = z.object({
  id: z.string().uuid(),
});
export type DeleteLessonInput = z.infer<typeof deleteLessonSchema>;

// ─── Action result type (carries celebration metadata) ───────────────────────

import type { FormState } from "@/lib/forms";

export type LessonFormState = FormState & {
  data?: {
    /** True when this toggle just transitioned a lesson INTO complete state */
    becameComplete?: boolean;
    /** Set when this completion crossed a quest progress milestone */
    crossedMilestone?: 25 | 50 | 75 | 100;
  };
};

export const INITIAL_LESSON_STATE: LessonFormState = { ok: false };
