import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  numeric,
  timestamp,
  date,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

/**
 * Quest Tracker — Drizzle schema (single source of truth for the database).
 *
 * Conventions:
 * - Every table has `userId` for RLS scoping.
 * - Enum-typed text columns enforce values at the TS level. Runtime validation
 *   happens via Zod in `features/<x>/schemas.ts`.
 * - Timestamps default to UTC; render in user TZ on the client.
 * - RLS policies live in `drizzle/policies.sql` — re-run after any new table.
 */

// ─── Enums (TS-level, no Postgres ENUM type for easy migration) ──────────────

export const QUEST_TYPES = ["main", "side"] as const;
export type QuestType = (typeof QUEST_TYPES)[number];

export const QUEST_CATEGORIES = ["life", "work", "side"] as const;
export type QuestCategory = (typeof QUEST_CATEGORIES)[number];

export const QUEST_MEASURES = ["lessons", "hours"] as const;
export type QuestMeasure = (typeof QUEST_MEASURES)[number];

// ─── Tables ──────────────────────────────────────────────────────────────────

export const quarters = pgTable(
  "quarters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    label: text("label").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    reflection: text("reflection"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    // One quarter per (user, label) — prevents accidental duplicates on auto-create
    uniqUserLabel: uniqueIndex("quarters_user_label_uniq").on(t.userId, t.label),
    byUser: index("quarters_user_idx").on(t.userId),
  }),
);

export const quests = pgTable(
  "quests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    quarterId: uuid("quarter_id")
      .notNull()
      .references(() => quarters.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type", { enum: QUEST_TYPES }).notNull(),
    category: text("category", { enum: QUEST_CATEGORIES }).notNull(),
    measure: text("measure", { enum: QUEST_MEASURES }).notNull(),
    targetCount: integer("target_count").notNull(),
    color: text("color").notNull(),
    position: integer("position").notNull().default(0),
    archived: boolean("archived").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byUserQuarter: index("quests_user_quarter_idx").on(t.userId, t.quarterId),
  }),
);

export const lessons = pgTable(
  "lessons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    questId: uuid("quest_id")
      .notNull()
      .references(() => quests.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    position: integer("position").notNull().default(0),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => ({
    byQuest: index("lessons_quest_idx").on(t.questId),
  }),
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    questId: uuid("quest_id")
      .notNull()
      .references(() => quests.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id").references(() => lessons.id, { onDelete: "set null" }),
    hours: numeric("hours", { precision: 4, scale: 2 }).notNull(),
    note: text("note"),
    loggedAt: timestamp("logged_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byUserLogged: index("sessions_user_logged_idx").on(t.userId, t.loggedAt),
    byQuest: index("sessions_quest_idx").on(t.questId),
  }),
);

export const weeklyFocus = pgTable(
  "weekly_focus",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    questId: uuid("quest_id")
      .notNull()
      .references(() => quests.id, { onDelete: "cascade" }),
    weekStart: date("week_start").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    // One pin per (user, quest, week)
    uniqPin: uniqueIndex("weekly_focus_uniq").on(t.userId, t.questId, t.weekStart),
  }),
);

// ─── Inferred types (use these in features instead of redefining) ────────────

export type Quarter = typeof quarters.$inferSelect;
export type NewQuarter = typeof quarters.$inferInsert;

export type Quest = typeof quests.$inferSelect;
export type NewQuest = typeof quests.$inferInsert;

export type Lesson = typeof lessons.$inferSelect;
export type NewLesson = typeof lessons.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type WeeklyFocus = typeof weeklyFocus.$inferSelect;
export type NewWeeklyFocus = typeof weeklyFocus.$inferInsert;
