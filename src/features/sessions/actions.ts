"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { lessons, quests, sessions } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";
import { crossedMilestone, isStreakMilestone } from "@/lib/celebrate";
import { calcCurrentStreak } from "@/features/streaks/queries";
import {
  createSessionSchema,
  deleteSessionSchema,
  type SessionFormState,
  updateSessionNoteSchema,
} from "./schemas";

/**
 * Sessions — Server Actions.
 *
 * createSessionAction is the most-called mutation in the app — keep it fast.
 * Returns metadata so the client can fire the right celebrations:
 *   - streakDays      → for the toast and possible streak milestone burst
 *   - crossedMilestone → 25 / 50 / 75 / 100 if quest progress crossed a threshold
 *   - streakIsMilestone → true on day 3 / 7 / 14 / 30 / 60 / 90
 */

// ─── Create ──────────────────────────────────────────────────────────────────

export async function createSessionAction(
  _prev: SessionFormState,
  formData: FormData,
): Promise<SessionFormState> {
  const user = await requireUser();

  const parsed = createSessionSchema.safeParse({
    questId: formData.get("questId"),
    hours: formData.get("hours"),
    note: formData.get("note") ?? undefined,
    lessonId: formData.get("lessonId") ?? undefined,
    loggedAt: formData.get("loggedAt") ?? undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const input = parsed.data;
  const loggedAt = input.loggedAt ? new Date(input.loggedAt) : new Date();

  // Read quest BEFORE the write so we can compute progress delta
  const quest = await db.query.quests.findFirst({
    where: and(eq(quests.id, input.questId), eq(quests.userId, user.id)),
  });
  if (!quest) {
    return { ok: false, message: "Quest not found." };
  }

  // Compute "before" progress fraction
  const beforeProgress = await computeProgressFraction(user.id, quest.id, quest.measure, quest.targetCount);

  // Insert session + (if lessonId set) mark lesson complete — single transaction
  await db.transaction(async (tx) => {
    await tx.insert(sessions).values({
      userId: user.id,
      questId: input.questId,
      lessonId: input.lessonId ?? null,
      hours: input.hours.toString(),
      note: input.note ?? null,
      loggedAt,
    });

    if (input.lessonId) {
      // Only mark complete if not already complete (preserves original completion timestamp)
      await tx
        .update(lessons)
        .set({ completedAt: loggedAt })
        .where(
          and(
            eq(lessons.id, input.lessonId),
            eq(lessons.userId, user.id),
            sql`${lessons.completedAt} is null`,
          ),
        );
    }
  });

  // Compute "after" progress fraction + streak (parallel — no dependency)
  const [afterProgress, streakDays] = await Promise.all([
    computeProgressFraction(user.id, quest.id, quest.measure, quest.targetCount),
    calcCurrentStreak(user.id),
  ]);

  const milestone = crossedMilestone(beforeProgress, afterProgress);

  revalidatePath(ROUTES.dashboard);
  revalidatePath(ROUTES.questDetail(input.questId));

  return {
    ok: true,
    data: {
      streakDays,
      crossedMilestone: milestone ?? undefined,
      streakIsMilestone: isStreakMilestone(streakDays),
      hoursLogged: input.hours,
      questName: quest.name,
    },
  };
}

// ─── Update note (only field editable per Phase 3 Q5 = C) ────────────────────

export async function updateSessionNoteAction(
  _prev: SessionFormState,
  formData: FormData,
): Promise<SessionFormState> {
  const user = await requireUser();

  const parsed = updateSessionNoteSchema.safeParse({
    id: formData.get("id"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Couldn't save note.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // Need questId for revalidatePath — fetch first
  const session = await db.query.sessions.findFirst({
    where: and(eq(sessions.id, parsed.data.id), eq(sessions.userId, user.id)),
  });
  if (!session) return { ok: false, message: "Session not found." };

  await db
    .update(sessions)
    .set({ note: parsed.data.note || null })
    .where(and(eq(sessions.id, parsed.data.id), eq(sessions.userId, user.id)));

  revalidatePath(ROUTES.questDetail(session.questId));
  return { ok: true };
}

// ─── Delete (hard delete per Phase 3 Q1 = A) ─────────────────────────────────

export async function deleteSessionAction(
  _prev: SessionFormState,
  formData: FormData,
): Promise<SessionFormState> {
  const user = await requireUser();

  const parsed = deleteSessionSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { ok: false, message: "Invalid session id." };

  const session = await db.query.sessions.findFirst({
    where: and(eq(sessions.id, parsed.data.id), eq(sessions.userId, user.id)),
  });
  if (!session) return { ok: false, message: "Session not found." };

  await db
    .delete(sessions)
    .where(and(eq(sessions.id, parsed.data.id), eq(sessions.userId, user.id)));

  revalidatePath(ROUTES.dashboard);
  revalidatePath(ROUTES.questDetail(session.questId));
  return { ok: true };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Compute current progress fraction (0..1+) for a quest.
 * Used to detect milestone crossings before/after a session.
 */
async function computeProgressFraction(
  userId: string,
  questId: string,
  measure: "lessons" | "hours",
  targetCount: number,
): Promise<number> {
  if (measure === "lessons") {
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
    const completed = Number(result[0]?.count ?? 0);
    return completed / targetCount;
  }

  // measure === "hours"
  const result = await db
    .select({ total: sql<number>`coalesce(sum(${sessions.hours})::float, 0)` })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), eq(sessions.questId, questId)));
  const total = Number(result[0]?.total ?? 0);
  return total / targetCount;
}
