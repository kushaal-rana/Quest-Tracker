/**
 * Hours parser + formatter.
 *
 * Used by:
 * - Session log form ("1h30m" → 1.5 stored in DB)
 * - ⌘K palette quick-log ("1.5 stock" → parses 1.5 then matches "stock" to a quest)
 * - Display anywhere we render hours back to the user
 *
 * ────────── Accepted parse formats (strict — locked Phase 3 Q2 = A) ──────────
 *
 *   "1.5"      → 1.5     plain decimal
 *   "1"        → 1       plain integer
 *   "0.5"      → 0.5     leading zero
 *   ".5"       → 0.5     no leading zero
 *   "1h"       → 1       hours-only
 *   "30m"      → 0.5     minutes-only
 *   "1h30m"    → 1.5     hours + minutes
 *   "1h 30m"   → 1.5     space allowed between
 *   "1:30"     → 1.5     clock-style HH:MM
 *   "0:30"     → 0.5
 *   "  1.5  "  → 1.5     whitespace ignored
 *
 * Rejected:
 *   "" / "abc" / "1 hour" / "30 mins" / "1.5h" (decimal hours with h suffix)
 *   negative numbers, > 24h, NaN, Infinity
 *
 * Returns null on invalid input — callers should treat null as a validation
 * error and surface a helpful message ("Use 1h30m, 90m, 1.5, or 1:30").
 */

const MAX_HOURS = 24;

export function parseHours(input: string): number | null {
  if (typeof input !== "string") return null;
  const raw = input.trim().toLowerCase();
  if (raw === "") return null;

  let value: number | null = null;

  // 1) HH:MM clock style — "1:30" → 1.5
  const clockMatch = raw.match(/^(\d+):([0-5]?\d)$/);
  if (clockMatch) {
    const h = Number(clockMatch[1]);
    const m = Number(clockMatch[2]);
    value = h + m / 60;
  }

  // 2) "XhYm" / "Xh" / "Ym" — integer parts only
  // Accepts: "1h", "30m", "1h30m", "1h 30m"
  if (value === null) {
    const hmMatch = raw.match(/^(?:(\d+)h)?\s*(?:(\d+)m)?$/);
    if (hmMatch && (hmMatch[1] !== undefined || hmMatch[2] !== undefined)) {
      const h = hmMatch[1] ? Number(hmMatch[1]) : 0;
      const m = hmMatch[2] ? Number(hmMatch[2]) : 0;
      if (m < 60 || hmMatch[1] === undefined) {
        // Allow "90m" (m >= 60 only when no h component)
        value = h + m / 60;
      }
    }
  }

  // 3) Plain decimal — "1.5" / "1" / ".5" / "0.5"
  if (value === null) {
    const decMatch = raw.match(/^(\d+\.?\d*|\.\d+)$/);
    if (decMatch) {
      value = Number(decMatch[1]);
    }
  }

  // Validate
  if (value === null || !Number.isFinite(value)) return null;
  if (value <= 0 || value > MAX_HOURS) return null;

  // Round to 2 decimals (matches DB precision: numeric(4,2))
  return Math.round(value * 100) / 100;
}

/**
 * Format a decimal number of hours as a human-readable string.
 *
 *   formatHours(1.5)  → "1h 30m"
 *   formatHours(0.5)  → "30m"
 *   formatHours(2)    → "2h"
 *   formatHours(2.25) → "2h 15m"
 *   formatHours(0.1)  → "6m"
 */
export function formatHours(decimal: number): string {
  if (!Number.isFinite(decimal) || decimal <= 0) return "0m";

  const totalMinutes = Math.round(decimal * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Compact decimal display — "1.5h" / "2h" / "0.5h".
 * Use for tabular contexts where "1h 30m" would be too wide.
 */
export function formatHoursDecimal(decimal: number): string {
  if (!Number.isFinite(decimal) || decimal <= 0) return "0h";
  if (Number.isInteger(decimal)) return `${decimal}h`;
  return `${decimal.toFixed(1)}h`;
}
