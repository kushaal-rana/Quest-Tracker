"use client";

import { useState, useTransition } from "react";
import { Archive } from "lucide-react";
import { archiveQuestAction } from "../actions";

type Props = {
  questId: string;
  questName: string;
};

/**
 * Archive button with two-step confirmation.
 *
 *   Click 1 → "Are you sure?" inline confirm
 *   Click 2 → calls archiveQuestAction, redirects to dashboard
 *   Click Cancel → resets to default state
 *
 * No native confirm() dialog — keeps the experience smooth and consistent.
 */
export function ArchiveQuestButton({ questId, questName }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleArchive() {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("id", questId);
      // archiveQuestAction redirects on success → this never resolves
      await archiveQuestAction({ ok: false }, formData);
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3.5 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700"
      >
        <Archive className="h-3.5 w-3.5" strokeWidth={2} />
        Archive
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-1.5">
      <span className="text-[13px] text-red-700">
        Archive &ldquo;{questName}&rdquo;?
      </span>
      <button
        type="button"
        onClick={handleArchive}
        disabled={isPending}
        className="rounded px-2 py-1 text-[13px] font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-60"
      >
        {isPending ? "Archiving…" : "Yes, archive"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={isPending}
        className="rounded px-2 py-1 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        Cancel
      </button>
    </div>
  );
}
