"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { celebrate } from "@/lib/celebrate";
import { formatHours } from "@/lib/format/hours";
import type { Lesson, QuestMeasure } from "@/lib/db/schema";
import { createSessionAction } from "../actions";
import { INITIAL_SESSION_STATE } from "../schemas";

type Props = {
  questId: string;
  measure: QuestMeasure;
  /** Open lessons (for the optional "completed lesson X" select) — pass [] if measure=hours */
  openLessons: Pick<Lesson, "id" | "title">[];
};

/**
 * Inline form to log a session against a quest.
 *
 * Fields:
 *   - Hours (parsed via parseHours: "1h30m", "1.5", "0:30")
 *   - Note (optional)
 *   - "Completed lesson X" select (only when measure=lessons AND there are open lessons)
 *
 * On success:
 *   - Toast: "Logged 1h 30m to Stock Market · 🔥 3-day streak"
 *   - Confetti if quest crossed 25/50/75/100% milestone
 *   - Bigger confetti if streak hit a milestone (3/7/14/30/60/90)
 *   - Form resets so the user can log another session immediately
 */
export function SessionLogForm({ questId, measure, openLessons }: Props) {
  const [state, action, isPending] = useActionState(createSessionAction, INITIAL_SESSION_STATE);
  const formRef = useRef<HTMLFormElement>(null);
  const errs = state.fieldErrors ?? {};

  // Fire celebrations + toast when the action returns ok
  useEffect(() => {
    if (!state.ok || !state.data) return;

    const { streakDays, crossedMilestone, streakIsMilestone, hoursLogged, questName } = state.data;

    // Celebrations (in priority order — only the biggest fires loudly)
    if (streakIsMilestone && streakDays > 0) {
      celebrate.streakMilestone(streakDays);
    } else if (crossedMilestone) {
      celebrate.questMilestone(crossedMilestone);
    }

    // Toast
    const hoursLabel = hoursLogged !== undefined ? formatHours(hoursLogged) : "session";
    const streakSuffix =
      streakDays > 1 ? ` · 🔥 ${streakDays}-day streak` : streakDays === 1 ? " · 🔥 streak started!" : "";
    toast.success(`Logged ${hoursLabel} to ${questName ?? "quest"}${streakSuffix}`, {
      duration: streakIsMilestone || crossedMilestone ? 6000 : 3500,
    });

    // Reset form for the next entry
    formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="rounded-xl border border-border bg-card p-5">
      <input type="hidden" name="questId" value={questId} />

      <div className="mb-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[16px] font-semibold">Log a session</h2>
          <span className="text-[12px] text-muted-foreground">
            Formats: <code className="font-mono text-foreground/70">1h30m</code>{" "}
            <code className="font-mono text-foreground/70">90m</code>{" "}
            <code className="font-mono text-foreground/70">1.5</code>{" "}
            <code className="font-mono text-foreground/70">1:30</code>
          </span>
        </div>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          Record the time you just spent working{measure === "lessons" ? ". Optionally tick off a lesson you completed." : "."}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-[150px_1fr_auto]">
        {/* Hours */}
        <div>
          <input
            name="hours"
            required
            placeholder="e.g. 1h30m"
            className="h-10 w-full rounded-md border border-border bg-background px-3 font-mono text-[15px] tabular-nums outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20 aria-[invalid=true]:border-red-300"
            aria-invalid={errs.hours ? true : undefined}
          />
          {errs.hours && (
            <p className="mt-1 text-[12px] font-medium text-red-600">{errs.hours[0]}</p>
          )}
        </div>

        {/* Note */}
        <input
          name="note"
          maxLength={500}
          placeholder="Optional note — what did you work on?"
          className="h-10 w-full rounded-md border border-border bg-background px-3 text-[15px] outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
        />

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-foreground px-5 text-[14px] font-medium text-background shadow-sm transition-colors hover:bg-foreground/85 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          {isPending ? "Logging…" : "Log session"}
        </button>
      </div>

      {/* Optional: completed lesson */}
      {measure === "lessons" && openLessons.length > 0 && (
        <div className="mt-3">
          <label className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
            <span>Completed a lesson?</span>
            <select
              name="lessonId"
              defaultValue=""
              className="h-8 max-w-[400px] rounded-md border border-border bg-background px-2 text-[13px] text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
            >
              <option value="">— Pick a lesson (optional) —</option>
              {openLessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {state.message && !state.ok && (
        <p className="mt-3 text-[13px] font-medium text-red-600">{state.message}</p>
      )}
    </form>
  );
}
