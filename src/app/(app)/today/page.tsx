import { Sun } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getTodaySessionsGrouped } from "@/features/insights/queries";
import { getUserTimezone } from "@/features/profiles/queries";
import { formatHours } from "@/lib/format/hours";
import { formatRelativeTime } from "@/lib/format/date";

export const metadata = { title: "Today · Quest Tracker" };

export default async function TodayPage() {
  const user = await requireUser();
  const tz = await getUserTimezone(user.id);
  const groups = await getTodaySessionsGrouped(user.id, tz);

  const totalHours = groups.reduce((acc, g) => acc + g.totalHours, 0);

  const dateLabel = new Date().toLocaleDateString("en-US", {
    timeZone: tz,
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-3 font-mono text-[14px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {dateLabel}
      </div>
      <div className="flex items-end justify-between gap-4">
        <h1 className="flex items-center gap-3 text-4xl font-semibold tracking-tight">
          <Sun className="h-9 w-9 text-amber-400" strokeWidth={1.5} />
          Today
        </h1>
        {totalHours > 0 && (
          <div className="font-mono text-[22px] font-semibold text-foreground">
            {formatHours(totalHours)}{" "}
            <span className="text-[15px] font-normal text-muted-foreground">logged</span>
          </div>
        )}
      </div>

      <div className="mt-8">
        {groups.length === 0 ? (
          <EmptyToday />
        ) : (
          <div className="space-y-6">
            {groups.map((g) => (
              <QuestGroup key={g.questId} group={g} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QuestGroup({
  group,
}: {
  group: {
    questId: string;
    questName: string;
    questColor: string;
    totalHours: number;
    sessions: {
      id: string;
      hours: number;
      note: string | null;
      lessonTitle: string | null;
      loggedAt: Date;
    }[];
  };
}) {
  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Quest header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: group.questColor }}
            aria-hidden="true"
          />
          <span className="font-medium text-foreground">{group.questName}</span>
        </div>
        <span className="font-mono text-[14px] font-medium text-muted-foreground">
          {formatHours(group.totalHours)}
        </span>
      </div>

      {/* Sessions */}
      <div className="divide-y divide-border">
        {group.sessions.map((s) => (
          <div key={s.id} className="flex items-start gap-3 px-4 py-3">
            <span className="mt-0.5 font-mono text-[14px] font-medium text-foreground">
              {formatHours(s.hours)}
            </span>
            <div className="min-w-0 flex-1">
              {s.lessonTitle && (
                <div className="mb-0.5 text-[12px] font-medium text-emerald-600">
                  ✓ {s.lessonTitle}
                </div>
              )}
              {s.note && (
                <div className="text-[13px] text-foreground/80">{s.note}</div>
              )}
              {!s.note && !s.lessonTitle && (
                <div className="text-[13px] text-muted-foreground">No note</div>
              )}
            </div>
            <span className="shrink-0 text-[12px] text-muted-foreground">
              {formatRelativeTime(s.loggedAt)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyToday() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-amber-50 text-amber-400">
        <Sun className="h-6 w-6" strokeWidth={1.5} />
      </div>
      <h2 className="text-xl font-medium">Nothing logged yet today</h2>
      <p className="mt-2 text-[15px] text-muted-foreground">
        Press{" "}
        <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[12px]">
          ⌘K
        </kbd>{" "}
        to log a session — it takes less than 5 seconds.
      </p>
    </div>
  );
}
