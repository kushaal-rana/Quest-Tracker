import { pgTable, uuid, text, integer, boolean, numeric, timestamp, date } from "drizzle-orm/pg-core";

export const quarters = pgTable("quarters", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  label: text("label").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  reflection: text("reflection"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const quests = pgTable("quests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  quarterId: uuid("quarter_id").notNull().references(() => quarters.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  category: text("category").notNull(),
  measure: text("measure").notNull(),
  targetCount: integer("target_count").notNull(),
  color: text("color").notNull(),
  position: integer("position").notNull().default(0),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const lessons = pgTable("lessons", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  questId: uuid("quest_id").notNull().references(() => quests.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  position: integer("position").notNull().default(0),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  questId: uuid("quest_id").notNull().references(() => quests.id, { onDelete: "cascade" }),
  lessonId: uuid("lesson_id").references(() => lessons.id, { onDelete: "set null" }),
  hours: numeric("hours", { precision: 4, scale: 2 }).notNull(),
  note: text("note"),
  loggedAt: timestamp("logged_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const weeklyFocus = pgTable("weekly_focus", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  questId: uuid("quest_id").notNull().references(() => quests.id, { onDelete: "cascade" }),
  weekStart: date("week_start").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
