import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";
import { getOrCreateCurrentQuarter } from "@/features/quarters/queries";
import { calcQuarterProgress } from "@/features/quarters/lib";
import { listQuestsForQuarter } from "@/features/quests/queries";
import { QuestRow } from "@/features/quests/components/quest-row";

/** Shared button class used in two places; kept inline since it's page-specific. */
const NEW_QUEST_BUTTON_CLASS =
  "inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-[14px] font-medium text-background shadow-sm transition-colors hover:bg-foreground/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/**
 * Dashboard — the heart of the app.
 *
 * Server component: fetches user, current quarter, and all quests in one
 * server-side render. No loading spinners; the HTML arrives populated.
 */
export default async function DashboardPage() {
  const user = await requireUser();
  const quarter = await getOrCreateCurrentQuarter(user.id);
  const quests = await listQuestsForQuarter(user.id, quarter.id);
  const progress = calcQuarterProgress(quarter);

  const displayName =
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    "there";
  const firstName = displayName.split(" ")[0];

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

      <div className="mt-10">
        {quests.length === 0 ? <EmptyState /> : <QuestTable quests={quests} elapsed={progress.fraction} />}
      </div>
    </div>
  );
}

// ─── Quest table ─────────────────────────────────────────────────────────────

function QuestTable({
  quests,
  elapsed,
}: {
  quests: Awaited<ReturnType<typeof listQuestsForQuarter>>;
  elapsed: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Column headers */}
      <div className="grid grid-cols-[minmax(0,2.4fr)_minmax(0,3fr)_minmax(0,1.6fr)_auto] items-center gap-6 border-b border-border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <div>Quest</div>
        <div>Progress</div>
        <div>Logged</div>
        <div className="justify-self-end">Pace</div>
      </div>
      {/* Rows */}
      <div className="divide-y divide-border">
        {quests.map((q) => (
          <QuestRow key={q.id} quest={q} quarterElapsed={elapsed} />
        ))}
      </div>
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

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
