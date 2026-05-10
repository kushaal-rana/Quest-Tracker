import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { quarters, type Quarter } from "@/lib/db/schema";
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
