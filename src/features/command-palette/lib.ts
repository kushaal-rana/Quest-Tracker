import { parseHours } from "@/lib/format/hours";

/**
 * Quick-log input parser.
 *
 *   "1.5 stock"       → { hours: 1.5, query: "stock" }
 *   "stock 1.5"       → { hours: 1.5, query: "stock" }
 *   "1h30m claude"    → { hours: 1.5, query: "claude" }
 *   "log 1.5 stock"   → { hours: 1.5, query: "stock" }       // "log" prefix stripped
 *   "stock"           → { hours: null, query: "stock" }      // no number = nav match
 *   "1.5"             → { hours: 1.5, query: "" }            // hours but no quest yet
 *
 * Strategy:
 * - Strip a leading "log" / "logged" / "+" if present
 * - Find the first token that parses to hours
 * - The remaining tokens (in original order) become the search query
 */
export type QuickLogParsed = {
  hours: number | null;
  query: string;
};

const PREFIX_WORDS = new Set(["log", "logged", "+"]);

export function parseQuickLog(input: string): QuickLogParsed {
  const tokens = input.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return { hours: null, query: "" };

  // Strip leading prefix words
  let start = 0;
  while (start < tokens.length && PREFIX_WORDS.has(tokens[start].toLowerCase())) {
    start++;
  }
  const rest = tokens.slice(start);

  // Find the first token that parses to hours
  let hours: number | null = null;
  const queryTokens: string[] = [];
  for (const tok of rest) {
    if (hours === null) {
      const parsed = parseHours(tok);
      if (parsed !== null) {
        hours = parsed;
        continue;
      }
    }
    queryTokens.push(tok);
  }

  return { hours, query: queryTokens.join(" ") };
}

/**
 * Fuzzy-match a query against a list of items by name.
 * Simple substring + acronym match; no fancy scoring.
 *
 *   match("stock",  "Stock Market") → true
 *   match("sm",     "Stock Market") → true (acronym)
 *   match("cc",     "Claude Code")  → true
 *   match("market", "Stock Market") → true
 */
export function fuzzyMatch(query: string, name: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase().trim();
  const n = name.toLowerCase();

  // Direct substring
  if (n.includes(q)) return true;

  // Acronym (first letter of each word)
  const acronym = name
    .split(/\s+/)
    .map((w) => w[0]?.toLowerCase() ?? "")
    .join("");
  if (acronym.startsWith(q)) return true;

  return false;
}
