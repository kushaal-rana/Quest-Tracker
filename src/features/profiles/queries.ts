import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import type { Profile } from "@/lib/db/schema";

export async function getProfile(userId: string): Promise<Profile | null> {
  const rows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

export async function getUserTimezone(userId: string): Promise<string> {
  const rows = await db
    .select({ timezone: profiles.timezone })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  return rows[0]?.timezone ?? "UTC";
}
