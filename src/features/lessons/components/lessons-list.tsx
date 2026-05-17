"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, X, Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { celebrate } from "@/lib/celebrate";
import type { Lesson } from "@/lib/db/schema";
import {
  createLessonAction,
  deleteLessonAction,
  toggleLessonAction,
  updateLessonTitleAction,
} from "../actions";

type Props = {
  questId: string;
  lessons: Lesson[];
};

/**
 * Lessons checklist for a quest.
 *
 * - Click checkbox → toggle complete (with confetti when newly checked)
 * - Hover row → edit + delete icons
 * - Inline "Add a lesson" form at bottom
 */
export function LessonsList({ questId, lessons }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[16px] font-semibold">Lessons</h2>
          <span className="font-mono text-[12px] tabular-nums text-muted-foreground">
            {countCompleted(lessons)} / {lessons.length} complete
          </span>
        </div>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          Your checklist of items to complete. Tick them off as you go — or link them to a session above.
        </p>
      </div>

      {lessons.length === 0 ? (
        <div className="border-b border-border px-4 py-6 text-center text-[14px] text-muted-foreground">
          No lessons yet — add your first below.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {lessons.map((lesson) => (
            <LessonRow key={lesson.id} lesson={lesson} />
          ))}
        </ul>
      )}

      <div className="border-t border-border bg-muted/20 px-3 py-2">
        <AddLessonForm questId={questId} />
      </div>
    </div>
  );
}

function countCompleted(items: Lesson[]): number {
  return items.filter((l) => l.completedAt !== null).length;
}

// ─── Lesson row ──────────────────────────────────────────────────────────────

function LessonRow({ lesson }: { lesson: Lesson }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  // Optimistic state — reflects the click immediately while server catches up
  const [optimisticChecked, setOptimisticChecked] = useState<boolean | null>(null);

  const isComplete =
    optimisticChecked !== null ? optimisticChecked : lesson.completedAt !== null;

  function handleToggle(e: React.MouseEvent<HTMLButtonElement>) {
    const wantToCheck = !isComplete;
    setOptimisticChecked(wantToCheck);

    // Capture click position for confetti origin (viewport fractions)
    const rect = e.currentTarget.getBoundingClientRect();
    const origin = {
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: (rect.top + rect.height / 2) / window.innerHeight,
    };

    startTransition(async () => {
      const fd = new FormData();
      fd.append("id", lesson.id);
      fd.append("currentlyComplete", isComplete ? "true" : "false");
      const result = await toggleLessonAction({ ok: false }, fd);

      if (!result.ok) {
        // Revert optimistic state
        setOptimisticChecked(null);
        toast.error(result.message ?? "Couldn't toggle lesson");
        return;
      }

      // Celebrate
      if (result.data?.becameComplete) {
        celebrate.lessonComplete(origin);
        if (result.data.crossedMilestone) {
          // Slight delay so the lesson burst doesn't drown out the milestone
          setTimeout(() => celebrate.questMilestone(result.data!.crossedMilestone!), 250);
          toast.success(`🎉 ${result.data.crossedMilestone}% complete!`, { duration: 4000 });
        }
      }

      // Reset optimistic so next render trusts server value
      setOptimisticChecked(null);
    });
  }

  function saveRename(formData: FormData) {
    startTransition(async () => {
      const result = await updateLessonTitleAction({ ok: false }, formData);
      if (result.ok) {
        toast.success("Lesson renamed");
        setEditing(false);
      } else {
        toast.error(result.message ?? "Couldn't rename");
      }
    });
  }

  function remove() {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("id", lesson.id);
      const result = await deleteLessonAction({ ok: false }, fd);
      if (result.ok) {
        toast.success("Lesson deleted");
      } else {
        toast.error(result.message ?? "Couldn't delete");
      }
    });
  }

  return (
    <li className="group flex items-center gap-3.5 px-5 py-3">
      {/* Checkbox */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 transition-all ${
          isComplete
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-border bg-background hover:border-foreground/40"
        } disabled:opacity-50`}
        aria-label={isComplete ? "Mark incomplete" : "Mark complete"}
        aria-pressed={isComplete}
      >
        {isComplete && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </button>

      {/* Title (or inline rename form) */}
      <div className="min-w-0 flex-1">
        {editing ? (
          <form action={saveRename} className="flex items-center gap-2">
            <input type="hidden" name="id" value={lesson.id} />
            <input
              name="title"
              defaultValue={lesson.title}
              autoFocus
              maxLength={200}
              className="h-9 flex-1 rounded-md border border-border bg-background px-2.5 text-[16px] outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
            <button
              type="submit"
              disabled={isPending}
              className="grid h-9 w-9 place-items-center rounded-md text-emerald-600 transition-colors hover:bg-emerald-50 disabled:opacity-50"
              aria-label="Save"
            >
              <Check className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Cancel"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </form>
        ) : (
          <span
            className={`text-[16px] ${isComplete ? "text-muted-foreground line-through" : "text-foreground/90"}`}
          >
            {lesson.title}
          </span>
        )}
      </div>

      {/* Hover actions */}
      {!editing && (
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => setEditing(true)}
            disabled={isPending}
            className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Rename lesson"
            title="Rename"
          >
            <Pencil className="h-4 w-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={isPending}
            className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-700"
            aria-label="Delete lesson"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      )}
    </li>
  );
}

// ─── Add lesson form ─────────────────────────────────────────────────────────

function AddLessonForm({ questId }: { questId: string }) {
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState("");

  function add(formData: FormData) {
    const title = String(formData.get("title") ?? "").trim();
    if (!title) return;
    startTransition(async () => {
      const result = await createLessonAction({ ok: false }, formData);
      if (result.ok) {
        setValue("");
      } else {
        toast.error(result.message ?? "Couldn't add lesson");
      }
    });
  }

  const canSubmit = value.trim().length > 0 && !isPending;

  return (
    <form action={add} className="flex items-center gap-2 px-1">
      <input type="hidden" name="questId" value={questId} />
      <Plus className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={2} />
      <input
        name="title"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={200}
        placeholder='Add a lesson (e.g. "Lesson 1: Setup") and press Enter'
        className="h-9 flex-1 rounded-md bg-transparent px-1 text-[15px] outline-none placeholder:text-muted-foreground/70 focus:bg-background"
      />
      <button
        type="submit"
        disabled={!canSubmit}
        className="rounded-md bg-foreground px-3 py-1.5 text-[12px] font-medium text-background shadow-sm transition-all hover:bg-foreground/85 disabled:cursor-not-allowed disabled:opacity-30"
      >
        {isPending ? "Adding…" : "Add"}
      </button>
    </form>
  );
}
