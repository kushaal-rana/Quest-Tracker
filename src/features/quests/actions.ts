"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { quests, lessons } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { ROUTES, colorForCategory } from "@/lib/constants";
import { getOrCreateCurrentQuarter } from "@/features/quarters/queries";
import { nextPositionForQuarter } from "./queries";
import {
  archiveQuestSchema,
  createQuestSchema,
  updateQuestSchema,
  type FormState,
} from "./schemas";

/**
 * Server Actions — quest mutations.
 *
 * Pattern:
 * - Use React 19 useActionState shape: (prevState, formData) => state
 * - Validate via Zod, return field errors for the form to render
 * - All writes go through Drizzle (admin connection); we manually scope by userId
 * - revalidatePath after success so RSC re-fetches
 *
 * NOTE: Next.js "use server" files can only export async functions.
 * The FormState type and INITIAL_FORM_STATE constant live in schemas.ts.
 */

// ─── Create ──────────────────────────────────────────────────────────────────

export async function createQuestAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const parsed = createQuestSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    category: formData.get("category"),
    measure: formData.get("measure"),
    targetCount: formData.get("targetCount"),
    // formData.get returns `null` when a field isn't rendered (lessons textarea
    // is hidden when measure=hours). Zod's `.optional()` only accepts undefined.
    lessons: formData.get("lessons") ?? undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const input = parsed.data;
  const quarter = await getOrCreateCurrentQuarter(user.id);
  const position = await nextPositionForQuarter(user.id, quarter.id);

  // Insert quest + (optional) lessons in a single transaction
  await db.transaction(async (tx) => {
    const [quest] = await tx
      .insert(quests)
      .values({
        userId: user.id,
        quarterId: quarter.id,
        name: input.name,
        type: input.type,
        category: input.category,
        measure: input.measure,
        targetCount: input.targetCount,
        color: colorForCategory(input.category),
        position,
      })
      .returning({ id: quests.id });

    if (input.measure === "lessons" && input.lessons && input.lessons.length > 0) {
      await tx.insert(lessons).values(
        input.lessons.map((title, idx) => ({
          userId: user.id,
          questId: quest.id,
          title,
          position: idx,
        })),
      );
    }
  });

  revalidatePath(ROUTES.dashboard);
  redirect(ROUTES.dashboard);
}

// ─── Update ──────────────────────────────────────────────────────────────────

export async function updateQuestAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const parsed = updateQuestSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    type: formData.get("type"),
    category: formData.get("category"),
    targetCount: formData.get("targetCount"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const input = parsed.data;

  await db
    .update(quests)
    .set({
      name: input.name,
      type: input.type,
      category: input.category,
      targetCount: input.targetCount,
      color: colorForCategory(input.category),
    })
    .where(and(eq(quests.id, input.id), eq(quests.userId, user.id)));

  revalidatePath(ROUTES.dashboard);
  revalidatePath(ROUTES.questDetail(input.id));
  redirect(ROUTES.questDetail(input.id));
}

// ─── Archive (soft delete) ───────────────────────────────────────────────────

export async function archiveQuestAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const parsed = archiveQuestSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return { ok: false, message: "Invalid quest id." };
  }

  await db
    .update(quests)
    .set({ archived: true })
    .where(and(eq(quests.id, parsed.data.id), eq(quests.userId, user.id)));

  revalidatePath(ROUTES.dashboard);
  redirect(ROUTES.dashboard);
}
