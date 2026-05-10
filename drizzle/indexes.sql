-- Indexes + unique constraints for Quest Tracker
-- Run this ONCE in Supabase SQL Editor after schema.ts adds new indexes.
-- All statements are idempotent (IF NOT EXISTS) so re-running is safe.

-- Lookup performance
create index if not exists "lessons_quest_idx"          on "lessons"      ("quest_id");
create index if not exists "quarters_user_idx"          on "quarters"     ("user_id");
create index if not exists "quests_user_quarter_idx"    on "quests"       ("user_id", "quarter_id");
create index if not exists "sessions_user_logged_idx"   on "sessions"     ("user_id", "logged_at");
create index if not exists "sessions_quest_idx"         on "sessions"     ("quest_id");

-- Uniqueness constraints (prevent duplicate auto-creates / pins)
create unique index if not exists "quarters_user_label_uniq"
  on "quarters" ("user_id", "label");

create unique index if not exists "weekly_focus_uniq"
  on "weekly_focus" ("user_id", "quest_id", "week_start");
