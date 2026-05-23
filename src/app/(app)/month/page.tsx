import { CalendarRange } from "lucide-react";
import { requireUser } from "@/lib/auth";
import {
  getMonthSummary,
  monthStartForTZ,
  monthEndForTZ,
} from "@/features/insights/queries";
import { getUserTimezone } from "@/features/profiles/queries";
import { WeekHeatmap } from "@/features/insights/components/week-heatmap";
import { formatHours } from "@/lib/format/hours";

export const metadata = { title: "This Month · Quest Tracker" };

export default async function MonthPage() {
  const user = await requireUser();
  const tz = await getUserTimezone(user.id);

  const now = new Date();
  const mStart = monthStartForTZ(tz, now);
  const mEnd = monthEndForTZ(tz, now);

  // Last month: 1ms before mStart = last moment of previous month
  const prevMonthDate = new Date(mStart.getTime() - 1);
  const lastMonthStart = monthStartForTZ(tz, prevMonthDate);
  const lastMonthEnd = monthEndForTZ(tz, prevMonthDate);

  const [current, prev] = await Promise.all([
    getMonthSummary(user.id, mStart, mEnd, tz),
    getMonthSummary(user.id, lastMonthStart, lastMonthEnd, tz),
  ]);

  // Build heatmap: average hours per weekday (Mon=0..Sun=6) for this month
  const weekdayTotals = Array(7).fill(0) as number[];
  const weekdayDays = Array(7).fill(0) as number[];
  for (const row of current.sessionsByDay) {
    const [y, m, d] = row.date.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    const dow = (date.getUTCDay() + 6) % 7;
    weekdayTotals[dow] += row.hours;
    weekdayDays[dow]++;
  }
  const heatmapHours = weekdayTotals.map((total, i) =>
    weekdayDays[i] > 0 ? total / weekdayDays[i] : 0,
  );

  const totalThisMonth = current.questTotals.reduce((acc, q) => acc + q.hoursLogged, 0);
  const totalLastMonth = prev.questTotals.reduce((acc, q) => acc + q.hoursLogged, 0);
  const deltaHours = totalThisMonth - totalLastMonth;

  const monthLabel = now.toLocaleDateString("en-US", { timeZone: tz, month: "long", year: "numeric" });
  const prevMonthLabel = prevMonthDate.toLocaleDateString("en-US", { timeZone: tz, month: "long" });

  // Max hours for bar scaling
  const maxQuestHours = Math.max(...current.questTotals.map((q) => q.hoursLogged), 1);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-3 font-mono text-[14px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {monthLabel}
      </div>
      <h1 className="flex items-center gap-3 text-4xl font-semibold tracking-tight">
        <CalendarRange className="h-9 w-9 text-violet-400" strokeWidth={1.5} />
        This Month
      </h1>

      {/* Summary row */}
      <div className="mt-6 flex items-baseline gap-4">
        <div className="font-mono text-[36px] font-semibold text-foreground">
          {formatHours(totalThisMonth)}
        </div>
        <div className="text-[14px] text-muted-foreground">
          logged this month
          {totalLastMonth > 0 && (
            <span
              className={
                deltaHours >= 0
                  ? "ml-2 text-emerald-600"
                  : "ml-2 text-red-500"
              }
            >
              {deltaHours >= 0 ? "+" : ""}
              {formatHours(Math.abs(deltaHours))} vs {prevMonthLabel}
            </span>
          )}
        </div>
      </div>

      {/* Quest horizontal bars */}
      {current.questTotals.length > 0 ? (
        <div className="mt-6 rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
            Hours by quest
          </h2>
          <div className="space-y-4">
            {current.questTotals
              .sort((a, b) => b.hoursLogged - a.hoursLogged)
              .map((q) => {
                const prevQuest = prev.questTotals.find((p) => p.questId === q.questId);
                const deltaQ = q.hoursLogged - (prevQuest?.hoursLogged ?? 0);
                return (
                  <div key={q.questId}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: q.questColor }}
                        />
                        <span className="text-[14px] font-medium text-foreground">
                          {q.questName}
                        </span>
                        {q.lessonsCompleted > 0 && (
                          <span className="text-[12px] text-emerald-600">
                            +{q.lessonsCompleted} lesson{q.lessonsCompleted === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {prevQuest && deltaQ !== 0 && (
                          <span
                            className={
                              deltaQ > 0 ? "text-[12px] text-emerald-600" : "text-[12px] text-red-500"
                            }
                          >
                            {deltaQ > 0 ? "+" : ""}
                            {formatHours(Math.abs(deltaQ))}
                          </span>
                        )}
                        <span className="font-mono text-[14px] text-muted-foreground">
                          {formatHours(q.hoursLogged)}
                        </span>
                      </div>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/50">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(q.hoursLogged / maxQuestHours) * 100}%`,
                          backgroundColor: q.questColor,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center text-[14px] text-muted-foreground">
          No sessions logged this month yet.
        </div>
      )}

      {/* Weekday heatmap */}
      <div className="mt-4 rounded-xl border border-border bg-card p-5">
        <h2 className="mb-1 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
          Average hours by weekday
        </h2>
        <p className="mb-4 text-[12px] text-muted-foreground">
          Which days of the week you tend to log most
        </p>
        <WeekHeatmap days={heatmapHours} />
      </div>
    </div>
  );
}
