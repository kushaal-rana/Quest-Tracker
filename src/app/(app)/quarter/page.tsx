import Link from "next/link";
import { PieChart, BookOpen, Clock, CalendarDays, Flame, Sparkles, ArrowRight, History } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getOrCreateCurrentQuarter, getPastQuarterSummaries } from "@/features/quarters/queries";
import { calcQuarterProgress } from "@/features/quarters/lib";
import { listQuestsForQuarter } from "@/features/quests/queries";
import { getCumulativeProgress } from "@/features/insights/queries";
import { calcCurrentStreak } from "@/features/streaks/queries";
import { ScorecardTile } from "@/features/insights/components/scorecard-tile";
import { QuarterRing } from "@/features/insights/components/quarter-ring";
import { CumulativeChart } from "@/features/insights/components/cumulative-chart";
import { QuestProgressBar } from "@/features/quests/components/quest-progress-bar";
import { formatHours } from "@/lib/format/hours";
import { formatShortDate } from "@/lib/format/date";
import { formatMeasure, ROUTES } from "@/lib/constants";

export const metadata = { title: "Quarter · Quest Tracker" };

export default async function QuarterPage() {
  const user = await requireUser();
  const quarter = await getOrCreateCurrentQuarter(user.id);
  const progress = calcQuarterProgress(quarter);

  const [quests, cumulativeSeries, streak, pastQuarters] = await Promise.all([
    listQuestsForQuarter(user.id, quarter.id),
    getCumulativeProgress(user.id, quarter.id),
    calcCurrentStreak(user.id),
    getPastQuarterSummaries(user.id, quarter.id),
  ]);

  const totalHours = quests.reduce((acc, q) => acc + q.hoursLogged, 0);
  const totalLessons = quests.reduce((acc, q) => acc + q.lessonsCompleted, 0);

  const streakColor =
    streak >= 14 ? "text-red-500" : streak >= 3 ? "text-orange-500" : undefined;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-3 font-mono text-[14px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {quarter.label} · {Math.round(progress.fraction * 100)}% complete
      </div>
      <h1 className="flex items-center gap-3 text-4xl font-semibold tracking-tight">
        <PieChart className="h-9 w-9 text-indigo-400" strokeWidth={1.5} />
        Quarter View
      </h1>

      {/* Scorecard tiles + ring */}
      <div className="mt-6 grid grid-cols-[1fr_1fr_1fr_1fr_auto] items-stretch gap-3">
        <ScorecardTile
          label="Total hours"
          value={formatHours(totalHours)}
          subtext="this quarter"
          Icon={Clock}
          iconColor="text-indigo-500"
        />
        <ScorecardTile
          label="Lessons done"
          value={totalLessons}
          subtext="this quarter"
          Icon={BookOpen}
          iconColor="text-emerald-500"
        />
        <ScorecardTile
          label="Current streak"
          value={streak === 0 ? "–" : `${streak}d`}
          subtext={streak === 0 ? "Start a streak today" : `${streak} days in a row`}
          Icon={Flame}
          iconColor={streakColor ?? "text-muted-foreground"}
          valueColor={streakColor}
        />
        <ScorecardTile
          label="Days remaining"
          value={progress.daysRemaining}
          subtext={`of ${progress.totalDays} total`}
          Icon={CalendarDays}
          iconColor="text-violet-500"
        />
        <QuarterRing
          fraction={progress.fraction}
          daysElapsed={progress.daysElapsed}
          totalDays={progress.totalDays}
          daysRemaining={progress.daysRemaining}
        />
      </div>

      {/* Cumulative progress chart */}
      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="mb-1 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
          Cumulative progress
        </h2>
        <p className="mb-4 text-[12px] text-muted-foreground">
          Progress % per quest over time — {quarter.label}
        </p>
        <CumulativeChart
          series={cumulativeSeries}
          quarterStart={quarter.startDate}
          quarterEnd={quarter.endDate}
        />
      </div>

      {/* Quest progress list */}
      {quests.length > 0 && (
        <div className="mt-4 rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-3.5">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
              Quest progress
            </h2>
          </div>
          <div className="divide-y divide-border">
            {quests.map((q) => (
              <div key={q.id} className="px-5 py-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: q.color }}
                    />
                    <span className="text-[14px] font-medium text-foreground">{q.name}</span>
                  </div>
                  <span className="font-mono text-[13px] text-muted-foreground">
                    {q.measure === "lessons"
                      ? `${q.lessonsCompleted} / ${q.targetCount} lessons`
                      : `${formatHours(q.hoursLogged)} / ${formatMeasure(q.targetCount, q.measure)}`}
                  </span>
                </div>
                <QuestProgressBar progress={q.progress} />
              </div>
            ))}
          </div>
        </div>
      )}

      {quests.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center text-[14px] text-muted-foreground">
          No active quests this quarter.
        </div>
      )}

      {/* Reflection card — always visible on the quarter page */}
      <div className="mt-4 rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3.5">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
            Reflection
          </h2>
        </div>
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 shrink-0 text-amber-400" strokeWidth={1.75} />
            <div>
              <div className="text-[14px] font-medium text-foreground">
                {quarter.reflection
                  ? "Reflection written"
                  : progress.daysRemaining <= 7
                    ? "Time to reflect on this quarter"
                    : "Reflection · end of quarter ritual"}
              </div>
              <div className="text-[12px] text-muted-foreground">
                {quarter.reflection
                  ? "Edit your reflection anytime."
                  : "Wins · Misses · Carry-forwards · What you learned."}
              </div>
            </div>
          </div>
          <Link
            href={ROUTES.quarterReview(quarter.id)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-muted/50"
          >
            {quarter.reflection ? "Edit reflection" : "Write reflection"}
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
        </div>
      </div>

      {/* Past quarters */}
      <div className="mt-4 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
          <History className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
            Past quarters
          </h2>
        </div>

        {pastQuarters.length === 0 ? (
          <p className="px-5 py-6 text-center text-[13px] text-muted-foreground">
            Your first complete quarter will appear here.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {pastQuarters.map((pq) => (
              <div key={pq.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-start gap-4">
                  <div>
                    <div className="text-[14px] font-medium text-foreground">{pq.label}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      {formatShortDate(pq.startDate)} → {formatShortDate(pq.endDate)}
                    </div>
                    {pq.reflection && (
                      <p className="mt-1 line-clamp-1 max-w-sm text-[12px] text-muted-foreground">
                        {pq.reflection}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-mono text-[18px] font-semibold text-foreground">
                      {pq.completedPct}%
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {pq.totalQuests} quest{pq.totalQuests !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <Link
                    href={ROUTES.quarterReview(pq.id)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted/50"
                  >
                    {pq.reflection ? "View reflection" : "Add reflection"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
