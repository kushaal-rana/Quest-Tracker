"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { quarters } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";
import type { FormState } from "@/lib/forms";

export async function saveReflectionAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const quarterId = formData.get("quarterId");
  if (!quarterId || typeof quarterId !== "string") {
    return { ok: false, message: "Invalid quarter." };
  }

  const reflection = (formData.get("reflection") as string) ?? "";

  await db
    .update(quarters)
    .set({ reflection })
    .where(and(eq(quarters.id, quarterId), eq(quarters.userId, user.id)));

  revalidatePath(ROUTES.dashboard);
  revalidatePath(ROUTES.quarter);
  revalidatePath(ROUTES.quarterReview(quarterId));
  return { ok: true, message: "Reflection saved." };
}
