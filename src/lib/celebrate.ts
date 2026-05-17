/**
 * Celebration animations — wraps canvas-confetti.
 *
 * All functions are no-ops if:
 * - The user has `prefers-reduced-motion: reduce` set
 * - Running on the server (no `window`)
 *
 * Tuned per-event for "rewarding without being annoying":
 *   lessonComplete   → small burst (30 particles, 60° spread) at click origin
 *   questMilestone   → bigger burst (80 particles, 100° spread) from center
 *   streakMilestone  → full-screen-ish (120 particles, 140° spread, longer ticks)
 *   firstLogOfDay    → single subtle puff (no confetti — just a toast with "Good morning")
 *
 * Origin coordinates are 0..1 fractions of viewport.
 *   { x: 0.5, y: 0.5 } = center
 *   { x: 0.85, y: 0.4 } = upper-right (where progress bars typically live)
 */

import confetti from "canvas-confetti";

type Origin = { x: number; y: number };

function reducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export const celebrate = {
  /**
   * Lesson checkbox just got checked. Small, snappy, near the click point.
   */
  lessonComplete(origin?: Origin) {
    if (reducedMotion()) return;
    confetti({
      particleCount: 30,
      spread: 60,
      startVelocity: 30,
      origin: origin ?? { x: 0.5, y: 0.5 },
      ticks: 80,
      scalar: 0.9,
    });
  },

  /**
   * Quest just crossed a 25 / 50 / 75 / 100 % milestone.
   * Burst comes from the typical progress-bar position (right of center).
   */
  questMilestone(percent: 25 | 50 | 75 | 100) {
    if (reducedMotion()) return;
    const isComplete = percent === 100;
    confetti({
      particleCount: isComplete ? 120 : 80,
      spread: isComplete ? 140 : 100,
      startVelocity: 40,
      origin: { x: 0.5, y: 0.5 },
      ticks: isComplete ? 200 : 120,
      scalar: 1.05,
    });
  },

  /**
   * Streak milestone (3 / 7 / 14 / 30 / 60 / 90 days).
   * Bigger and longer — the dopamine hit that drives the daily-log habit.
   */
  streakMilestone(days: number) {
    if (reducedMotion()) return;
    const big = days >= 30;
    confetti({
      particleCount: big ? 150 : 100,
      spread: big ? 160 : 120,
      startVelocity: 45,
      origin: { x: 0.5, y: 0.5 },
      ticks: big ? 240 : 160,
      scalar: big ? 1.2 : 1.0,
    });
  },
};

/**
 * Streak milestones we celebrate (locked).
 * Logging on day 3, 7, 14, 30, 60, 90 → confetti + special toast.
 */
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 90] as const;
export type StreakMilestone = (typeof STREAK_MILESTONES)[number];

export function isStreakMilestone(days: number): days is StreakMilestone {
  return (STREAK_MILESTONES as readonly number[]).includes(days);
}

/**
 * Quest progress milestones we celebrate (locked).
 * Crossing from below to at-or-above 25/50/75/100 → confetti.
 */
export const QUEST_MILESTONES = [25, 50, 75, 100] as const;
export type QuestMilestone = (typeof QUEST_MILESTONES)[number];

/**
 * Returns the highest milestone crossed when progress went from `before` → `after`.
 * Returns null if no milestone was crossed.
 *
 *   crossedMilestone(0.20, 0.30) → 25
 *   crossedMilestone(0.40, 0.55) → 50
 *   crossedMilestone(0.55, 0.80) → 75   (not 50, returns the highest)
 *   crossedMilestone(0.80, 0.85) → null (no milestone in between)
 *   crossedMilestone(0.95, 1.00) → 100
 */
export function crossedMilestone(beforeFraction: number, afterFraction: number): QuestMilestone | null {
  let highest: QuestMilestone | null = null;
  for (const m of QUEST_MILESTONES) {
    const threshold = m / 100;
    if (beforeFraction < threshold && afterFraction >= threshold) {
      highest = m;
    }
  }
  return highest;
}
