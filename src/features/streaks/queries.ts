import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";

// ─── Shared UTC helper ────────────────────────────────────────────────────────

function isoDateOnly(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ─── Active date set helpers ──────────────────────────────────────────────────

async function getActiveDateSet(userId: string, questId?: string): Promise<Set<string>> {
  const conditions = [eq(sessions.userId, userId)];
  if (questId) conditions.push(eq(sessions.questId, questId));

  const rows = await db
    .selectDistinct({
      date: sql<string>`to_char(${sessions.loggedAt} at time zone 'UTC', 'YYYY-MM-DD')`,
    })
    .from(sessions)
    .where(and(...conditions))
    .orderBy(sql`1 desc`);

  return new Set(rows.map((r) => r.date));
}

// ─── Current streak ───────────────────────────────────────────────────────────

/**
 * Current consecutive-day streak ending today (or yesterday grace window).
 *
 *   No sessions ever                       → 0
 *   Sessions today + yesterday + day before → 3
 *   No session today, last was yesterday   → continues (user can still log)
 *   No session today, last was 2+ days ago → 0 (broken)
 */
export async function calcCurrentStreak(userId: string): Promise<number> {
  const dateSet = await getActiveDateSet(userId);
  return walkBackStreak(dateSet);
}

/**
 * Per-quest streak — same logic but filtered to one quest.
 * Used on the quest detail page.
 */
export async function getQuestCurrentStreak(userId: string, questId: string): Promise<number> {
  const dateSet = await getActiveDateSet(userId, questId);
  return walkBackStreak(dateSet);
}

function walkBackStreak(dateSet: Set<string>): number {
  if (dateSet.size === 0) return 0;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayIso = isoDateOnly(today);

  const cursor = new Date(today);
  if (!dateSet.has(todayIso)) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    if (!dateSet.has(isoDateOnly(cursor))) return 0;
  }

  let streak = 0;
  while (dateSet.has(isoDateOnly(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
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
export async function getLongestStreak(userId: string): Promise<LongestStreak> {
  const dateSet = await getActiveDateSet(userId);
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
 * Used to render the streak history grid on the /streaks page.
 */
export async function getStreakHistory(userId: string, days: number): Promise<StreakDay[]> {
  const dateSet = await getActiveDateSet(userId);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const result: StreakDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    const iso = isoDateOnly(d);
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
): Promise<QuestStreakRow[]> {
  const results: QuestStreakRow[] = [];
  for (const meta of questMeta) {
    if (!questIds.includes(meta.id)) continue;
    const streak = await getQuestCurrentStreak(userId, meta.id);
    results.push({
      questId: meta.id,
      questName: meta.name,
      questColor: meta.color,
      currentStreak: streak,
    });
  }
  return results.sort((a, b) => b.currentStreak - a.currentStreak);
}
