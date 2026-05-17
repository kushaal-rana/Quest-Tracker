import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { ROUTES, formatMeasure } from "@/lib/constants";
import { getQuestById } from "@/features/quests/queries";
import { CategoryTag } from "@/features/quests/components/category-tag";
import { QuestSparkline } from "@/features/quests/components/quest-sparkline";
import { ArchiveQuestButton } from "@/features/quests/components/archive-quest-button";
import { listLessonsForQuest, listOpenLessonsForQuest } from "@/features/lessons/queries";
import { LessonsList } from "@/features/lessons/components/lessons-list";
import { getQuestActivity, listSessionsForQuest } from "@/features/sessions/queries";
import { SessionLogForm } from "@/features/sessions/components/session-log-form";
import { SessionList } from "@/features/sessions/components/session-list";

/**
 * Quest detail page (Phase 3 — full version).
 *
 * Structure:
 *   1. Title row + Edit/Archive actions
 *   2. Sparkline (last 14 days)
 *   3. Session log form (always visible — primary CTA)
 *   4. Lessons checklist (only when measure='lessons')
 *   5. Recent sessions list
 */
type Params = Promise<{ id: string }>;

export default async function QuestDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const user = await requireUser();
  const quest = await getQuestById(user.id, id);
  if (!quest) notFound();

  const isLessonQuest = quest.measure === "lessons";

  // Fetch all the data the page needs in parallel
  const [activity, sessions, lessons, openLessons] = await Promise.all([
    getQuestActivity(user.id, quest.id, 14),
    listSessionsForQuest(user.id, quest.id, 25),
    isLessonQuest ? listLessonsForQuest(user.id, quest.id) : Promise.resolve([]),
    isLessonQuest ? listOpenLessonsForQuest(user.id, quest.id) : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link
        href={ROUTES.dashboard}
        className="inline-flex items-center gap-1.5 text-[14px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Back to dashboard
      </Link>

      {/* Title + actions */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <span
              className="h-3.5 w-3.5 shrink-0 rounded-full"
              style={{ backgroundColor: quest.color }}
              aria-hidden="true"
            />
            <h1 className="truncate text-4xl font-semibold tracking-tight md:text-[40px]">
              {quest.name}
            </h1>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <CategoryTag category={quest.category} size="md" />
            {quest.type === "main" && (
              <span className="inline-flex items-center rounded-md border border-border bg-muted/40 px-2 py-1 text-[12px] font-medium text-foreground/80">
                Main quest
              </span>
            )}
            <span className="text-[14px] text-muted-foreground">
              Target:{" "}
              <span className="font-medium text-foreground">
                {formatMeasure(quest.targetCount, quest.measure)}
              </span>
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`${ROUTES.questDetail(quest.id)}/edit`}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3.5 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
            Edit
          </Link>
          <ArchiveQuestButton questId={quest.id} questName={quest.name} />
        </div>
      </div>

      {/* Sparkline */}
      <div className="rounded-xl border border-border bg-card p-5">
        <QuestSparkline data={activity} color={quest.color} />
      </div>

      {/* Session log form */}
      <SessionLogForm
        questId={quest.id}
        measure={quest.measure}
        openLessons={openLessons.map((l) => ({ id: l.id, title: l.title }))}
      />

      {/* Lessons (only for measure=lessons) */}
      {isLessonQuest && <LessonsList questId={quest.id} lessons={lessons} />}

      {/* Recent sessions */}
      <SessionList sessions={sessions} />
    </div>
  );
}
