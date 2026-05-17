"use client";

import { useState, useTransition } from "react";
import { ChevronRight, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { unarchiveQuestAction } from "../actions";
import type { QuestWithProgress } from "../queries";

function UnarchiveButton({ questId, questName }: { questId: string; questName: string }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleUnarchive() {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("id", questId);
      const result = await unarchiveQuestAction({ ok: false }, formData);
      if (result.ok) toast.success(`"${questName}" restored to active quests.`);
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
      >
        <RotateCcw className="h-3 w-3" strokeWidth={2} />
        Restore
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1.5">
      <span className="text-[12px] text-indigo-700">Restore?</span>
      <button
        type="button"
        onClick={handleUnarchive}
        disabled={isPending}
        className="rounded px-1.5 py-0.5 text-[12px] font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
      >
        {isPending ? "Restoring…" : "Yes"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={isPending}
        className="rounded px-1.5 py-0.5 text-[12px] text-muted-foreground hover:bg-muted"
      >
        Cancel
      </button>
    </div>
  );
}

interface ArchivedQuestsSectionProps {
  quests: QuestWithProgress[];
}

export function ArchivedQuestsSection({ quests }: ArchivedQuestsSectionProps) {
  const [open, setOpen] = useState(false);

  if (quests.length === 0) return null;

  return (
    <div className="mt-4 rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/30"
      >
        <ChevronRight
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
          strokeWidth={2}
        />
        <span className="text-[13px] font-medium text-muted-foreground">
          Archived quests
        </span>
        <span className="ml-1 rounded-full border border-border bg-muted/50 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
          {quests.length}
        </span>
      </button>

      {open && (
        <div className="border-t border-border divide-y divide-border">
          {quests.map((q) => {
            const pct = Math.round(Math.min(q.progress, 1) * 100);
            return (
              <div key={q.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full opacity-60"
                  style={{ backgroundColor: q.color }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[13px] font-medium text-muted-foreground">
                      {q.name}
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-muted-foreground/60">
                      {pct}%
                    </span>
                  </div>
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-muted-foreground/30"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <UnarchiveButton questId={q.id} questName={q.name} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
