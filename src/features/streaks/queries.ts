import "server-only";

import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";

/**
 * Streaks — pure read operations.
 *
 * Phase 3 implementation: walk back from today over distinct UTC session dates,
 * counting consecutive days. Simple JS, no SQL window functions.
 *
 * Phase 4 will add: per-quest streaks, longest-streak history, dashboard widget.
 */

/**
 * Current consecutive-day streak ending today (or yesterday if today is empty).
 *
 *   No sessions ever                       → 0
 *   Sessions today + yesterday + day before → 3
 *   No session today, last was yesterday   → continues yesterday's streak
 *                                            (the user can still log today and keep it)
 *   No session today, last was 2+ days ago → 0 (streak broken)
 */
export async function calcCurrentStreak(userId: string): Promise<number> {
  const rows = await db
    .selectDistinct({
      date: sql<string>`to_char(${sessions.loggedAt} at time zone 'UTC', 'YYYY-MM-DD')`,
    })
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .orderBy(sql`1 desc`); // ordering by the first selected column

  if (rows.length === 0) return 0;

  const dateSet = new Set(rows.map((r) => r.date));

  // Today UTC, midnight
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayIso = isoDateOnly(today);

  // Decide where to start counting (Date is mutated via setUTCDate below)
  const cursor = new Date(today);
  if (!dateSet.has(todayIso)) {
    // No session today — try yesterday as starting point (keep streak alive grace)
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    if (!dateSet.has(isoDateOnly(cursor))) {
      // Last session was 2+ days ago — streak broken
      return 0;
    }
  }

  // Walk backward while consecutive days are present
  let streak = 0;
  while (dateSet.has(isoDateOnly(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

/**
 * Convert a Date to "YYYY-MM-DD" using its UTC fields.
 * (Local date helpers in lib/format/date.ts use local time — this is intentionally
 * UTC since session timestamps are stored UTC.)
 */
function isoDateOnly(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
