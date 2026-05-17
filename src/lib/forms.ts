/**
 * Form state shape — shared across all Server Actions in the app.
 *
 * Used by React 19's `useActionState((prev: FormState, fd: FormData) => Promise<FormState>, INITIAL_FORM_STATE)`.
 * Features can extend this with their own `data` payload (see `SessionFormState`,
 * `LessonFormState` for examples).
 *
 * Lives in `src/lib/` (not `src/features/quests/`) so other features don't have
 * to reach into the quests feature just to share a base type.
 */

export type FormState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const INITIAL_FORM_STATE: FormState = { ok: false };
