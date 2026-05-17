import Link from "next/link";
import { BookOpen, CalendarDays, Clock, Flame, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";
import { getOrCreateCurrentQuarter } from "@/features/quarters/queries";
import { calcQuarterProgress } from "@/features/quarters/lib";
import { listQuestsForQuarter } from "@/features/quests/queries";
import { QuestRow } from "@/features/quests/components/quest-row";
import { ScorecardTile } from "@/features/insights/components/scorecard-tile";
import { QuarterRing } from "@/features/insights/components/quarter-ring";
import {
  getWeeklySummary,
  weekStartUTC,
  weekEndUTC,
} from "@/features/insights/queries";
import { calcCurrentStreak } from "@/features/streaks/queries";
import { elapsedFraction } from "@/lib/format/date";
import { formatHours } from "@/lib/format/hours";
import { QuarterEndBanner } from "./_components/quarter-end-banner";

const NEW_QUEST_BUTTON_CLASS =
  "inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-[14px] font-medium text-background shadow-sm transition-colors hover:bg-foreground/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default async function DashboardPage() {
  const user = await requireUser();
  const quarter = await getOrCreateCurrentQuarter(user.id);

  const now = new Date();
  const wStart = weekStartUTC(now);
  const wEnd = weekEndUTC(now);

  const [quests, progress, weeklySummary, streak] = await Promise.all([
    listQuestsForQuarter(user.id, quarter.id),
    Promise.resolve(calcQuarterProgress(quarter)),
    getWeeklySummary(user.id, wStart, wEnd),
    calcCurrentStreak(user.id),
  ]);

  const displayName =
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    "there";
  const firstName = displayName.split(" ")[0];

  const streakColor =
    streak >= 14 ? "text-red-500" : streak >= 3 ? "text-orange-500" : undefined;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-3 font-mono text-[14px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {quarter.label} · Day {progress.daysElapsed} of {progress.totalDays}
      </div>
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Good morning, {firstName}
        </h1>
        {quests.length > 0 && (
          <Link href={ROUTES.questNew} className={NEW_QUEST_BUTTON_CLASS}>
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            New quest
          </Link>
        )}
      </div>
      <p className="mt-3 text-[17px] text-muted-foreground">
        {quests.length === 0
          ? "Add your first quest to start tracking the quarter."
          : `${quests.length} active quest${quests.length === 1 ? "" : "s"} this quarter.`}
      </p>

      {/* Quarter-end reflection prompt */}
      <QuarterEndBanner
        quarterId={quarter.id}
        quarterLabel={quarter.label}
        daysRemaining={progress.daysRemaining}
        hasReflection={!!quarter.reflection}
      />

      {/* Scorecard tiles + quarter ring */}
      <div className="mt-8 grid grid-cols-[1fr_1fr_1fr_1fr_auto] items-stretch gap-3">
        <ScorecardTile
          label="Hours this week"
          value={formatHours(weeklySummary.hoursThisWeek)}
          subtext="across all quests"
          Icon={Clock}
          iconColor="text-indigo-500"
        />
        <ScorecardTile
          label="Lessons this week"
          value={weeklySummary.lessonsThisWeek}
          subtext="completed"
          Icon={BookOpen}
          iconColor="text-emerald-500"
        />
        <ScorecardTile
          label="Current streak"
          value={streak === 0 ? "–" : `${streak}d`}
          subtext={streak === 0 ? "Log today to start" : streak === 1 ? "1 day" : `${streak} days in a row`}
          Icon={Flame}
          iconColor={streakColor ?? "text-muted-foreground"}
          valueColor={streakColor}
        />
        <ScorecardTile
          label="Days remaining"
          value={progress.daysRemaining}
          subtext={`of ${progress.totalDays} in ${quarter.label}`}
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

      {/* Quest table */}
      <div className="mt-8">
        {quests.length === 0 ? (
          <EmptyState />
        ) : (
          <QuestTable
            quests={quests}
            quarterElapsed={progress.fraction}
            quarterStartDate={quarter.startDate}
          />
        )}
      </div>
    </div>
  );
}

function QuestTable({
  quests,
  quarterElapsed,
  quarterStartDate,
}: {
  quests: Awaited<ReturnType<typeof listQuestsForQuarter>>;
  quarterElapsed: number;
  quarterStartDate: string;
}) {
  const now = new Date();
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="grid grid-cols-[minmax(0,2.4fr)_minmax(0,3fr)_minmax(0,1.2fr)_minmax(0,1.1fr)_auto] items-center gap-6 border-b border-border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <div>Quest</div>
        <div>Progress</div>
        <div>Logged</div>
        <div>Last worked</div>
        <div className="justify-self-end">Pace</div>
      </div>
      <div className="divide-y divide-border">
        {quests.map((q) => {
          const elapsed = q.deadline
            ? Math.min(1, elapsedFraction(quarterStartDate, q.deadline, now))
            : quarterElapsed;
          return <QuestRow key={q.id} quest={q} elapsed={elapsed} />;
        })}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-muted text-xl text-muted-foreground">
        ◇
      </div>
      <h2 className="text-xl font-medium">No quests yet</h2>
      <p className="mt-2 text-[15px] text-muted-foreground">
        Create your first quest — by lessons or by hours — to start tracking this quarter.
      </p>
      <div className="mt-6">
        <Link href={ROUTES.questNew} className={NEW_QUEST_BUTTON_CLASS}>
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Create your first quest
        </Link>
      </div>
    </div>
  );
}
