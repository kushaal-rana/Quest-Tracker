"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";
import { upsertProfileSchema, type FormState } from "./schemas";

export async function upsertProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const parsed = upsertProfileSchema.safeParse({
    timezone: formData.get("timezone"),
    displayNameOverride: (formData.get("displayNameOverride") as string) || undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { timezone, displayNameOverride } = parsed.data;

  await db
    .insert(profiles)
    .values({
      userId: user.id,
      timezone,
      displayNameOverride: displayNameOverride ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: {
        timezone,
        displayNameOverride: displayNameOverride ?? null,
        updatedAt: new Date(),
      },
    });

  revalidatePath(ROUTES.settings);
  return { ok: true, message: "Preferences saved." };
}
