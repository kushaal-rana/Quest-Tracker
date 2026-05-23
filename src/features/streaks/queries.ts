import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";

function tzLit(tz: string) {
  if (!/^[A-Za-z0-9/_+\-]+$/.test(tz)) throw new Error(`Invalid timezone: "${tz}"`);
  return sql.raw(`'${tz}'`);
}

async function getActiveDateSet(userId: string, questId?: string, tz = "UTC"): Promise<Set<string>> {
  const conditions = [eq(sessions.userId, userId)];
  if (questId) conditions.push(eq(sessions.questId, questId));

  const rows = await db
    .selectDistinct({
      date: sql<string>`to_char(${sessions.loggedAt} at time zone ${tzLit(tz)}, 'YYYY-MM-DD')`,
    })
    .from(sessions)
    .where(and(...conditions))
    .orderBy(sql`1 desc`);

  return new Set(rows.map((r) => r.date));
}

/** Subtract n calendar days from a YYYY-MM-DD string using UTC arithmetic. */
function prevDay(iso: string, n = 1): string {
  const [y, m, d] = iso.split("-").map(Number);
  const prev = new Date(Date.UTC(y, m - 1, d - n));
  return prev.toLocaleDateString("en-CA", { timeZone: "UTC" });
}

function walkBackStreak(dateSet: Set<string>, tz = "UTC"): number {
  if (dateSet.size === 0) return 0;

  const todayIso = new Date().toLocaleDateString("en-CA", { timeZone: tz });

  let cursor = todayIso;
  if (!dateSet.has(cursor)) {
    cursor = prevDay(cursor);
    if (!dateSet.has(cursor)) return 0;
  }

  let streak = 0;
  while (dateSet.has(cursor)) {
    streak++;
    cursor = prevDay(cursor);
  }
  return streak;
}

/**
 * Current consecutive-day streak ending today (or yesterday grace window).
 * Days are computed in `tz` local time.
 *
 *   No sessions ever                       → 0
 *   Sessions today + yesterday + day before → 3
 *   No session today, last was yesterday   → continues (user can still log)
 *   No session today, last was 2+ days ago → 0 (broken)
 */
export async function calcCurrentStreak(userId: string, tz = "UTC"): Promise<number> {
  const dateSet = await getActiveDateSet(userId, undefined, tz);
  return walkBackStreak(dateSet, tz);
}

/**
 * Per-quest streak — same logic but filtered to one quest.
 * Used on the quest detail page.
 */
export async function getQuestCurrentStreak(userId: string, questId: string, tz = "UTC"): Promise<number> {
  const dateSet = await getActiveDateSet(userId, questId, tz);
  return walkBackStreak(dateSet, tz);
}

// ─── Longest streak ───────────────────────────────────────────────────────────

export type LongestStreak = {
  days: number;
  /** Last day of the streak — null when no sessions at all. */
  endDate: string | null;
};

/**
 * Longest consecutive-day streak ever for the user (global, all quests).
 */
export async function getLongestStreak(userId: string, tz = "UTC"): Promise<LongestStreak> {
  const dateSet = await getActiveDateSet(userId, undefined, tz);
  if (dateSet.size === 0) return { days: 0, endDate: null };

  const sorted = [...dateSet].sort(); // "YYYY-MM-DD" lexicographic = chronological

  let best = 1;
  let bestEnd = sorted[0];
  let run = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + "T00:00:00Z");
    const curr = new Date(sorted[i] + "T00:00:00Z");
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86_400_000);

    if (diffDays === 1) {
      run++;
    } else {
      run = 1;
    }

    if (run > best) {
      best = run;
      bestEnd = sorted[i];
    }
  }

  return { days: best, endDate: bestEnd };
}

// ─── Streak history ───────────────────────────────────────────────────────────

export type StreakDay = {
  date: string; // "YYYY-MM-DD"
  hasSession: boolean;
};

/**
 * Boolean activity for the last `days` days (oldest first).
 * Days are computed in `tz` local time.
 * Used to render the streak history grid on the /streaks page.
 */
export async function getStreakHistory(userId: string, days: number, tz = "UTC"): Promise<StreakDay[]> {
  const dateSet = await getActiveDateSet(userId, undefined, tz);

  const todayIso = new Date().toLocaleDateString("en-CA", { timeZone: tz });
  const [ty, tm, td] = todayIso.split("-").map(Number);

  const result: StreakDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const iso = prevDay(
      `${ty}-${String(tm).padStart(2, "0")}-${String(td).padStart(2, "0")}`,
      i,
    );
    result.push({ date: iso, hasSession: dateSet.has(iso) });
  }
  return result;
}

// ─── Per-quest streaks (for streaks page list) ────────────────────────────────

export type QuestStreakRow = {
  questId: string;
  questName: string;
  questColor: string;
  currentStreak: number;
};

/**
 * Current streak for every active quest in a quarter.
 * Used by the /streaks page to show per-quest breakdown.
 */
export async function getAllQuestStreaks(
  userId: string,
  questIds: string[],
  questMeta: Array<{ id: string; name: string; color: string }>,
  tz = "UTC",
): Promise<QuestStreakRow[]> {
  const results: QuestStreakRow[] = [];
  for (const meta of questMeta) {
    if (!questIds.includes(meta.id)) continue;
    const streak = await getQuestCurrentStreak(userId, meta.id, tz);
    results.push({
      questId: meta.id,
      questName: meta.name,
      questColor: meta.color,
      currentStreak: streak,
    });
  }
  return results.sort((a, b) => b.currentStreak - a.currentStreak);
}
