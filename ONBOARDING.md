# Quest Tracker — User Guide

> One page for everything you're working on this quarter.
> If you read just one file to learn this app — read this one.

---

## What this is

Quest Tracker helps you see all your active quarterly projects in one place and make logging time feel easier than not logging.

You pick 3–4 things to focus on each quarter ("quests"). You log every chunk of time you spend on them ("sessions"). You watch progress bars fill up. You hit streak milestones and small confetti bursts go off. At the end of the quarter you can see exactly what you did and what fell through.

That's it. The whole app is built around removing friction between *wanting to log* and *having logged*.

---

## The 3 core concepts (memorize these)

### 1. Quest
**A goal you commit to for the quarter** (3 months).

Examples:
- *"Finish the Claude Code course"* (target: 12 lessons)
- *"Practice stock market trading"* (target: 40 hours)
- *"Relationship mastery course"* (target: 8 lessons)

Each quest has:
- A **type**: `main` (your big bets) or `side` (anchors / lower priority)
- A **category**: `life`, `work`, or `side` — drives the color (green / indigo / amber)
- A **measure**: `lessons` (count of items completed) OR `hours` (total time logged)
- A **target**: how many lessons or hours = "done"

You usually have 3–4 quests at a time. They live on the dashboard.

### 2. Lesson  *(only for `measure: lessons` quests)*
**A checklist item — something specific you need to DO.**

Examples for a Claude Code quest:
- "Lesson 1: Setup"
- "Lesson 2: Hooks"
- "Lesson 3: State Management"
- … through Lesson 12.

A lesson is either **open** (○) or **complete** (✓). Tick the checkbox when you've finished it. Confetti fires from the click point. The quest's progress bar moves up.

### 3. Session
**A chunk of time you spent working on a quest.**

Examples:
- "1h 30m, Monday at 8am, note: watched intro + set up project"
- "45m, Tuesday morning, no note"
- "2h, Wednesday, note: built first automation"

You log a session every time you sit down to work. The session form is at the top of every quest's detail page (and accessible from anywhere via ⌘K).

---

## The mental model

```
 ┌──────────────────────────────────────────────────────────┐
 │ QUEST  "Claude Code"                                     │
 │                                                          │
 │   Measure: lessons   Target: 12   Progress: 4/12 (33%)   │
 │                                                          │
 │  ┌─────────────────────────────┐  ┌──────────────────┐   │
 │  │ LESSONS (the checklist)     │  │ SESSIONS (time)  │   │
 │  │                             │  │                  │   │
 │  │  ✓ Lesson 1: Setup          │  │  1h 30m  Mon 8am │   │
 │  │  ✓ Lesson 2: Hooks          │  │     45m  Tue 7am │   │
 │  │  ✓ Lesson 3: State          │  │     2h   Wed 8am │   │
 │  │  ✓ Lesson 4: Effects        │  │     1h   Wed 4pm │   │
 │  │  ○ Lesson 5: Hooks Advanced │  │                  │   │
 │  │  ○ Lesson 6: Performance    │  │  ← every chunk   │   │
 │  │  ○ ...                      │  │    of work       │   │
 │  └─────────────────────────────┘  └──────────────────┘   │
 │                                                          │
 │  Sessions can OPTIONALLY tag a lesson they completed.    │
 │  When you log "1h 30m + Lesson 1 complete" the lesson    │
 │  auto-ticks off the checklist.                           │
 └──────────────────────────────────────────────────────────┘
```

**Key insight:** Lessons and sessions are separate but linkable.
- A lesson can exist without any session ever being logged for it.
- A session can be logged without completing any lesson.
- When a session DOES complete a lesson, picking the lesson from the dropdown links them.

---

## Day 1: Setting up a new quest

You've decided to take the Nick Saraev Claude Code course (12 lessons, 4 hours). Here's how to set it up:

1. From the dashboard click **"+ New quest"** (top right, or use ⌘K → "new quest")
2. Fill in the form:
   - **Name:** `Claude Code`
   - **Type:** `Main quest` (this is one of your big focus areas)
   - **Category:** `Work` (auto-colors it indigo)
   - **Measure progress by:** `Lessons` (you'll check them off)
   - **Target:** `12` (number of lessons)
   - **Lesson titles (optional):** Paste 12 lines like:
     ```
     Lesson 1: Setup
     Lesson 2: Hooks
     Lesson 3: State Management
     ...
     ```
     (You can also skip this and add lessons one by one later.)
3. Click **Create quest** → you land back on the dashboard, your new quest appears as a row.

If your quest measures hours instead (e.g. *"40 hours practicing stocks"*), choose `Hours` for measure and set the target to `40`. No lessons to set up.

---

## Daily use: logging your work

You just finished a 90-minute work session. Two ways to log:

### Option A: From the dashboard, click the quest → use the form
1. Click the quest row (e.g. "Claude Code")
2. In the **"Log a session"** form at the top:
   - Hours: `1h30m` (or `90m`, `1.5`, `1:30` — all valid)
   - Optional note: `built first automation, debugged for an hour`
   - Optional "Completed a lesson?": pick from dropdown if you finished one
3. Click **Log session** → toast pops up, sparkline updates, lesson auto-ticks if you picked one

### Option B: From anywhere, use ⌘K (fastest)
1. Press `⌘K` (Mac) or `Ctrl+K` (Windows/Linux) — works on any page
2. Type: `1.5 claude` (hours + part of the quest name)
3. Press `Enter` → logs 1.5 hours to Claude Code

That's it. Target: <5 seconds, zero mouse clicks.

---

## How to read the dashboard

```
QUEST                          PROGRESS                LOGGED          PACE
●  Claude Code                ████░░░░░░░░ 33%       4 / 12 lessons   ✓ On pace
   work · main

●  Stock Market               ██░░░░░░░░░░ 17%       7 / 40 hours     ↓ Slowing

●  Relationship Mastery       █████░░░░░░░ 42%       3 / 8 lessons    ↑ Ahead
   life · side
```

- **Color dot:** quest's category color (green=Life, indigo=Work, amber=Side)
- **Name:** click anywhere on the row to open the quest
- **Progress bar:** red (<25%) → amber (25–60%) → green (>60%)
- **Logged:** how much you've done vs your target
- **Pace tag:** how you're doing relative to time elapsed in the quarter

---

## What "pace" means

The dashboard tells you whether you're tracking ahead of, on, or behind schedule:

| Tag | When | Meaning |
|---|---|---|
| **↑ Ahead** | Progress > 110% of time elapsed | You're crushing it; could even slow down |
| **✓ On pace** | Progress ≥ time elapsed | Right where you should be |
| **↓ Slowing** | 60% ≤ progress < time elapsed | Falling behind — pick it up |
| **⚠ At risk** | Progress < 60% of time elapsed | Serious gap — rethink the target or push hard |

Example: it's day 45 of a 91-day quarter (49% elapsed). For a 12-lesson quest:
- Done 7+ lessons → **Ahead**
- Done 6 lessons (50%) → **On pace**
- Done 4 lessons (33%) → **Slowing** (33% < 49% but ≥ 30%)
- Done 2 lessons (17%) → **At risk** (17% < 30%)

---

## What "streak" means

A **streak** = consecutive days you logged at least one session (any quest counts).

- Log today → streak = 1
- Log today + yesterday → streak = 2
- Skip today, last logged yesterday → streak still 2 (grace until end of today — log to keep it alive)
- Skip 2+ days → streak resets to 0

Every session you log shows your current streak in the toast:
> *"Logged 1h 30m to Claude Code · 🔥 7-day streak"*

**Milestones celebrated with extra confetti:** 3, 7, 14, 30, 60, 90 days.

---

## Keyboard shortcuts

| Key | Action |
|---|---|
| **⌘K / Ctrl+K** | Open command palette (from any page) |
| **Esc** | Close palette |
| **↑ / ↓** | Navigate palette items |
| **Enter** | Select highlighted palette item |

Inside the palette:
- Type a quest name to navigate: `"claude"` → Open Claude Code
- Type hours + quest: `"1.5 claude"` → Log 1.5h to Claude Code
- Type an action: `"new quest"` → New quest page

---

## Editing & deleting

| You want to… | How |
|---|---|
| **Rename a quest** | Quest detail page → **Edit** button (top right) |
| **Change a quest's target** | Same edit form. Safe to change anytime — only shifts the progress %, never loses data |
| **Change a quest's measure** | Can't. Locked once created (would corrupt all your existing data) |
| **Archive a quest** | Quest detail page → **Archive** button. Two-step confirm. Archived quests vanish from the dashboard but data is preserved forever |
| **Rename a lesson** | Hover the lesson row → pencil icon |
| **Delete a lesson** | Hover the lesson row → trash icon. Permanent. Sessions that completed it keep their row (just lose the "✓ Lesson X" tag) |
| **Edit a session's note** | Hover the session row → pencil icon. Inline edit |
| **Delete a session** | Hover the session row → trash icon. Permanent |
| **Edit a session's hours or date** | Can't (Phase 3 limitation). Just delete and re-log |

---

## FAQ

### "What's the difference between adding a lesson and logging a session?"

- **Adding a lesson** = building your checklist of *what to do* (e.g. "Lesson 1: Setup"). Doesn't track any time.
- **Logging a session** = recording *time you just spent working* (e.g. "1h 30m on Monday"). May or may not complete a lesson.

You usually add all lessons once when you start a course, then log sessions as you work. When a session finishes a lesson, link them via the dropdown.

### "What if I'm doing a quest that doesn't have lessons (like 'practice meditation')?"

Use `measure: hours` instead. You'll only see the session log form, no checklist. Track the hours you put in, and the progress bar fills based on `hours logged / target hours`.

### "Can I have a YouTube video that I want to track BOTH by lessons AND hours?"

Pick one. The quest measures progress by one or the other:
- **Lessons** if discrete, finishable units matter most ("12 videos to watch")
- **Hours** if total time invested matters most ("40 hours of practice")

You can still add notes about lessons in the session note field even on an hours quest.

### "I overestimated the target. Can I change it after starting?"

Yes — Edit quest → change the Target number. Your existing progress stays intact, just shifts the percentage. (E.g. 5/12 lessons becomes 5/15 if you bump target from 12 to 15.)

### "What if I forget to log a session on the day I did the work?"

Currently you log the time but it's recorded as "today". Backdating sessions arrives in a future phase. For now, the streak might be a little forgiving in your favor (the system gives you until end of today to log yesterday's work and still count it).

### "I work on different quests on different days — won't the streak break?"

The streak only cares that you logged *something* each day, on any quest. So Monday-Claude-Code → Tuesday-Stocks → Wednesday-Claude-Code keeps a 3-day streak. The "Weekly Focus" view (Phase 4+) will surface which quests you've been working on each week.

### "What's the difference between archive and delete?"

- **Archive** (quests only) = remove from the dashboard but keep all data. Reversible later. Use this when you give up on a quest or finish a quarter.
- **Delete** (lessons + sessions only) = permanent erase. No archive option for these — they're small atomic items.
- **There is no delete for quests** — only archive. This is intentional (your history matters).

### "How is my data protected?"

- Sign-in is Google OAuth — no password to leak.
- Database has Row Level Security: even if someone got your anon key, they could only see their own data, not yours.
- Database password lives in env vars, never in code.
- (For the technically curious: see [CLAUDE.md § 16 "Security posture"](CLAUDE.md).)

---

## Quick reference card

```
QUEST   = a goal for the quarter   (you have 3-4)
LESSON  = a checklist item          (only for lesson-measured quests)
SESSION = time you spent working    (logged each time you work)

DAILY HABIT:
  Press ⌘K → type "1.5 claude" → Enter → done

WEEKLY HABIT:
  Open dashboard → glance at progress bars + pace tags
  Decide: am I on track, or do I need to adjust?

QUARTERLY HABIT:
  At quarter end, archive what didn't work
  Start fresh quests for the new quarter
```

---

*Last updated: 2026-05-10 · Phase 3 (logging + ⌘K)*
*For developers / Claude sessions, see [CLAUDE.md](CLAUDE.md) instead.*
