import "server-only";

import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions, lessons, type Session } from "@/lib/db/schema";

/**
 * Sessions — read operations.
 *
 * Includes lesson title via JOIN when a session is tied to a completed lesson,
 * so the recent-sessions list can show "Logged 1.5h · completed Lesson 3".
 */

export type SessionWithLesson = Session & {
  lessonTitle: string | null;
};

/**
 * Recent sessions for a single quest (most recent first).
 * Default 20; pass a limit for larger lists.
 */
export async function listSessionsForQuest(
  userId: string,
  questId: string,
  limit = 20,
): Promise<SessionWithLesson[]> {
  const rows = await db
    .select({
      session: sessions,
      lessonTitle: lessons.title,
    })
    .from(sessions)
    .leftJoin(lessons, eq(lessons.id, sessions.lessonId))
    .where(and(eq(sessions.userId, userId), eq(sessions.questId, questId)))
    .orderBy(desc(sessions.loggedAt))
    .limit(limit);

  return rows.map(({ session, lessonTitle }) => ({
    ...session,
    lessonTitle,
  }));
}

/**
 * Activity series for a quest — daily total hours over the last N days.
 * Used to drive the sparkline.
 *
 * Returns oldest-first array of length `days`, with 0 for days with no sessions.
 */
export async function getQuestActivity(
  userId: string,
  questId: string,
  days = 14,
): Promise<{ date: string; hours: number }[]> {
  // Build date floor (N days ago, midnight UTC)
  const now = new Date();
  const floor = new Date(now);
  floor.setUTCHours(0, 0, 0, 0);
  floor.setUTCDate(floor.getUTCDate() - (days - 1));

  // Aggregate sessions grouped by UTC date
  const rows = await db
    .select({
      day: sql<string>`to_char(${sessions.loggedAt} at time zone 'UTC', 'YYYY-MM-DD')`,
      hours: sql<number>`coalesce(sum(${sessions.hours})::float, 0)`,
    })
    .from(sessions)
    .where(
      and(
        eq(sessions.userId, userId),
        eq(sessions.questId, questId),
        gte(sessions.loggedAt, floor),
      ),
    )
    .groupBy(sql`to_char(${sessions.loggedAt} at time zone 'UTC', 'YYYY-MM-DD')`);

  const map = new Map(rows.map((r) => [r.day, Number(r.hours) || 0]));

  // Fill missing days with 0
  const series: { date: string; hours: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(floor);
    d.setUTCDate(floor.getUTCDate() + i);
    const iso = d.toISOString().slice(0, 10);
    series.push({ date: iso, hours: map.get(iso) ?? 0 });
  }
  return series;
}

/**
 * Get a session by id, scoped to user.
 */
export async function getSessionById(userId: string, sessionId: string): Promise<Session | null> {
  const row = await db.query.sessions.findFirst({
    where: and(eq(sessions.id, sessionId), eq(sessions.userId, userId)),
  });
  return row ?? null;
}
