-- Row Level Security policies for Quest Tracker
-- Run this in Supabase SQL Editor after `npm run db:push`.
-- Re-running is safe: drops + recreates each policy.
--
-- Rule: every row has user_id; you can only see/touch your own rows.
-- This is the SaaS-from-day-one gate. Without this, the anon key reads everything.

-- ────────────────────────────────────────────────────────────
-- 1. Enable RLS on all tables
-- ────────────────────────────────────────────────────────────
alter table quarters       enable row level security;
alter table quests         enable row level security;
alter table lessons        enable row level security;
alter table sessions       enable row level security;
alter table weekly_focus   enable row level security;

-- ────────────────────────────────────────────────────────────
-- 2. Drop any existing policies (idempotent re-run)
-- ────────────────────────────────────────────────────────────
drop policy if exists "quarters_select_own"      on quarters;
drop policy if exists "quarters_insert_own"      on quarters;
drop policy if exists "quarters_update_own"      on quarters;
drop policy if exists "quarters_delete_own"      on quarters;

drop policy if exists "quests_select_own"        on quests;
drop policy if exists "quests_insert_own"        on quests;
drop policy if exists "quests_update_own"        on quests;
drop policy if exists "quests_delete_own"        on quests;

drop policy if exists "lessons_select_own"       on lessons;
drop policy if exists "lessons_insert_own"       on lessons;
drop policy if exists "lessons_update_own"       on lessons;
drop policy if exists "lessons_delete_own"       on lessons;

drop policy if exists "sessions_select_own"      on sessions;
drop policy if exists "sessions_insert_own"      on sessions;
drop policy if exists "sessions_update_own"      on sessions;
drop policy if exists "sessions_delete_own"      on sessions;

drop policy if exists "weekly_focus_select_own"  on weekly_focus;
drop policy if exists "weekly_focus_insert_own"  on weekly_focus;
drop policy if exists "weekly_focus_update_own"  on weekly_focus;
drop policy if exists "weekly_focus_delete_own"  on weekly_focus;

-- ────────────────────────────────────────────────────────────
-- 3. Create per-user policies (one per CRUD verb per table)
-- ────────────────────────────────────────────────────────────

-- quarters
create policy "quarters_select_own" on quarters
  for select using (auth.uid() = user_id);
create policy "quarters_insert_own" on quarters
  for insert with check (auth.uid() = user_id);
create policy "quarters_update_own" on quarters
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "quarters_delete_own" on quarters
  for delete using (auth.uid() = user_id);

-- quests
create policy "quests_select_own" on quests
  for select using (auth.uid() = user_id);
create policy "quests_insert_own" on quests
  for insert with check (auth.uid() = user_id);
create policy "quests_update_own" on quests
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "quests_delete_own" on quests
  for delete using (auth.uid() = user_id);

-- lessons
create policy "lessons_select_own" on lessons
  for select using (auth.uid() = user_id);
create policy "lessons_insert_own" on lessons
  for insert with check (auth.uid() = user_id);
create policy "lessons_update_own" on lessons
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "lessons_delete_own" on lessons
  for delete using (auth.uid() = user_id);

-- sessions
create policy "sessions_select_own" on sessions
  for select using (auth.uid() = user_id);
create policy "sessions_insert_own" on sessions
  for insert with check (auth.uid() = user_id);
create policy "sessions_update_own" on sessions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sessions_delete_own" on sessions
  for delete using (auth.uid() = user_id);

-- weekly_focus
create policy "weekly_focus_select_own" on weekly_focus
  for select using (auth.uid() = user_id);
create policy "weekly_focus_insert_own" on weekly_focus
  for insert with check (auth.uid() = user_id);
create policy "weekly_focus_update_own" on weekly_focus
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "weekly_focus_delete_own" on weekly_focus
  for delete using (auth.uid() = user_id);

-- profiles (Phase 5 — added 2026-05-17)
alter table profiles enable row level security;

drop policy if exists "profiles_select_own" on profiles;
drop policy if exists "profiles_insert_own" on profiles;
drop policy if exists "profiles_update_own" on profiles;
drop policy if exists "profiles_delete_own" on profiles;

create policy "profiles_select_own" on profiles
  for select using (auth.uid() = user_id);
create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "profiles_delete_own" on profiles
  for delete using (auth.uid() = user_id);
