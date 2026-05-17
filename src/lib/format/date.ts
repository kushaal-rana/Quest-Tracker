/**
 * Date helpers — pure functions, no DB / no React.
 *
 * All inputs are JS Date or ISO date strings ("YYYY-MM-DD" for date-only).
 * All outputs are user-facing strings or normalized data.
 */

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Days between two dates, inclusive of both ends.
 *   daysBetween("2026-04-01", "2026-04-01") → 1
 *   daysBetween("2026-04-01", "2026-06-30") → 91
 */
export function daysBetween(start: Date | string, end: Date | string): number {
  const s = toDate(start);
  const e = toDate(end);
  return Math.round((e.getTime() - s.getTime()) / ONE_DAY_MS) + 1;
}

/**
 * How many days have elapsed since the start date (today counts as day 1).
 *   daysElapsed("2026-04-01") on 2026-04-01 → 1
 *   daysElapsed("2026-04-01") on 2026-04-30 → 30
 */
export function daysElapsed(start: Date | string, asOf: Date = new Date()): number {
  const s = toDate(start);
  // Clamp to start if asOf is before
  if (asOf < s) return 0;
  return Math.floor((asOf.getTime() - s.getTime()) / ONE_DAY_MS) + 1;
}

/**
 * Fraction of the period that has elapsed (0..1, clamped).
 *   quarterElapsedFraction("2026-04-01", "2026-06-30") on 2026-04-15 → ~0.16
 */
export function elapsedFraction(
  start: Date | string,
  end: Date | string,
  asOf: Date = new Date(),
): number {
  const total = daysBetween(start, end);
  const elapsed = daysElapsed(start, asOf);
  return Math.max(0, Math.min(1, elapsed / total));
}

/**
 * Convert a "YYYY-MM-DD" date-only string to a Date at local midnight.
 * Avoids the Date("2026-04-01") UTC-vs-local pitfall.
 */
function toDate(d: Date | string): Date {
  if (d instanceof Date) return d;
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day);
}

/**
 * Get the current calendar quarter for a given date.
 *   quarterFor(new Date("2026-05-10"))
 *     → { label: "Q2 2026", startDate: "2026-04-01", endDate: "2026-06-30" }
 */
export function quarterFor(asOf: Date = new Date()): {
  label: string;
  startDate: string;
  endDate: string;
  quarterNumber: 1 | 2 | 3 | 4;
  year: number;
} {
  const year = asOf.getFullYear();
  const month = asOf.getMonth(); // 0..11
  const quarterNumber = (Math.floor(month / 3) + 1) as 1 | 2 | 3 | 4;
  const startMonth = (quarterNumber - 1) * 3;
  const endMonth = startMonth + 2;

  const start = new Date(year, startMonth, 1);
  const end = new Date(year, endMonth + 1, 0); // last day of end month

  return {
    label: `Q${quarterNumber} ${year}`,
    startDate: formatDateOnly(start),
    endDate: formatDateOnly(end),
    quarterNumber,
    year,
  };
}

/**
 * Format a Date as "YYYY-MM-DD" (date-only string for Postgres).
 */
export function formatDateOnly(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Human-readable relative time.
 *
 *   formatRelativeTime(Date.now() - 30_000)        → "just now"
 *   formatRelativeTime(Date.now() - 5 * 60_000)    → "5m ago"
 *   formatRelativeTime(Date.now() - 3 * 3_600_000) → "3h ago"
 *   formatRelativeTime(Date.now() - 86_400_000)    → "yesterday"
 *   formatRelativeTime(Date.now() - 3 * 86_400_000)→ "3 days ago"
 *   formatRelativeTime(Date.now() - 30 * 86_400_000)→ "Apr 12" (local format)
 */
export function formatRelativeTime(date: Date | number, now: number = Date.now()): string {
  const then = date instanceof Date ? date.getTime() : date;
  const diffMs = now - then;
  const min = Math.floor(diffMs / 60_000);
  const hr = Math.floor(diffMs / 3_600_000);
  const day = Math.floor(diffMs / 86_400_000);

  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day === 1) return "yesterday";
  if (day < 7) return `${day} days ago`;

  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
