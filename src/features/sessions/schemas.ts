import { z } from "zod";
import { parseHours } from "@/lib/format/hours";

/**
 * Sessions — Zod schemas (validation source of truth).
 *
 * Hours come in as strings ("1h30m", "1.5", "0:30") from the form, get parsed
 * via the hours parser. The parser returns null on invalid input → zod errors.
 */

const hoursString = z
  .string()
  .min(1, "Required")
  .transform((raw, ctx) => {
    const parsed = parseHours(raw);
    if (parsed === null) {
      ctx.addIssue({
        code: "custom",
        message: "Use 1h30m, 90m, 1.5, or 1:30",
      });
      return z.NEVER;
    }
    return parsed;
  });

export const createSessionSchema = z.object({
  questId: z.string().uuid(),
  hours: hoursString,
  note: z.string().trim().max(500).optional(),
  /** Optional — when set, also marks the lesson complete. */
  lessonId: z.string().uuid().optional(),
  /** ISO timestamp; defaults to "now" in the action if omitted. */
  loggedAt: z.string().optional(),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;

export const updateSessionNoteSchema = z.object({
  id: z.string().uuid(),
  note: z.string().trim().max(500),
});

export type UpdateSessionNoteInput = z.infer<typeof updateSessionNoteSchema>;

export const deleteSessionSchema = z.object({
  id: z.string().uuid(),
});

export type DeleteSessionInput = z.infer<typeof deleteSessionSchema>;

// ─── Action result type (carries metadata for client-side celebrations) ──────

import type { FormState } from "@/lib/forms";

export type SessionFormState = FormState & {
  data?: {
    /** Total streak in days after this session */
    streakDays: number;
    /** Set when this session caused the quest progress to cross a milestone */
    crossedMilestone?: 25 | 50 | 75 | 100;
    /** Set when this session pushed the streak to a milestone day */
    streakIsMilestone?: boolean;
    /** Hours logged in this session (for the success toast) */
    hoursLogged?: number;
    /** Quest name (for the success toast) */
    questName?: string;
  };
};

export const INITIAL_SESSION_STATE: SessionFormState = { ok: false };
