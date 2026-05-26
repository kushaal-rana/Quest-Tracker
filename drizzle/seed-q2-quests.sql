-- Quest Tracker — Q2 2026 seed data
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Safe to re-run: quest insert uses WHERE NOT EXISTS, so duplicates are skipped.
-- On success you'll see 14 rows returned (one per lesson inserted).
-- If 0 rows returned, the quest already exists — no duplicates created.
-- ─────────────────────────────────────────────────────────────────────────────

WITH user_row AS (
  SELECT id AS user_id
  FROM auth.users
  WHERE email = 'ranakushaal@gmail.com'
),

-- Get the existing Q2 2026 quarter (auto-created by the app on first dashboard visit).
-- ON CONFLICT DO UPDATE is a no-op update that forces RETURNING to give us the id
-- whether the row already existed or was just inserted.
quarter_row AS (
  INSERT INTO public.quarters (user_id, label, start_date, end_date)
  SELECT user_id, 'Q2 2026', '2026-04-01', '2026-06-30'
  FROM user_row
  ON CONFLICT (user_id, label) DO UPDATE SET label = EXCLUDED.label
  RETURNING id AS quarter_id, user_id
),

-- Insert the quest. WHERE NOT EXISTS prevents a duplicate if you re-run the script.
quest_row AS (
  INSERT INTO public.quests
    (user_id, quarter_id, name, type, category, measure, target_count, color, position)
  SELECT
    q.user_id,
    q.quarter_id,
    'Claude Code Full Course (Build & Sell)',
    'main',     -- main quest
    'work',     -- Work category → indigo #6366F1
    'lessons',  -- progress tracked by lessons completed
    14,         -- 14 lessons total
    '#6366F1',  -- indigo (colorForCategory('work'))
    1           -- first quest in the list
  FROM quarter_row q
  WHERE NOT EXISTS (
    SELECT 1 FROM public.quests
    WHERE user_id   = q.user_id
      AND quarter_id = q.quarter_id
      AND name       = 'Claude Code Full Course (Build & Sell)'
  )
  RETURNING id AS quest_id, user_id
)

-- Insert all 14 lessons. Only runs if the quest was just inserted above.
INSERT INTO public.lessons (user_id, quest_id, title, position)
SELECT
  r.user_id,
  r.quest_id,
  v.title,
  v.position
FROM quest_row r
CROSS JOIN (VALUES
  ('Introduction & Setting Up Claude Code',       1),
  ('Understanding IDEs (VS Code & Anti-Gravity)', 2),
  ('Practical Building & Website Design',         3),
  ('The Project Brain (claude.md)',               4),
  ('The Claude Directory & Advanced Files',       5),
  ('Permission Modes & Plan Mode',                6),
  ('Complex Project Build (Full Stack App)',       7),
  ('Context Management & Token Efficiency',       8),
  ('Skills (Automating Knowledge Work)',          9),
  ('Model Context Protocol (MCP)',               10),
  ('Sub Agents',                                 11),
  ('Agent Teams',                                12),
  ('Git Work Trees',                             13),
  ('Scaling and Deployment',                     14)
) AS v(title, position)
RETURNING quest_id, position, title;
