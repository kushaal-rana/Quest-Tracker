import {
  LayoutDashboard,
  Sun,
  CalendarDays,
  CalendarRange,
  PieChart,
  Flame,
  ScrollText,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "./routes";

/**
 * Sidebar navigation — single source of truth.
 * Add/remove items here; the layout reads from this constant.
 */

export type NavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export const NAV_SECTIONS: ReadonlyArray<NavSection> = [
  {
    label: "Workspace",
    items: [
      { href: ROUTES.dashboard, label: "Dashboard", Icon: LayoutDashboard },
      { href: ROUTES.today, label: "Today", Icon: Sun },
      { href: ROUTES.week, label: "This Week", Icon: CalendarDays },
      { href: ROUTES.month, label: "This Month", Icon: CalendarRange },
      { href: ROUTES.quarter, label: "Quarter View", Icon: PieChart },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: ROUTES.streaks, label: "Streaks", Icon: Flame },
      { href: ROUTES.logs, label: "Logs", Icon: ScrollText },
    ],
  },
  {
    label: "Account",
    items: [{ href: ROUTES.settings, label: "Settings", Icon: Settings }],
  },
];
