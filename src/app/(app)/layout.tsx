import { requireUser } from "@/lib/auth";
import { getOrCreateCurrentQuarter } from "@/features/quarters/queries";
import { listActiveQuestsForPicker } from "@/features/quests/queries";
import { CommandPalette } from "@/features/command-palette/components/command-palette";
import { SidebarNav } from "./_components/sidebar-nav";
import { TopbarBreadcrumb } from "./_components/topbar-breadcrumb";
import { ModeToggle } from "./_components/mode-toggle";
import { SignOutButton } from "./sign-out-button";

/**
 * Authenticated app shell — sidebar + topbar.
 *
 * The sidebar nav is sourced from `lib/constants/nav.ts` so adding a route
 * is a one-file change. The topbar shows breadcrumbs + ⌘K placeholder + user.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  // Fetch the quest list for the ⌘K palette in parallel with user metadata.
  // Cheap query (just id/name/color/measure), happens once per RSC render.
  const quarter = await getOrCreateCurrentQuarter(user.id);
  const paletteQuests = await listActiveQuestsForPicker(user.id, quarter.id);

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

        <SidebarNav />
      </aside>

      <div className="flex flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b border-border bg-background px-6 py-3.5">
          <TopbarBreadcrumb />

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden min-w-[320px] cursor-pointer items-center gap-2 rounded-md border border-border bg-muted/50 px-3.5 py-2 text-[14px] text-muted-foreground transition-colors hover:bg-muted md:flex">
              <span className="text-[13px] opacity-70">⌘</span>
              <span className="flex-1">Quick log a session…</span>
              <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[11px]">
                ⌘K
              </kbd>
            </div>

            <div className="flex items-center gap-2.5">
              <ModeToggle />
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-[15px] font-semibold text-white shadow-sm">
                {initial}
              </div>
              <SignOutButton />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      {/* ⌘K command palette — global, listens for ⌘K/Ctrl+K from anywhere */}
      <CommandPalette quests={paletteQuests} />
    </div>
  );
}
