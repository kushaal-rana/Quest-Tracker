import { Flame } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getOrCreateCurrentQuarter } from "@/features/quarters/queries";
import { listQuestsForQuarter } from "@/features/quests/queries";
import { getUserTimezone } from "@/features/profiles/queries";
import {
  calcCurrentStreak,
  getLongestStreak,
  getStreakHistory,
  getAllQuestStreaks,
} from "@/features/streaks/queries";
import { StreakHistoryGrid } from "./streak-history-grid";
import { cn } from "@/lib/utils";

export const metadata = { title: "Streaks · Quest Tracker" };

const MILESTONE_DAYS = [3, 7, 14, 30, 60, 90] as const;

export default async function StreaksPage() {
  const user = await requireUser();
  const [quarter, tz] = await Promise.all([
    getOrCreateCurrentQuarter(user.id),
    getUserTimezone(user.id),
  ]);

  const [currentStreak, longest, history, quests] = await Promise.all([
    calcCurrentStreak(user.id, tz),
    getLongestStreak(user.id, tz),
    getStreakHistory(user.id, 91, tz),
    listQuestsForQuarter(user.id, quarter.id),
  ]);

  const questStreaks = await getAllQuestStreaks(
    user.id,
    quests.map((q) => q.id),
    quests.map((q) => ({ id: q.id, name: q.name, color: q.color })),
    tz,
  );

  const nextMilestone = MILESTONE_DAYS.find((m) => m > currentStreak) ?? null;

  const flameColor =
    currentStreak >= 14
      ? "text-red-500"
      : currentStreak >= 3
        ? "text-orange-400"
        : "text-muted-foreground";

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="flex items-center gap-3 text-4xl font-semibold tracking-tight">
        <Flame className={cn("h-9 w-9", flameColor)} strokeWidth={1.5} />
        Streaks
      </h1>

      {/* Big streak number */}
      <div className="mt-8 rounded-xl border border-border bg-card p-6 text-center">
        <div className={cn("font-mono text-[72px] font-bold leading-none", flameColor)}>
          {currentStreak}
        </div>
        <div className="mt-2 text-[17px] font-medium text-foreground">
          {currentStreak === 0 ? "No active streak" : currentStreak === 1 ? "1-day streak" : `${currentStreak}-day streak`}
        </div>
        <div className="mt-1 text-[14px] text-muted-foreground">
          {currentStreak === 0
            ? "Log a session today to start a streak."
            : nextMilestone
              ? `${nextMilestone - currentStreak} day${nextMilestone - currentStreak === 1 ? "" : "s"} to ${nextMilestone}-day milestone`
              : "You've hit the 90-day milestone — legendary."}
        </div>

        {/* Milestone badges */}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {MILESTONE_DAYS.map((m) => (
            <span
              key={m}
              className={cn(
                "rounded-full border px-3 py-1 text-[12px] font-medium",
                currentStreak >= m
                  ? "border-orange-300 bg-orange-50 text-orange-700"
                  : "border-border bg-muted/40 text-muted-foreground",
              )}
            >
              {m}d {currentStreak >= m ? "✓" : ""}
            </span>
          ))}
        </div>
      </div>

      {/* Longest streak */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
            Longest streak
          </div>
          <div className="mt-2 font-mono text-[28px] font-semibold text-foreground">
            {longest.days === 0 ? "–" : `${longest.days}d`}
          </div>
          <div className="mt-0.5 text-[12px] text-muted-foreground">
            {longest.endDate
              ? `ended ${new Date(longest.endDate + "T00:00:00Z").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
              : "No sessions yet"}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
            Active days (last 91)
          </div>
          <div className="mt-2 font-mono text-[28px] font-semibold text-foreground">
            {history.filter((d) => d.hasSession).length}
          </div>
          <div className="mt-0.5 text-[12px] text-muted-foreground">
            of 91 days
          </div>
        </div>
      </div>

      {/* Streak history grid */}
      <div className="mt-4 rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
          Last 91 days
        </h2>
        <StreakHistoryGrid days={history} />
      </div>

      {/* Per-quest streaks */}
      {questStreaks.length > 0 && (
        <div className="mt-4 rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-3.5">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
              Per-quest streaks
            </h2>
          </div>
          <div className="divide-y divide-border">
            {questStreaks.map((q) => (
              <div key={q.questId} className="flex items-center gap-3 px-5 py-3.5">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: q.questColor }}
                />
                <span className="flex-1 text-[14px] font-medium text-foreground">
                  {q.questName}
                </span>
                <div className="flex items-center gap-1.5">
                  <Flame
                    className={cn(
                      "h-4 w-4",
                      q.currentStreak >= 7
                        ? "text-red-500"
                        : q.currentStreak >= 3
                          ? "text-orange-400"
                          : "text-muted-foreground",
                    )}
                    strokeWidth={1.75}
                  />
                  <span className="font-mono text-[14px] font-medium text-foreground">
                    {q.currentStreak}d
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
