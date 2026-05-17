import "server-only";

import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { lessons, type Lesson } from "@/lib/db/schema";

/**
 * Lessons — read operations.
 */

/**
 * All lessons for a quest, ordered by position then created_at.
 */
export async function listLessonsForQuest(userId: string, questId: string): Promise<Lesson[]> {
  return db.query.lessons.findMany({
    where: and(eq(lessons.userId, userId), eq(lessons.questId, questId)),
    orderBy: [asc(lessons.position), asc(lessons.id)],
  });
}

/**
 * Open (incomplete) lessons for a quest — used by the session log form's
 * "completed lesson?" select.
 */
export async function listOpenLessonsForQuest(userId: string, questId: string): Promise<Lesson[]> {
  return db.query.lessons.findMany({
    where: and(
      eq(lessons.userId, userId),
      eq(lessons.questId, questId),
      sql`${lessons.completedAt} is null`,
    ),
    orderBy: [asc(lessons.position), asc(lessons.id)],
  });
}

/**
 * Next position for a new lesson (append to bottom).
 */
export async function nextLessonPosition(userId: string, questId: string): Promise<number> {
  const result = await db
    .select({ max: sql<number | null>`max(${lessons.position})` })
    .from(lessons)
    .where(and(eq(lessons.userId, userId), eq(lessons.questId, questId)));
  const max = result[0]?.max;
  return (max ?? -1) + 1;
}
