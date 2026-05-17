"use client";

import { useActionState, useEffect, useRef } from "react";
import { Check, Save } from "lucide-react";
import { toast } from "sonner";
import { saveReflectionAction } from "../actions";
import { INITIAL_FORM_STATE } from "@/lib/forms";

const REFLECTION_PLACEHOLDER = `What went well this quarter? What are you proud of?


What didn't happen? What got in the way?


What patterns do you want to carry into next quarter?


Key insights or mindset shifts from this quarter.


(You can also paste a link to your Notion reflection here.)`;

interface ReflectionFormProps {
  quarterId: string;
  quarterLabel: string;
  savedReflection: string | null;
}

export function ReflectionForm({
  quarterId,
  quarterLabel,
  savedReflection,
}: ReflectionFormProps) {
  const [state, action, pending] = useActionState(saveReflectionAction, INITIAL_FORM_STATE);
  const toastFiredRef = useRef(false);

  useEffect(() => {
    if (state.ok && state.message && !toastFiredRef.current) {
      toastFiredRef.current = true;
      toast.success(state.message);
    }
    if (!state.ok) {
      toastFiredRef.current = false;
    }
  }, [state]);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="quarterId" value={quarterId} />

      <div>
        <label
          htmlFor="reflection"
          className="mb-2 block text-[13px] font-semibold uppercase tracking-wider text-muted-foreground"
        >
          {quarterLabel} · Reflection
        </label>
        <textarea
          id="reflection"
          name="reflection"
          defaultValue={savedReflection ?? ""}
          placeholder={REFLECTION_PLACEHOLDER}
          rows={18}
          className="w-full resize-y rounded-xl border border-border bg-card px-5 py-4 font-mono text-[14px] leading-relaxed text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        />
      </div>

      <div className="flex items-center justify-between">
        {state.ok && state.message ? (
          <span className="flex items-center gap-1.5 text-[13px] text-emerald-600">
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
            Saved
          </span>
        ) : (
          <span className="text-[13px] text-muted-foreground">
            {savedReflection ? "Your reflection is saved — edit anytime." : "Your draft saves instantly."}
          </span>
        )}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2.5 text-[13px] font-medium text-background transition-colors hover:bg-foreground/85 disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" strokeWidth={2} />
          {pending ? "Saving…" : "Save reflection"}
        </button>
      </div>
    </form>
  );
}
