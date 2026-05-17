import "server-only";

import { and, asc, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { lessons, quests, sessions } from "@/lib/db/schema";

// ─── UTC date helpers (server-side, no date-fns to avoid TZ inconsistency) ───

/** Monday midnight UTC of the week containing `date`. */
export function weekStartUTC(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=Sun
  const daysFromMonday = (day + 6) % 7;
  d.setUTCDate(d.getUTCDate() - daysFromMonday);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Sunday end-of-day UTC of the week containing `date`. */
export function weekEndUTC(date: Date = new Date()): Date {
  const start = weekStartUTC(date);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

/** First moment of a UTC month. */
export function monthStartUTC(date: Date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
}

/** Last moment of a UTC month. */
export function monthEndUTC(date: Date = new Date()): Date {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999));
}

/** Start of today UTC. */
export function todayStartUTC(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** End of today UTC. */
export function todayEndUTC(): Date {
  const d = new Date();
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

// ─── Weekly summary ───────────────────────────────────────────────────────────

export type WeeklySummary = {
  hoursThisWeek: number;
  lessonsThisWeek: number;
};

/**
 * Total hours + lessons completed in [from, to].
 * Used by the dashboard scorecard tiles and the /week page header.
 */
export async function getWeeklySummary(
  userId: string,
  from: Date,
  to: Date,
): Promise<WeeklySummary> {
  const [hoursResult, lessonsResult] = await Promise.all([
    db
      .select({ total: sql<number>`coalesce(sum(${sessions.hours})::float, 0)` })
      .from(sessions)
      .where(
        and(eq(sessions.userId, userId), gte(sessions.loggedAt, from), lte(sessions.loggedAt, to)),
      ),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(lessons)
      .where(
        and(
          eq(lessons.userId, userId),
          sql`${lessons.completedAt} is not null`,
          gte(lessons.completedAt, from),
          lte(lessons.completedAt, to),
        ),
      ),
  ]);

  return {
    hoursThisWeek: Number(hoursResult[0]?.total ?? 0),
    lessonsThisWeek: Number(lessonsResult[0]?.total ?? 0),
  };
}

// ─── Sessions by day (for bar chart + heatmap) ────────────────────────────────

export type DaySessionRow = {
  date: string; // "YYYY-MM-DD"
  questId: string;
  questName: string;
  questColor: string;
  hours: number;
};

/**
 * Sessions aggregated by UTC day + quest, within a date range.
 * Joins quests to get name/color for the bar chart legend.
 */
export async function getSessionsByDayForRange(
  userId: string,
  from: Date,
  to: Date,
): Promise<DaySessionRow[]> {
  const rows = await db
    .select({
      date: sql<string>`to_char(${sessions.loggedAt} at time zone 'UTC', 'YYYY-MM-DD')`,
      questId: sessions.questId,
      questName: quests.name,
      questColor: quests.color,
      hours: sql<number>`coalesce(sum(${sessions.hours})::float, 0)`,
    })
    .from(sessions)
    .innerJoin(quests, eq(quests.id, sessions.questId))
    .where(
      and(
        eq(sessions.userId, userId),
        gte(sessions.loggedAt, from),
        lte(sessions.loggedAt, to),
      ),
    )
    .groupBy(
      sql`to_char(${sessions.loggedAt} at time zone 'UTC', 'YYYY-MM-DD')`,
      sessions.questId,
      quests.name,
      quests.color,
    );

  return rows.map((r) => ({ ...r, hours: Number(r.hours) || 0 }));
}

// ─── Today sessions ───────────────────────────────────────────────────────────

export type TodayQuestGroup = {
  questId: string;
  questName: string;
  questColor: string;
  totalHours: number;
  sessions: {
    id: string;
    hours: number;
    note: string | null;
    lessonTitle: string | null;
    loggedAt: Date;
  }[];
};

/**
 * All sessions logged today (UTC), grouped by quest.
 * Used by the /today page.
 */
export async function getTodaySessionsGrouped(userId: string): Promise<TodayQuestGroup[]> {
  const rows = await db
    .select({
      sessionId: sessions.id,
      hours: sessions.hours,
      note: sessions.note,
      loggedAt: sessions.loggedAt,
      questId: sessions.questId,
      questName: quests.name,
      questColor: quests.color,
      lessonTitle: lessons.title,
    })
    .from(sessions)
    .innerJoin(quests, eq(quests.id, sessions.questId))
    .leftJoin(lessons, eq(lessons.id, sessions.lessonId))
    .where(
      and(
        eq(sessions.userId, userId),
        gte(sessions.loggedAt, todayStartUTC()),
        lte(sessions.loggedAt, todayEndUTC()),
      ),
    )
    .orderBy(desc(sessions.loggedAt));

  // Group by quest
  const map = new Map<string, TodayQuestGroup>();
  for (const r of rows) {
    if (!map.has(r.questId)) {
      map.set(r.questId, {
        questId: r.questId,
        questName: r.questName,
        questColor: r.questColor,
        totalHours: 0,
        sessions: [],
      });
    }
    const group = map.get(r.questId)!;
    const hrs = Number(r.hours) || 0;
    group.totalHours += hrs;
    group.sessions.push({
      id: r.sessionId,
      hours: hrs,
      note: r.note,
      lessonTitle: r.lessonTitle,
      loggedAt: r.loggedAt,
    });
  }

  return Array.from(map.values());
}

// ─── Paginated logs ───────────────────────────────────────────────────────────

export type LogSession = {
  id: string;
  hours: number;
  note: string | null;
  loggedAt: Date;
  questId: string;
  questName: string;
  questColor: string;
  lessonTitle: string | null;
};

/**
 * All sessions across all quests, paginated.
 * Supports optional questId filter and note text search.
 */
export async function getAllSessionsPaginated(
  userId: string,
  opts: { page: number; limit: number; questId?: string; search?: string },
): Promise<{ sessions: LogSession[]; total: number }> {
  const { page, limit, questId, search } = opts;
  const offset = (page - 1) * limit;

  const conditions = [eq(sessions.userId, userId)];
  if (questId) conditions.push(eq(sessions.questId, questId));
  if (search) {
    conditions.push(
      or(
        ilike(sessions.note, `%${search}%`),
        ilike(quests.name, `%${search}%`),
      )!,
    );
  }

  const where = and(...conditions);

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: sessions.id,
        hours: sessions.hours,
        note: sessions.note,
        loggedAt: sessions.loggedAt,
        questId: sessions.questId,
        questName: quests.name,
        questColor: quests.color,
        lessonTitle: lessons.title,
      })
      .from(sessions)
      .innerJoin(quests, eq(quests.id, sessions.questId))
      .leftJoin(lessons, eq(lessons.id, sessions.lessonId))
      .where(where)
      .orderBy(desc(sessions.loggedAt))
      .limit(limit)
      .offset(offset),

    db
      .select({ total: sql<number>`count(*)::int` })
      .from(sessions)
      .innerJoin(quests, eq(quests.id, sessions.questId))
      .where(where),
  ]);

  return {
    sessions: rows.map((r) => ({ ...r, hours: Number(r.hours) || 0 })),
    total: Number(countRows[0]?.total ?? 0),
  };
}

// ─── Quest list (for log filter dropdown) ────────────────────────────────────

export type QuestFilterRow = { id: string; name: string; color: string };

/**
 * All non-archived quests for a user (across all quarters).
 * Used by the /logs filter dropdown.
 */
export async function getAllActiveQuests(userId: string): Promise<QuestFilterRow[]> {
  return db
    .select({ id: quests.id, name: quests.name, color: quests.color })
    .from(quests)
    .where(and(eq(quests.userId, userId), eq(quests.archived, false)))
    .orderBy(asc(quests.createdAt));
}

// ─── Month summary ────────────────────────────────────────────────────────────

export type MonthQuestTotal = {
  questId: string;
  questName: string;
  questColor: string;
  measure: "lessons" | "hours";
  hoursLogged: number;
  lessonsCompleted: number;
};

export type MonthSummary = {
  questTotals: MonthQuestTotal[];
  sessionsByDay: { date: string; hours: number }[];
};

/**
 * Aggregate sessions + lesson completions for a month range.
 * questTotals: per-quest hours + lessons done
 * sessionsByDay: daily total hours for the heatmap
 */
export async function getMonthSummary(
  userId: string,
  from: Date,
  to: Date,
): Promise<MonthSummary> {
  const [hoursByQuest, lessonsByQuest, dayRows] = await Promise.all([
    // Hours per quest
    db
      .select({
        questId: sessions.questId,
        questName: quests.name,
        questColor: quests.color,
        measure: quests.measure,
        hours: sql<number>`coalesce(sum(${sessions.hours})::float, 0)`,
      })
      .from(sessions)
      .innerJoin(quests, eq(quests.id, sessions.questId))
      .where(
        and(eq(sessions.userId, userId), gte(sessions.loggedAt, from), lte(sessions.loggedAt, to)),
      )
      .groupBy(sessions.questId, quests.name, quests.color, quests.measure),

    // Lessons completed per quest
    db
      .select({
        questId: lessons.questId,
        count: sql<number>`count(*)::int`,
      })
      .from(lessons)
      .where(
        and(
          eq(lessons.userId, userId),
          sql`${lessons.completedAt} is not null`,
          gte(lessons.completedAt, from),
          lte(lessons.completedAt, to),
        ),
      )
      .groupBy(lessons.questId),

    // Daily total hours (for heatmap)
    db
      .select({
        date: sql<string>`to_char(${sessions.loggedAt} at time zone 'UTC', 'YYYY-MM-DD')`,
        hours: sql<number>`coalesce(sum(${sessions.hours})::float, 0)`,
      })
      .from(sessions)
      .where(
        and(eq(sessions.userId, userId), gte(sessions.loggedAt, from), lte(sessions.loggedAt, to)),
      )
      .groupBy(sql`to_char(${sessions.loggedAt} at time zone 'UTC', 'YYYY-MM-DD')`),
  ]);

  const lessonMap = new Map(lessonsByQuest.map((r) => [r.questId, Number(r.count) || 0]));

  const questTotals: MonthQuestTotal[] = hoursByQuest.map((r) => ({
    questId: r.questId,
    questName: r.questName,
    questColor: r.questColor,
    measure: r.measure as "lessons" | "hours",
    hoursLogged: Number(r.hours) || 0,
    lessonsCompleted: lessonMap.get(r.questId) ?? 0,
  }));

  return {
    questTotals,
    sessionsByDay: dayRows.map((r) => ({ date: r.date, hours: Number(r.hours) || 0 })),
  };
}

// ─── Cumulative progress (for /quarter chart) ─────────────────────────────────

export type CumulativeQuestSeries = {
  questId: string;
  name: string;
  color: string;
  measure: "lessons" | "hours";
  targetCount: number;
  /** Each entry: { date: "YYYY-MM-DD", fraction: 0..1+ } — only days with activity. */
  points: { date: string; fraction: number }[];
};

/**
 * Builds cumulative progress lines for every quest in a quarter.
 * For hours quests: running sum of hours / target.
 * For lessons quests: running count of completions / target.
 *
 * Returns only quests with at least one data point.
 * Caller can render these as multi-line Recharts chart.
 */
export async function getCumulativeProgress(
  userId: string,
  quarterId: string,
): Promise<CumulativeQuestSeries[]> {
  const questList = await db
    .select({
      id: quests.id,
      name: quests.name,
      color: quests.color,
      measure: quests.measure,
      targetCount: quests.targetCount,
    })
    .from(quests)
    .where(
      and(eq(quests.userId, userId), eq(quests.quarterId, quarterId), eq(quests.archived, false)),
    )
    .orderBy(asc(quests.position), asc(quests.createdAt));

  if (questList.length === 0) return [];

  const [sessionRows, lessonRows] = await Promise.all([
    // Hours by day per quest
    db
      .select({
        date: sql<string>`to_char(${sessions.loggedAt} at time zone 'UTC', 'YYYY-MM-DD')`,
        questId: sessions.questId,
        hours: sql<number>`coalesce(sum(${sessions.hours})::float, 0)`,
      })
      .from(sessions)
      .innerJoin(quests, and(eq(quests.id, sessions.questId), eq(quests.quarterId, quarterId)))
      .where(eq(sessions.userId, userId))
      .groupBy(
        sql`to_char(${sessions.loggedAt} at time zone 'UTC', 'YYYY-MM-DD')`,
        sessions.questId,
      )
      .orderBy(sql`1 asc`),

    // Lesson completions by day per quest
    db
      .select({
        date: sql<string>`to_char(${lessons.completedAt} at time zone 'UTC', 'YYYY-MM-DD')`,
        questId: lessons.questId,
        count: sql<number>`count(*)::int`,
      })
      .from(lessons)
      .innerJoin(quests, and(eq(quests.id, lessons.questId), eq(quests.quarterId, quarterId)))
      .where(and(eq(lessons.userId, userId), sql`${lessons.completedAt} is not null`))
      .groupBy(
        sql`to_char(${lessons.completedAt} at time zone 'UTC', 'YYYY-MM-DD')`,
        lessons.questId,
      )
      .orderBy(sql`1 asc`),
  ]);

  const results: CumulativeQuestSeries[] = [];

  for (const quest of questList) {
    let points: { date: string; fraction: number }[];

    if (quest.measure === "hours") {
      // Build cumulative hours per day
      const dailyMap = new Map<string, number>();
      for (const r of sessionRows.filter((s) => s.questId === quest.id)) {
        dailyMap.set(r.date, (dailyMap.get(r.date) ?? 0) + (Number(r.hours) || 0));
      }
      if (dailyMap.size === 0) continue;
      let cumulative = 0;
      points = [];
      for (const [date, hours] of [...dailyMap.entries()].sort()) {
        cumulative += hours;
        points.push({ date, fraction: Math.min(cumulative / quest.targetCount, 1) });
      }
    } else {
      // Build cumulative lesson completions per day
      const dailyMap = new Map<string, number>();
      for (const r of lessonRows.filter((l) => l.questId === quest.id)) {
        dailyMap.set(r.date, (dailyMap.get(r.date) ?? 0) + (Number(r.count) || 0));
      }
      if (dailyMap.size === 0) continue;
      let cumulative = 0;
      points = [];
      for (const [date, cnt] of [...dailyMap.entries()].sort()) {
        cumulative += cnt;
        points.push({ date, fraction: Math.min(cumulative / quest.targetCount, 1) });
      }
    }

    results.push({
      questId: quest.id,
      name: quest.name,
      color: quest.color,
      measure: quest.measure as "lessons" | "hours",
      targetCount: quest.targetCount,
      points,
    });
  }

  return results;
}
