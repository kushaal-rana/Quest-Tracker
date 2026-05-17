import "server-only";

import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { quests, lessons, sessions, type Quest } from "@/lib/db/schema";

/**
 * Quests — read operations.
 *
 * Always pass `userId` explicitly. Defense-in-depth on top of RLS.
 */

export type QuestWithProgress = Quest & {
  /** Count of completed lessons (only meaningful when measure=lessons) */
  lessonsCompleted: number;
  /** Total hours logged across sessions */
  hoursLogged: number;
  /**
   * Unified progress fraction (0..1+):
   *   measure=lessons → lessonsCompleted / targetCount
   *   measure=hours   → hoursLogged / targetCount
   */
  progress: number;
  /** Timestamp of the most recent session, or null if none logged yet */
  lastLoggedAt: Date | null;
};

/**
 * List all non-archived quests in a quarter, with computed progress.
 * One round-trip — we use SQL aggregates instead of N+1 queries.
 */
export async function listQuestsForQuarter(
  userId: string,
  quarterId: string,
): Promise<QuestWithProgress[]> {
  const rows = await db
    .select({
      quest: quests,
      lessonsCompleted: sql<number>`coalesce((
        select count(*)::int
        from ${lessons}
        where ${lessons.questId} = ${quests.id}
          and ${lessons.completedAt} is not null
      ), 0)`,
      hoursLogged: sql<number>`coalesce((
        select sum(${sessions.hours})::float
        from ${sessions}
        where ${sessions.questId} = ${quests.id}
      ), 0)`,
      lastLoggedAt: sql<Date | null>`
        GREATEST(
          (select max(${sessions.loggedAt}) from ${sessions} where ${sessions.questId} = ${quests.id}),
          (select max(${lessons.completedAt}) from ${lessons} where ${lessons.questId} = ${quests.id})
        )
      `,
    })
    .from(quests)
    .where(
      and(
        eq(quests.userId, userId),
        eq(quests.quarterId, quarterId),
        eq(quests.archived, false),
      ),
    )
    .orderBy(asc(quests.position), asc(quests.createdAt));

  return rows.map(({ quest, lessonsCompleted, hoursLogged, lastLoggedAt }) => {
    const progress =
      quest.measure === "lessons"
        ? lessonsCompleted / quest.targetCount
        : hoursLogged / quest.targetCount;

    return {
      ...quest,
      lessonsCompleted,
      hoursLogged,
      progress,
      lastLoggedAt: lastLoggedAt ?? null,
    };
  });
}

/**
 * Get a single quest by id, scoped to the user.
 */
export async function getQuestById(userId: string, questId: string): Promise<Quest | null> {
  const row = await db.query.quests.findFirst({
    where: and(eq(quests.id, questId), eq(quests.userId, userId)),
  });
  return row ?? null;
}

/**
 * Lightweight quest list — for the ⌘K palette + other selectors.
 * Returns just enough to render a row: id, name, color, measure.
 */
export type QuestPickerRow = {
  id: string;
  name: string;
  color: string;
  measure: "lessons" | "hours";
};

export async function listActiveQuestsForPicker(
  userId: string,
  quarterId: string,
): Promise<QuestPickerRow[]> {
  const rows = await db
    .select({
      id: quests.id,
      name: quests.name,
      color: quests.color,
      measure: quests.measure,
    })
    .from(quests)
    .where(
      and(
        eq(quests.userId, userId),
        eq(quests.quarterId, quarterId),
        eq(quests.archived, false),
      ),
    )
    .orderBy(asc(quests.position), asc(quests.createdAt));

  return rows;
}

/**
 * List all archived quests in a quarter, with computed progress.
 * Same shape as listQuestsForQuarter — just flips the archived filter.
 */
export async function listArchivedQuestsForQuarter(
  userId: string,
  quarterId: string,
): Promise<QuestWithProgress[]> {
  const rows = await db
    .select({
      quest: quests,
      lessonsCompleted: sql<number>`coalesce((
        select count(*)::int
        from ${lessons}
        where ${lessons.questId} = ${quests.id}
          and ${lessons.completedAt} is not null
      ), 0)`,
      hoursLogged: sql<number>`coalesce((
        select sum(${sessions.hours})::float
        from ${sessions}
        where ${sessions.questId} = ${quests.id}
      ), 0)`,
      lastLoggedAt: sql<Date | null>`
        GREATEST(
          (select max(${sessions.loggedAt}) from ${sessions} where ${sessions.questId} = ${quests.id}),
          (select max(${lessons.completedAt}) from ${lessons} where ${lessons.questId} = ${quests.id})
        )
      `,
    })
    .from(quests)
    .where(
      and(
        eq(quests.userId, userId),
        eq(quests.quarterId, quarterId),
        eq(quests.archived, true),
      ),
    )
    .orderBy(asc(quests.position), asc(quests.createdAt));

  return rows.map(({ quest, lessonsCompleted, hoursLogged, lastLoggedAt }) => {
    const progress =
      quest.measure === "lessons"
        ? lessonsCompleted / quest.targetCount
        : hoursLogged / quest.targetCount;
    return { ...quest, lessonsCompleted, hoursLogged, progress, lastLoggedAt: lastLoggedAt ?? null };
  });
}

/**
 * Next position number for a new quest in a quarter (append to bottom).
 */
export async function nextPositionForQuarter(userId: string, quarterId: string): Promise<number> {
  const result = await db
    .select({ max: sql<number | null>`max(${quests.position})` })
    .from(quests)
    .where(and(eq(quests.userId, userId), eq(quests.quarterId, quarterId)));
  const max = result[0]?.max;
  return (max ?? -1) + 1;
}
