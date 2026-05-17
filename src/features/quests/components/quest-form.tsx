"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { CATEGORY_OPTIONS, MEASURE_META, MEASURE_OPTIONS, ROUTES } from "@/lib/constants";
import type { Quest, QuestMeasure, QuestType } from "@/lib/db/schema";
import { formatDateOnly, quarterFor } from "@/lib/format/date";
import { createQuestAction, updateQuestAction } from "../actions";
import { INITIAL_FORM_STATE } from "../schemas";

/**
 * Quest form — handles BOTH create and edit modes.
 *
 *   <QuestForm />              → create mode (calls createQuestAction)
 *   <QuestForm quest={quest} /> → edit mode  (calls updateQuestAction)
 *
 * In edit mode:
 * - The `measure` field is locked (changing lessons↔hours would corrupt progress data)
 * - The lessons paste textarea is hidden (lessons are managed on the detail page in Phase 3)
 * - Cancel returns to the quest detail page; submit redirects there too on success
 */

type Props = {
  /** When provided, the form is in edit mode. */
  quest?: Quest;
};

export function QuestForm({ quest }: Props) {
  const isEdit = quest !== undefined;
  const action = isEdit ? updateQuestAction : createQuestAction;
  const [state, formAction, isPending] = useActionState(action, INITIAL_FORM_STATE);
  const [measure, setMeasure] = useState<QuestMeasure>(quest?.measure ?? "lessons");
  const today = formatDateOnly(new Date());
  const quarterEnd = quarterFor().endDate;

  const errs = state.fieldErrors ?? {};
  const cancelHref = isEdit ? ROUTES.questDetail(quest.id) : ROUTES.dashboard;

  return (
    <form action={formAction} className="space-y-8">
      {/* Hidden id for edit mode */}
      {isEdit && <input type="hidden" name="id" value={quest.id} />}

      {/* Name */}
      <Field
        label="Quest name"
        hint="What you'll see on the dashboard"
        error={errs.name?.[0]}
      >
        <input
          name="name"
          required
          maxLength={100}
          defaultValue={quest?.name}
          placeholder="e.g. Claude Code"
          className={INPUT_CLASS}
        />
      </Field>

      {/* Type + Category — side by side */}
      <div className="grid gap-8 sm:grid-cols-2">
        <Field label="Type" error={errs.type?.[0]}>
          <RadioGroup
            name="type"
            options={[
              { value: "main", label: "Main quest" },
              { value: "side", label: "Side quest" },
            ]}
            defaultValue={(quest?.type as QuestType) ?? "main"}
          />
        </Field>

        <Field label="Category" error={errs.category?.[0]}>
          <select
            name="category"
            defaultValue={quest?.category ?? "work"}
            className={INPUT_CLASS}
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} — {opt.description}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Measure + Target — side by side */}
      <div className="grid gap-8 sm:grid-cols-2">
        <Field
          label="Measure progress by"
          hint={isEdit ? "Locked — changing this would invalidate existing progress" : undefined}
          error={errs.measure?.[0]}
        >
          {isEdit ? (
            <ReadOnlyValue value={MEASURE_META[quest.measure].label} />
          ) : (
            <RadioGroup
              name="measure"
              options={MEASURE_OPTIONS.map((m) => ({ value: m.value, label: m.label }))}
              value={measure}
              onChange={(v) => setMeasure(v as QuestMeasure)}
            />
          )}
        </Field>

        <Field
          label="Target"
          hint={
            (isEdit ? quest.measure : measure) === "lessons"
              ? "Number of lessons to complete"
              : "Total hours to log"
          }
          error={errs.targetCount?.[0]}
        >
          <input
            name="targetCount"
            type="number"
            min={1}
            max={10000}
            required
            defaultValue={quest?.targetCount ?? (measure === "lessons" ? 12 : 40)}
            className={`${INPUT_CLASS} tabular-nums`}
          />
        </Field>
      </div>

      {/* Deadline — optional, both create and edit */}
      <Field
        label="Deadline (optional)"
        hint={`Finish this quest by a specific date within the quarter. Pace will calculate against this date instead of ${quarterEnd}.`}
        error={errs.deadline?.[0]}
      >
        <input
          name="deadline"
          type="date"
          defaultValue={quest?.deadline ?? ""}
          min={today}
          max={quarterEnd}
          className={INPUT_CLASS}
        />
      </Field>

      {/* Lessons paste — only on CREATE for measure=lessons */}
      {!isEdit && measure === "lessons" && (
        <Field
          label="Lesson titles (optional)"
          hint="Paste a list, one per line. You can add or edit them later."
          error={errs.lessons?.[0]}
        >
          <textarea
            name="lessons"
            rows={6}
            placeholder={`Lesson 1: Intro\nLesson 2: Hooks\n...`}
            className={`${INPUT_CLASS} resize-y font-mono text-[14px]`}
          />
        </Field>
      )}

      {/* Form-level error */}
      {state.message && !state.ok && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
          {state.message}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
        <Link
          href={cancelHref}
          className="rounded-md px-4 py-2.5 text-[14px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-md bg-foreground px-5 py-2.5 text-[14px] font-medium text-background shadow-sm transition-colors hover:bg-foreground/85 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (isEdit ? "Saving…" : "Creating…") : isEdit ? "Save changes" : "Create quest"}
        </button>
      </div>
    </form>
  );
}

// ─── Shared input style ──────────────────────────────────────────────────────

const INPUT_CLASS =
  "w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-[16px] outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20";

// ─── Sub-components ──────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[15px] font-semibold text-foreground">{label}</span>
      {hint && !error && (
        <span className="-mt-1 mb-2.5 block text-[13px] text-muted-foreground">{hint}</span>
      )}
      {error && (
        <span className="-mt-1 mb-2.5 block text-[13px] font-medium text-red-600">{error}</span>
      )}
      {children}
    </label>
  );
}

function ReadOnlyValue({ value }: { value: string }) {
  return (
    <div className="flex items-center rounded-md border border-border bg-muted/40 px-3.5 py-2.5 text-[16px] text-muted-foreground">
      {value}
      <span className="ml-auto text-[12px] font-medium uppercase tracking-wider">Locked</span>
    </div>
  );
}

function RadioGroup({
  name,
  options,
  defaultValue,
  value,
  onChange,
}: {
  name: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  defaultValue?: string;
  value?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {options.map((opt) => {
        const isControlled = value !== undefined;
        const checked = isControlled ? value === opt.value : undefined;
        return (
          <label
            key={opt.value}
            className="flex cursor-pointer items-center gap-2.5 rounded-md border border-border bg-background px-4 py-2.5 text-[15px] font-medium transition-colors hover:bg-muted/40 has-[:checked]:border-foreground has-[:checked]:bg-foreground/[0.05]"
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              defaultChecked={isControlled ? undefined : defaultValue === opt.value}
              checked={checked}
              onChange={isControlled ? (e) => onChange?.(e.target.value) : undefined}
              className="h-4 w-4 accent-foreground"
            />
            <span>{opt.label}</span>
          </label>
        );
      })}
    </div>
  );
}
