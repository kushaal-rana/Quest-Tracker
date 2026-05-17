import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import type { QuestWithProgress } from "../queries";
import { formatLastWorked } from "@/lib/format/date";
import { CategoryTag } from "./category-tag";
import { PaceTag } from "./pace-tag";
import { QuestProgressBar } from "./quest-progress-bar";

type Props = {
  quest: QuestWithProgress;
  /** 0..1 elapsed fraction — quarter-based, or deadline-based when a deadline is set */
  elapsed: number;
};

/**
 * One row in the dashboard quest table.
 *
 * Layout (left → right):
 *   [color dot] Name + Category tag · Progress bar · Count/target · Pace tag
 *
 * The whole row is a link to the quest detail page.
 */
export function QuestRow({ quest, elapsed }: Props) {
  const completed = quest.measure === "lessons" ? quest.lessonsCompleted : quest.hoursLogged;

  return (
    <Link
      href={ROUTES.questDetail(quest.id)}
      className="group grid grid-cols-[minmax(0,2.4fr)_minmax(0,3fr)_minmax(0,1.2fr)_minmax(0,1.1fr)_auto] items-center gap-6 rounded-lg border border-transparent px-4 py-4 text-foreground/90 transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground"
    >
      {/* Name + category */}
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: quest.color }}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <div className="truncate text-[16px] font-medium">{quest.name}</div>
          <div className="mt-1 flex items-center gap-2">
            <CategoryTag category={quest.category} />
            {quest.type === "main" && (
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Main
              </span>
            )}
            {quest.deadline && (
              <span className="text-[11px] text-muted-foreground">
                Due {formatDeadlineShort(quest.deadline)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <QuestProgressBar progress={quest.progress} showLabel />
      </div>

      {/* Count / target */}
      <div className="font-mono text-[13px] tabular-nums text-muted-foreground">
        {formatCount(completed)} / {quest.targetCount}{" "}
        <span className="text-foreground/40">{quest.measure}</span>
      </div>

      {/* Last worked */}
      <div className="font-mono text-[13px] tabular-nums text-muted-foreground">
        {formatLastWorked(quest.lastLoggedAt)}
      </div>

      {/* Pace */}
      <div className="justify-self-end">
        <PaceTag progress={quest.progress} elapsed={elapsed} />
      </div>
    </Link>
  );
}

function formatCount(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function formatDeadlineShort(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
