"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { lessons, quests } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";
import { crossedMilestone } from "@/lib/celebrate";
import { nextLessonPosition } from "./queries";
import {
  createLessonSchema,
  deleteLessonSchema,
  type LessonFormState,
  toggleLessonSchema,
  updateLessonTitleSchema,
} from "./schemas";

/**
 * Lessons — Server Actions.
 *
 * Create, rename, toggle complete, hard delete.
 * Toggle returns metadata for the client so it knows when to fire confetti.
 */

// ─── Create ──────────────────────────────────────────────────────────────────

export async function createLessonAction(
  _prev: LessonFormState,
  formData: FormData,
): Promise<LessonFormState> {
  const user = await requireUser();

  const parsed = createLessonSchema.safeParse({
    questId: formData.get("questId"),
    title: formData.get("title"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Couldn't add lesson.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const position = await nextLessonPosition(user.id, parsed.data.questId);

  await db.insert(lessons).values({
    userId: user.id,
    questId: parsed.data.questId,
    title: parsed.data.title,
    position,
  });

  revalidatePath(ROUTES.questDetail(parsed.data.questId));
  return { ok: true };
}

// ─── Rename ──────────────────────────────────────────────────────────────────

export async function updateLessonTitleAction(
  _prev: LessonFormState,
  formData: FormData,
): Promise<LessonFormState> {
  const user = await requireUser();

  const parsed = updateLessonTitleSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Couldn't rename lesson.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const lesson = await db.query.lessons.findFirst({
    where: and(eq(lessons.id, parsed.data.id), eq(lessons.userId, user.id)),
  });
  if (!lesson) return { ok: false, message: "Lesson not found." };

  await db
    .update(lessons)
    .set({ title: parsed.data.title })
    .where(and(eq(lessons.id, parsed.data.id), eq(lessons.userId, user.id)));

  revalidatePath(ROUTES.questDetail(lesson.questId));
  return { ok: true };
}

// ─── Toggle complete ─────────────────────────────────────────────────────────

export async function toggleLessonAction(
  _prev: LessonFormState,
  formData: FormData,
): Promise<LessonFormState> {
  const user = await requireUser();

  const parsed = toggleLessonSchema.safeParse({
    id: formData.get("id"),
    currentlyComplete: formData.get("currentlyComplete"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Couldn't toggle lesson." };
  }

  const lesson = await db.query.lessons.findFirst({
    where: and(eq(lessons.id, parsed.data.id), eq(lessons.userId, user.id)),
  });
  if (!lesson) return { ok: false, message: "Lesson not found." };

  // Need quest + before-progress to detect milestone crossing
  const quest = await db.query.quests.findFirst({
    where: and(eq(quests.id, lesson.questId), eq(quests.userId, user.id)),
  });
  if (!quest) return { ok: false, message: "Quest not found." };

  const becameComplete = parsed.data.currentlyComplete === "false";
  const beforeFraction = await calcLessonsFraction(user.id, quest.id, quest.targetCount);

  await db
    .update(lessons)
    .set({ completedAt: becameComplete ? new Date() : null })
    .where(and(eq(lessons.id, parsed.data.id), eq(lessons.userId, user.id)));

  const afterFraction = await calcLessonsFraction(user.id, quest.id, quest.targetCount);
  const milestone = becameComplete ? crossedMilestone(beforeFraction, afterFraction) : null;

  revalidatePath(ROUTES.dashboard);
  revalidatePath(ROUTES.questDetail(quest.id));

  return {
    ok: true,
    data: {
      becameComplete,
      crossedMilestone: milestone ?? undefined,
    },
  };
}

// ─── Delete ──────────────────────────────────────────────────────────────────

export async function deleteLessonAction(
  _prev: LessonFormState,
  formData: FormData,
): Promise<LessonFormState> {
  const user = await requireUser();

  const parsed = deleteLessonSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { ok: false, message: "Invalid lesson id." };

  const lesson = await db.query.lessons.findFirst({
    where: and(eq(lessons.id, parsed.data.id), eq(lessons.userId, user.id)),
  });
  if (!lesson) return { ok: false, message: "Lesson not found." };

  await db
    .delete(lessons)
    .where(and(eq(lessons.id, parsed.data.id), eq(lessons.userId, user.id)));

  revalidatePath(ROUTES.dashboard);
  revalidatePath(ROUTES.questDetail(lesson.questId));
  return { ok: true };
}

// ─── Helper ──────────────────────────────────────────────────────────────────

async function calcLessonsFraction(userId: string, questId: string, target: number): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(lessons)
    .where(
      and(
        eq(lessons.userId, userId),
        eq(lessons.questId, questId),
        sql`${lessons.completedAt} is not null`,
      ),
    );
  return Number(result[0]?.count ?? 0) / target;
}
