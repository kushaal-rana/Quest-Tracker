import "server-only";

import { and, eq, ne, desc, count, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { quarters, quests, type Quarter } from "@/lib/db/schema";
import { quarterFor } from "@/lib/format/date";

/**
 * Quarters — read + write operations.
 *
 * All functions take `userId` explicitly (not implicit from session) so the
 * data layer is auth-agnostic and easy to test. Server Actions / pages call
 * these after `requireUser()`.
 */

/**
 * Get the active quarter for a user, creating it if it doesn't exist.
 *
 * Idempotent: relies on the unique (user_id, label) index. If a parallel
 * request creates the quarter first, we catch the unique-violation and refetch.
 */
export async function getOrCreateCurrentQuarter(userId: string): Promise<Quarter> {
  const today = new Date();
  const q = quarterFor(today);

  // Try fetching first (cheap, common case after first visit)
  const existing = await db.query.quarters.findFirst({
    where: and(eq(quarters.userId, userId), eq(quarters.label, q.label)),
  });
  if (existing) return existing;

  // Insert. If concurrent request beat us → unique-violation → refetch.
  try {
    const [created] = await db
      .insert(quarters)
      .values({
        userId,
        label: q.label,
        startDate: q.startDate,
        endDate: q.endDate,
      })
      .returning();
    return created;
  } catch {
    const recovered = await db.query.quarters.findFirst({
      where: and(eq(quarters.userId, userId), eq(quarters.label, q.label)),
    });
    if (!recovered) {
      throw new Error("Failed to get or create current quarter");
    }
    return recovered;
  }
}

/**
 * Get a quarter by ID, scoped to user (defense-in-depth on top of RLS).
 */
export async function getQuarterById(userId: string, quarterId: string): Promise<Quarter | null> {
  const row = await db.query.quarters.findFirst({
    where: and(eq(quarters.id, quarterId), eq(quarters.userId, userId)),
  });
  return row ?? null;
}

export type PastQuarterSummary = Quarter & {
  totalQuests: number;
  completedPct: number; // 0..100 average across all quests
};

/**
 * All quarters except the current one, with aggregate quest stats.
 * Returns empty array if this is the user's first quarter.
 */
export async function getPastQuarterSummaries(
  userId: string,
  currentQuarterId: string,
): Promise<PastQuarterSummary[]> {
  const rows = await db
    .select({
      quarter: quarters,
      totalQuests: count(quests.id),
      avgProgress: sql<number>`
        coalesce(
          avg(
            case
              when ${quests.measure} = 'lessons' then (
                select count(*)::float / nullif(${quests.targetCount}, 0)
                from lessons l
                where l.quest_id = ${quests.id} and l.completed_at is not null
              )
              else (
                select coalesce(sum(s.hours)::float, 0) / nullif(${quests.targetCount}, 0)
                from sessions s
                where s.quest_id = ${quests.id}
              )
            end
          ),
          0
        )
      `,
    })
    .from(quarters)
    .leftJoin(
      quests,
      and(eq(quests.quarterId, quarters.id), eq(quests.userId, userId), eq(quests.archived, false)),
    )
    .where(and(eq(quarters.userId, userId), ne(quarters.id, currentQuarterId)))
    .groupBy(quarters.id)
    .orderBy(desc(quarters.startDate));

  return rows.map(({ quarter, totalQuests, avgProgress }) => ({
    ...quarter,
    totalQuests,
    completedPct: Math.round(Math.min(Number(avgProgress), 1) * 100),
  }));
}
