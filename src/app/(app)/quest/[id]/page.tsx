import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { ROUTES, formatMeasure } from "@/lib/constants";
import { getQuestById } from "@/features/quests/queries";
import { CategoryTag } from "@/features/quests/components/category-tag";
import { ArchiveQuestButton } from "@/features/quests/components/archive-quest-button";

/**
 * Quest detail page — Phase 2 version.
 *
 * Currently: read-only summary + Edit / Archive controls.
 * Phase 3 will add: lessons checklist, session log, sparkline.
 */
type Params = Promise<{ id: string }>;

export default async function QuestDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const user = await requireUser();
  const quest = await getQuestById(user.id, id);
  if (!quest) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={ROUTES.dashboard}
        className="inline-flex items-center gap-1.5 text-[14px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Back to dashboard
      </Link>

      {/* Title row */}
      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
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
              Target: <span className="font-medium text-foreground">{formatMeasure(quest.targetCount, quest.measure)}</span>
            </span>
          </div>
        </div>

        {/* Actions */}
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

      {/* Phase 3 placeholder */}
      <div className="mt-10 rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
        <h2 className="text-[20px] font-medium">Lessons + sessions land in Phase 3</h2>
        <p className="mt-2 text-[15px] text-muted-foreground">
          Lessons checklist · session log · sparkline · ⌘K palette · confetti on completion.
        </p>
      </div>
    </div>
  );
}
