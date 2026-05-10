import type { Quarter } from "@/lib/db/schema";
import { daysBetween, daysElapsed, elapsedFraction } from "@/lib/format/date";

/**
 * Quarter progress — pure derivations from a Quarter row.
 * Used by dashboard header ("Day 19 of 91") and quarter ring chart.
 */

export type QuarterProgress = {
  totalDays: number;
  daysElapsed: number;
  daysRemaining: number;
  fraction: number; // 0..1
};

export function calcQuarterProgress(quarter: Quarter, asOf: Date = new Date()): QuarterProgress {
  const totalDays = daysBetween(quarter.startDate, quarter.endDate);
  const elapsed = Math.min(daysElapsed(quarter.startDate, asOf), totalDays);
  return {
    totalDays,
    daysElapsed: elapsed,
    daysRemaining: Math.max(0, totalDays - elapsed),
    fraction: elapsedFraction(quarter.startDate, quarter.endDate, asOf),
  };
}
