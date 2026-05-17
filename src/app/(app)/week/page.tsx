import { CalendarDays } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getOrCreateCurrentQuarter } from "@/features/quarters/queries";
import { listQuestsForQuarter } from "@/features/quests/queries";
import {
  getWeeklySummary,
  getSessionsByDayForRange,
  weekStartUTC,
  weekEndUTC,
} from "@/features/insights/queries";
import type { BarChartDay } from "@/features/insights/components/weekly-bar-chart";
import { WeekHeatmap } from "@/features/insights/components/week-heatmap";
import { WeeklyBarChart } from "@/features/insights/components/weekly-bar-chart";
import { ScorecardTile } from "@/features/insights/components/scorecard-tile";
import { formatHours } from "@/lib/format/hours";
import { BookOpen, Clock, TrendingUp } from "lucide-react";

export const metadata = { title: "This Week · Quest Tracker" };

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export default async function WeekPage() {
  const user = await requireUser();
  const quarter = await getOrCreateCurrentQuarter(user.id);

  const now = new Date();
  const wStart = weekStartUTC(now);
  const wEnd = weekEndUTC(now);

  const [summary, dayRows, quests] = await Promise.all([
    getWeeklySummary(user.id, wStart, wEnd),
    getSessionsByDayForRange(user.id, wStart, wEnd),
    listQuestsForQuarter(user.id, quarter.id),
  ]);

  // Build heatmap: 7 values Mon–Sun
  const heatmapHours: number[] = Array(7).fill(0);
  for (const row of dayRows) {
    const [y, m, d] = row.date.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    const dow = (date.getUTCDay() + 6) % 7; // Mon=0..Sun=6
    heatmapHours[dow] = (heatmapHours[dow] ?? 0) + row.hours;
  }

  // Build bar chart data
  const barDays: BarChartDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(wStart);
    d.setUTCDate(wStart.getUTCDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const dayRows_ = dayRows.filter((r) => r.date === iso);
    barDays.push({
      day: DAY_LABELS[i],
      date: iso,
      totalHours: dayRows_.reduce((acc, r) => acc + r.hours, 0),
      byQuest: dayRows_.map((r) => ({
        questId: r.questId,
        questName: r.questName,
        questColor: r.questColor,
        hours: r.hours,
      })),
    });
  }

  // Quest week totals
  const questTotals = quests.map((q) => {
    const hrs = dayRows.filter((r) => r.questId === q.id).reduce((acc, r) => acc + r.hours, 0);
    return { ...q, hoursThisWeek: hrs };
  }).filter((q) => q.hoursThisWeek > 0 || true);

  const activeDays = heatmapHours.filter((h) => h > 0).length;
  const maxSession = dayRows.length > 0 ? Math.max(...dayRows.map((r) => r.hours)) : 0;

  const weekLabel = wStart.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    " – " + wEnd.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-3 font-mono text-[14px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {weekLabel}
      </div>
      <h1 className="flex items-center gap-3 text-4xl font-semibold tracking-tight">
        <CalendarDays className="h-9 w-9 text-indigo-400" strokeWidth={1.5} />
        This Week
      </h1>

      {/* Tiles */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <ScorecardTile
          label="Hours logged"
          value={formatHours(summary.hoursThisWeek)}
          subtext="this week"
          Icon={Clock}
          iconColor="text-indigo-500"
        />
        <ScorecardTile
          label="Lessons done"
          value={summary.lessonsThisWeek}
          subtext="this week"
          Icon={BookOpen}
          iconColor="text-emerald-500"
        />
        <ScorecardTile
          label="Active days"
          value={`${activeDays} / 7`}
          subtext={maxSession > 0 ? `longest: ${formatHours(maxSession)}` : "no sessions yet"}
          Icon={TrendingUp}
          iconColor="text-violet-500"
        />
      </div>

      {/* Heatmap */}
      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
          Day-by-day activity
        </h2>
        <WeekHeatmap days={heatmapHours} />
      </div>

      {/* Bar chart */}
      <div className="mt-4 rounded-xl border border-border bg-card p-5">
        <WeeklyBarChart days={barDays} />
      </div>

      {/* Quest breakdown */}
      {questTotals.some((q) => q.hoursThisWeek > 0) && (
        <div className="mt-4 rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-3.5">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
              Quest breakdown
            </h2>
          </div>
          <div className="divide-y divide-border">
            {questTotals
              .filter((q) => q.hoursThisWeek > 0)
              .sort((a, b) => b.hoursThisWeek - a.hoursThisWeek)
              .map((q) => (
                <div key={q.id} className="flex items-center gap-3 px-5 py-3.5">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: q.color }}
                  />
                  <span className="flex-1 text-[14px] font-medium text-foreground">{q.name}</span>
                  <span className="font-mono text-[14px] text-muted-foreground">
                    {formatHours(q.hoursThisWeek)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
