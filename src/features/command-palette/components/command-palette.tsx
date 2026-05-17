"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  ArrowRight,
  CalendarDays,
  CalendarRange,
  Flame,
  LayoutDashboard,
  Plus,
  ScrollText,
  Settings,
  Sun,
  PieChart,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { celebrate } from "@/lib/celebrate";
import { formatHours } from "@/lib/format/hours";
import { ROUTES } from "@/lib/constants";
import type { QuestPickerRow } from "@/features/quests/queries";
import { createSessionAction } from "@/features/sessions/actions";
import { fuzzyMatch, parseQuickLog } from "../lib";

type Props = {
  quests: QuestPickerRow[];
};

/**
 * Global ⌘K command palette.
 *
 * Two modes (auto-detected from input):
 *   - Quick-log mode (input contains a number)
 *       e.g. "1.5 stock" → matches "Stock Market" → Enter logs 1.5h to it
 *   - Browse mode (no number, or empty input)
 *       Shows: matching quests (Open) + nav shortcuts (Dashboard, New quest, ...)
 *
 * Open with ⌘K / Ctrl+K. Close with Esc.
 */
export function CommandPalette({ quests }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();

  // Global ⌘K / Ctrl+K listener
  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKeydown);
    return () => document.removeEventListener("keydown", onKeydown);
  }, []);

  // Reset input when closed
  useEffect(() => {
    if (!open) setInput("");
  }, [open]);

  const parsed = parseQuickLog(input);
  const isLogMode = parsed.hours !== null;

  const matchedQuests = quests.filter((q) =>
    fuzzyMatch(parsed.query || input, q.name),
  );

  function navigate(path: string) {
    setOpen(false);
    router.push(path);
  }

  function quickLog(quest: QuestPickerRow) {
    if (parsed.hours === null) return;
    const hoursToLog = parsed.hours;

    setOpen(false);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("questId", quest.id);
      fd.append("hours", String(hoursToLog));

      const result = await createSessionAction({ ok: false }, fd);

      if (!result.ok) {
        toast.error(result.message ?? "Couldn't log session");
        return;
      }

      const data = result.data;
      if (data?.streakIsMilestone && data.streakDays > 0) {
        celebrate.streakMilestone(data.streakDays);
      } else if (data?.crossedMilestone) {
        celebrate.questMilestone(data.crossedMilestone);
      }

      const streakSuffix =
        data && data.streakDays > 1
          ? ` · 🔥 ${data.streakDays}-day streak`
          : data && data.streakDays === 1
            ? " · 🔥 streak started!"
            : "";
      toast.success(`Logged ${formatHours(hoursToLog)} to ${quest.name}${streakSuffix}`, {
        duration: 4000,
      });
    });
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 backdrop-blur-sm p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="mt-[12vh] w-full max-w-xl rounded-xl border border-border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Command label="Command palette" shouldFilter={false}>
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Zap className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
            <Command.Input
              autoFocus
              value={input}
              onValueChange={setInput}
              placeholder='Quick-log: "1.5 stock"  ·  Or search quests + actions'
              className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/60"
            />
            <kbd className="rounded border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              esc
            </kbd>
          </div>

          <Command.List className="max-h-[50vh] overflow-y-auto p-2">
            <Command.Empty className="px-3 py-8 text-center text-[13px] text-muted-foreground">
              No matches. Try a quest name or hours like &ldquo;1h30m&rdquo;.
            </Command.Empty>

            {/* Quick-log section (when input has hours) */}
            {isLogMode && matchedQuests.length > 0 && (
              <Command.Group
                heading={`Log ${formatHours(parsed.hours!)} to…`}
                className="mb-2 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground"
              >
                {matchedQuests.map((q) => (
                  <PaletteRow
                    key={q.id}
                    onSelect={() => quickLog(q)}
                    leading={
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: q.color }}
                        aria-hidden="true"
                      />
                    }
                    label={q.name}
                    trailing={
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {isPending ? "logging…" : "↵"}
                      </span>
                    }
                  />
                ))}
              </Command.Group>
            )}

            {/* Browse: matched quests (when no hours in input) */}
            {!isLogMode && matchedQuests.length > 0 && (
              <Command.Group
                heading="Quests"
                className="mb-2 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground"
              >
                {matchedQuests.map((q) => (
                  <PaletteRow
                    key={q.id}
                    onSelect={() => navigate(ROUTES.questDetail(q.id))}
                    leading={
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: q.color }}
                        aria-hidden="true"
                      />
                    }
                    label={`Open ${q.name}`}
                    trailing={<ArrowRight className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />}
                  />
                ))}
              </Command.Group>
            )}

            {/* Navigation shortcuts (always shown when not in log mode) */}
            {!isLogMode && (
              <Command.Group
                heading="Navigate"
                className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground"
              >
                {NAV_ACTIONS.filter((a) => fuzzyMatch(input, a.label)).map((a) => (
                  <PaletteRow
                    key={a.href}
                    onSelect={() => navigate(a.href)}
                    leading={<a.Icon className="h-4 w-4 text-muted-foreground" strokeWidth={2} />}
                    label={a.label}
                  />
                ))}
              </Command.Group>
            )}
          </Command.List>

          <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
            <span>
              <kbd className="rounded border border-border bg-muted/40 px-1 py-0.5 font-mono">↑↓</kbd> navigate ·{" "}
              <kbd className="rounded border border-border bg-muted/40 px-1 py-0.5 font-mono">↵</kbd> select
            </span>
            <span>Try: &ldquo;1.5 stock&rdquo; · &ldquo;new quest&rdquo;</span>
          </div>
        </Command>
      </div>
    </div>
  );
}

// ─── Sub-components & data ───────────────────────────────────────────────────

function PaletteRow({
  onSelect,
  leading,
  label,
  trailing,
}: {
  onSelect: () => void;
  leading: React.ReactNode;
  label: string;
  trailing?: React.ReactNode;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-[14px] text-foreground/90 aria-selected:bg-foreground/[0.07] aria-selected:text-foreground"
    >
      <span className="grid h-5 w-5 shrink-0 place-items-center">{leading}</span>
      <span className="flex-1 truncate">{label}</span>
      {trailing && <span className="shrink-0">{trailing}</span>}
    </Command.Item>
  );
}

const NAV_ACTIONS: ReadonlyArray<{ label: string; href: string; Icon: LucideIcon }> = [
  { label: "Open Dashboard", href: ROUTES.dashboard, Icon: LayoutDashboard },
  { label: "New quest", href: ROUTES.questNew, Icon: Plus },
  { label: "Today", href: ROUTES.today, Icon: Sun },
  { label: "This Week", href: ROUTES.week, Icon: CalendarDays },
  { label: "This Month", href: ROUTES.month, Icon: CalendarRange },
  { label: "Quarter View", href: ROUTES.quarter, Icon: PieChart },
  { label: "Streaks", href: ROUTES.streaks, Icon: Flame },
  { label: "Logs", href: ROUTES.logs, Icon: ScrollText },
  { label: "Settings", href: ROUTES.settings, Icon: Settings },
];
