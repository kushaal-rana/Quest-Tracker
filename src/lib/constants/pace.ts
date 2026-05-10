/**
 * Pace classifier — how a quest's progress compares to time elapsed in the quarter.
 *
 * Inputs:
 *   progressFraction       = completed / target          (0..1+)
 *   quarterElapsedFraction = daysElapsed / totalDays    (0..1)
 *
 * Locked thresholds (per Phase 2 plan):
 *   ahead    → progress >  elapsed × 1.10
 *   on_pace  → progress >= elapsed
 *   slowing  → progress >= elapsed × 0.60
 *   at_risk  → progress <  elapsed × 0.60
 *
 * Edge cases:
 * - Quarter not started (elapsed === 0) → "on_pace" by default
 * - Quest complete (progress >= 1)      → "ahead"
 */

export const PACE_STATES = ["ahead", "on_pace", "slowing", "at_risk"] as const;
export type PaceState = (typeof PACE_STATES)[number];

export const PACE_THRESHOLDS = {
  AHEAD_MULTIPLIER: 1.1,
  AT_RISK_MULTIPLIER: 0.6,
} as const;

export const PACE_META: Record<
  PaceState,
  {
    label: string;
    /** Short prefix shown before the label (✓, ↑, ↓, ⚠) */
    icon: string;
    /** Tailwind text color */
    text: string;
    /** Tailwind bg color for pill */
    bg: string;
    /** Tailwind border color for pill */
    border: string;
    /** Token reference for charts (matches globals.css) */
    token: "--pace-good" | "--pace-warn" | "--pace-bad" | "--primary";
  }
> = {
  ahead: {
    label: "Ahead",
    icon: "↑",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    token: "--pace-good",
  },
  on_pace: {
    label: "On pace",
    icon: "✓",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    token: "--pace-good",
  },
  slowing: {
    label: "Slowing",
    icon: "↓",
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    token: "--pace-warn",
  },
  at_risk: {
    label: "At risk",
    icon: "⚠",
    text: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    token: "--pace-bad",
  },
};

/**
 * Classify a quest's pace.
 *
 * @param progress  fraction 0..∞ of quest target completed (1.0 = done)
 * @param elapsed   fraction 0..1 of quarter elapsed
 * @returns pace state
 */
export function classifyPace(progress: number, elapsed: number): PaceState {
  // Quest done — always ahead
  if (progress >= 1) return "ahead";
  // Quarter hasn't started — give the benefit of the doubt
  if (elapsed <= 0) return "on_pace";

  if (progress > elapsed * PACE_THRESHOLDS.AHEAD_MULTIPLIER) return "ahead";
  if (progress >= elapsed) return "on_pace";
  if (progress >= elapsed * PACE_THRESHOLDS.AT_RISK_MULTIPLIER) return "slowing";
  return "at_risk";
}

/**
 * Color a progress bar based on completion %.
 * Used by the dashboard quest row.
 *
 *   < 25%  → red
 *   25–60% → amber
 *   > 60%  → green
 */
export function progressBarColor(progress: number): "bg-red-500" | "bg-amber-500" | "bg-emerald-500" {
  if (progress < 0.25) return "bg-red-500";
  if (progress < 0.6) return "bg-amber-500";
  return "bg-emerald-500";
}
