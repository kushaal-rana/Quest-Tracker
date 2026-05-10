/**
 * Single source of truth for all URL paths.
 * Use these constants instead of string literals — refactoring routes
 * becomes a one-file change.
 *
 * Pattern:
 *   import { ROUTES } from "@/lib/constants/routes";
 *   <Link href={ROUTES.questNew}>New quest</Link>
 *   <Link href={ROUTES.questDetail(quest.id)}>Open</Link>
 */
export const ROUTES = {
  // Public
  login: "/login",
  authCallback: "/auth/callback",

  // App (auth-gated)
  dashboard: "/",
  today: "/today",
  week: "/week",
  month: "/month",
  quarter: "/quarter",
  streaks: "/streaks",
  logs: "/logs",
  settings: "/settings",

  // Quests
  questNew: "/quest/new",
  questDetail: (id: string) => `/quest/${id}`,
} as const;

export type RoutePath =
  | (typeof ROUTES)[keyof Omit<typeof ROUTES, "questDetail">]
  | ReturnType<typeof ROUTES.questDetail>;
