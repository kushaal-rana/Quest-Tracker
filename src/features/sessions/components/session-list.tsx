"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, X, Check } from "lucide-react";
import { toast } from "sonner";
import { formatHours } from "@/lib/format/hours";
import { formatRelativeTime } from "@/lib/format/date";
import { deleteSessionAction, updateSessionNoteAction } from "../actions";
import type { SessionWithLesson } from "../queries";

type Props = {
  sessions: SessionWithLesson[];
};

/**
 * List of recent sessions for a quest.
 *
 * Each row shows: hours · relative time · note (or lesson title) · hover actions
 * Actions on hover (Phase 3 Q5 = C):
 *   - Edit note (inline textarea, save / cancel)
 *   - Delete session (no confirmation — these are atomic small entries; mistakes get re-logged)
 */
export function SessionList({ sessions }: Props) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
        <h2 className="text-[15px] font-semibold text-foreground">No sessions logged yet</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Use the form above to log the time you spent working on this quest.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-[16px] font-semibold">Recent sessions</h2>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          Every chunk of time you&apos;ve logged on this quest. Hover any row to edit the note or delete it.
        </p>
      </div>
      <ul className="divide-y divide-border">
        {sessions.map((s) => (
          <SessionRow key={s.id} session={s} />
        ))}
      </ul>
    </div>
  );
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function SessionRow({ session }: { session: SessionWithLesson }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  function save(formData: FormData) {
    startTransition(async () => {
      const result = await updateSessionNoteAction({ ok: false }, formData);
      if (result.ok) {
        toast.success("Note saved");
        setEditing(false);
      } else {
        toast.error(result.message ?? "Couldn't save note");
      }
    });
  }

  function remove() {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("id", session.id);
      const result = await deleteSessionAction({ ok: false }, fd);
      if (result.ok) {
        toast.success("Session deleted");
      } else {
        toast.error(result.message ?? "Couldn't delete session");
      }
    });
  }

  const hoursLabel = formatHours(Number(session.hours));
  const when = formatRelativeTime(session.loggedAt);

  return (
    <li className="group grid grid-cols-[120px_minmax(0,1fr)_auto] items-center gap-4 px-5 py-3.5">
      {/* Hours */}
      <div className="font-mono text-[16px] tabular-nums">
        <span className="font-semibold text-foreground">{hoursLabel}</span>
      </div>

      {/* Note / lesson title */}
      <div className="min-w-0">
        {editing ? (
          <form action={save} className="flex items-center gap-2">
            <input type="hidden" name="id" value={session.id} />
            <input
              name="note"
              defaultValue={session.note ?? ""}
              autoFocus
              maxLength={500}
              className="h-9 flex-1 rounded-md border border-border bg-background px-2.5 text-[15px] outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              placeholder="Add a note…"
            />
            <button
              type="submit"
              disabled={isPending}
              className="grid h-9 w-9 place-items-center rounded-md text-emerald-600 transition-colors hover:bg-emerald-50 disabled:opacity-50"
              aria-label="Save note"
            >
              <Check className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={isPending}
              className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Cancel"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-2">
            {session.lessonTitle && (
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[12px] font-medium text-emerald-700">
                ✓ {session.lessonTitle}
              </span>
            )}
            <span className="truncate text-[15px] text-foreground/85">
              {session.note || (session.lessonTitle ? "" : <em className="text-muted-foreground">No note</em>)}
            </span>
          </div>
        )}
      </div>

      {/* When + actions */}
      <div className="flex items-center gap-1">
        <span className="mr-2 text-[13px] text-muted-foreground">{when}</span>
        {!editing && (
          <>
            <button
              type="button"
              onClick={() => setEditing(true)}
              disabled={isPending}
              className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-muted hover:text-foreground group-hover:opacity-100"
              aria-label="Edit note"
              title="Edit note"
            >
              <Pencil className="h-4 w-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={isPending}
              className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-red-50 hover:text-red-700 group-hover:opacity-100"
              aria-label="Delete session"
              title="Delete session"
            >
              <Trash2 className="h-4 w-4" strokeWidth={2} />
            </button>
          </>
        )}
      </div>
    </li>
  );
}

