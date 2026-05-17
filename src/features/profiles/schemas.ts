import { z } from "zod";
import type { FormState } from "@/lib/forms";

export type { FormState };
export { INITIAL_FORM_STATE } from "@/lib/forms";

export const upsertProfileSchema = z.object({
  timezone: z.string().min(1, "Timezone is required"),
  displayNameOverride: z
    .string()
    .max(50, "Display name must be 50 characters or fewer")
    .optional(),
});

export type UpsertProfileInput = z.infer<typeof upsertProfileSchema>;
