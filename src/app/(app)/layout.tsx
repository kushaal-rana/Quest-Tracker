import { redirect } from "next/navigation";
import Link from "next/link";
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
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";

type NavItem = { href: string; label: string; Icon: LucideIcon };
type NavSection = { label: string; items: NavItem[] };

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Workspace",
    items: [
      { href: "/", label: "Dashboard", Icon: LayoutDashboard },
      { href: "/today", label: "Today", Icon: Sun },
      { href: "/week", label: "This Week", Icon: CalendarDays },
      { href: "/month", label: "This Month", Icon: CalendarRange },
      { href: "/quarter", label: "Quarter View", Icon: PieChart },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/streaks", label: "Streaks", Icon: Flame },
      { href: "/logs", label: "Logs", Icon: ScrollText },
    ],
  },
  {
    label: "Account",
    items: [{ href: "/settings", label: "Settings", Icon: Settings }],
  },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const displayName =
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    user.email ||
    "";
  const initial = (displayName.trim()[0] || "?").toUpperCase();

  return (
    <div className="grid h-screen grid-cols-[220px_1fr] bg-background text-foreground">
      <aside className="flex flex-col gap-0.5 overflow-y-auto border-r border-border bg-muted/30 px-2 py-4">
        <div className="mb-6 flex items-center gap-3 px-2 py-1">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-foreground text-background text-base font-bold">
            Q
          </div>
          <span className="text-[20px] font-semibold tracking-tight">Quest Tracker</span>
        </div>

        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-5 last:mb-0">
            <div className="px-2 pt-2 pb-2 text-[14px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {section.label}
            </div>
            {section.items.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex w-full items-center gap-3 rounded-md px-2 py-2 text-[18px] font-medium leading-6 text-foreground/85 transition-colors hover:bg-foreground/[0.07] hover:text-foreground"
              >
                <Icon
                  className="h-[22px] w-[22px] shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        ))}
      </aside>

      <div className="flex flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b border-border bg-background px-6 py-3.5">
          <div className="text-[15px] text-muted-foreground">
            Workspace <span className="mx-1.5 opacity-60">/</span>
            <span className="font-medium text-foreground">Dashboard</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden min-w-[320px] cursor-pointer items-center gap-2 rounded-md border border-border bg-muted/50 px-3.5 py-2 text-[14px] text-muted-foreground transition-colors hover:bg-muted md:flex">
              <span className="text-[13px] opacity-70">⌘</span>
              <span className="flex-1">Quick log a session…</span>
              <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[11px]">
                ⌘K
              </kbd>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-[15px] font-semibold text-white shadow-sm">
                {initial}
              </div>
              <SignOutButton />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
