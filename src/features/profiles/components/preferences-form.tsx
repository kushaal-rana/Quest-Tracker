"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Check, Globe, User } from "lucide-react";
import { toast } from "sonner";
import { upsertProfileAction } from "../actions";
import { INITIAL_FORM_STATE } from "../schemas";

// Curated IANA timezone list grouped by region.
// Covers ~95% of users without the cognitive load of 600 raw zone names.
const TIMEZONE_GROUPS: { label: string; zones: { value: string; label: string }[] }[] = [
  {
    label: "Americas",
    zones: [
      { value: "America/New_York", label: "Eastern Time (New York)" },
      { value: "America/Chicago", label: "Central Time (Chicago)" },
      { value: "America/Denver", label: "Mountain Time (Denver)" },
      { value: "America/Los_Angeles", label: "Pacific Time (Los Angeles)" },
      { value: "America/Anchorage", label: "Alaska (Anchorage)" },
      { value: "Pacific/Honolulu", label: "Hawaii (Honolulu)" },
      { value: "America/Toronto", label: "Eastern Time (Toronto)" },
      { value: "America/Vancouver", label: "Pacific Time (Vancouver)" },
      { value: "America/Sao_Paulo", label: "Brasília (São Paulo)" },
      { value: "America/Mexico_City", label: "Central Time (Mexico City)" },
    ],
  },
  {
    label: "Europe",
    zones: [
      { value: "Europe/London", label: "London (GMT/BST)" },
      { value: "Europe/Paris", label: "Paris (CET/CEST)" },
      { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
      { value: "Europe/Rome", label: "Rome (CET/CEST)" },
      { value: "Europe/Madrid", label: "Madrid (CET/CEST)" },
      { value: "Europe/Amsterdam", label: "Amsterdam (CET/CEST)" },
      { value: "Europe/Zurich", label: "Zürich (CET/CEST)" },
      { value: "Europe/Stockholm", label: "Stockholm (CET/CEST)" },
      { value: "Europe/Moscow", label: "Moscow (MSK)" },
      { value: "Europe/Istanbul", label: "Istanbul (TRT)" },
    ],
  },
  {
    label: "Asia & Pacific",
    zones: [
      { value: "Asia/Dubai", label: "Dubai (GST)" },
      { value: "Asia/Karachi", label: "Karachi (PKT)" },
      { value: "Asia/Kolkata", label: "India (IST)" },
      { value: "Asia/Dhaka", label: "Dhaka (BST)" },
      { value: "Asia/Bangkok", label: "Bangkok (ICT)" },
      { value: "Asia/Singapore", label: "Singapore (SGT)" },
      { value: "Asia/Shanghai", label: "China (CST)" },
      { value: "Asia/Tokyo", label: "Tokyo (JST)" },
      { value: "Asia/Seoul", label: "Seoul (KST)" },
      { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
      { value: "Pacific/Auckland", label: "Auckland (NZST/NZDT)" },
    ],
  },
  {
    label: "UTC",
    zones: [{ value: "UTC", label: "UTC (Coordinated Universal Time)" }],
  },
];

const ALL_ZONES = new Set(TIMEZONE_GROUPS.flatMap((g) => g.zones.map((z) => z.value)));

interface PreferencesFormProps {
  savedTimezone: string | null;
  savedDisplayName: string | null;
  googleDisplayName: string;
}

export function PreferencesForm({
  savedTimezone,
  savedDisplayName,
  googleDisplayName,
}: PreferencesFormProps) {
  const [state, action, pending] = useActionState(upsertProfileAction, INITIAL_FORM_STATE);
  const [timezone, setTimezone] = useState(savedTimezone ?? "");
  const [detected, setDetected] = useState<string | null>(null);
  const toastFiredRef = useRef(false);

  // Auto-detect browser timezone on mount if no saved preference
  useEffect(() => {
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setDetected(browserTz);
    if (!savedTimezone) {
      setTimezone(browserTz);
    }
  }, [savedTimezone]);

  // Show toast on save
  useEffect(() => {
    if (state.ok && state.message && !toastFiredRef.current) {
      toastFiredRef.current = true;
      toast.success(state.message);
    }
    if (!state.ok) {
      toastFiredRef.current = false;
    }
  }, [state]);

  // If the browser-detected zone isn't in our curated list, add it as the first option
  const browserZoneInList = !detected || ALL_ZONES.has(detected);
  const detectedLabel = detected
    ? `${detected.replace(/_/g, " ")} (your browser)`
    : null;

  return (
    <form action={action} className="divide-y divide-border">
      {/* Timezone row */}
      <div className="px-5 py-4">
        <div className="flex items-start gap-3">
          <Globe className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
          <div className="flex-1">
            <label htmlFor="timezone" className="block text-[14px] font-medium text-foreground">
              Timezone
            </label>
            <p className="mb-2 mt-0.5 text-[12px] text-muted-foreground">
              Used to display dates and streak counts correctly.
              {detected && !savedTimezone && (
                <span className="ml-1 text-indigo-500">Auto-detected from your browser.</span>
              )}
            </p>
            <select
              id="timezone"
              name="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            >
              {/* Browser-detected zone if not in curated list */}
              {!browserZoneInList && detected && (
                <optgroup label="Detected">
                  <option value={detected}>{detectedLabel}</option>
                </optgroup>
              )}
              {TIMEZONE_GROUPS.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.zones.map((zone) => (
                    <option key={zone.value} value={zone.value}>
                      {zone.label}
                      {zone.value === detected && !savedTimezone ? " ✓ detected" : ""}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {state.fieldErrors?.timezone && (
              <p className="mt-1 text-[12px] text-destructive">{state.fieldErrors.timezone[0]}</p>
            )}
          </div>
        </div>
      </div>

      {/* Display name row */}
      <div className="px-5 py-4">
        <div className="flex items-start gap-3">
          <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
          <div className="flex-1">
            <label
              htmlFor="displayNameOverride"
              className="block text-[14px] font-medium text-foreground"
            >
              Display name
            </label>
            <p className="mb-2 mt-0.5 text-[12px] text-muted-foreground">
              Overrides your Google name on the dashboard greeting. Leave blank to use{" "}
              <span className="font-medium text-foreground">{googleDisplayName}</span>.
            </p>
            <input
              id="displayNameOverride"
              name="displayNameOverride"
              type="text"
              defaultValue={savedDisplayName ?? ""}
              maxLength={50}
              placeholder={googleDisplayName}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
            {state.fieldErrors?.displayNameOverride && (
              <p className="mt-1 text-[12px] text-destructive">
                {state.fieldErrors.displayNameOverride[0]}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center justify-between px-5 py-3.5">
        {state.ok && state.message ? (
          <span className="flex items-center gap-1.5 text-[13px] text-emerald-600">
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
            Saved
          </span>
        ) : (
          <span />
        )}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-[13px] font-medium text-background transition-colors hover:bg-foreground/85 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save preferences"}
        </button>
      </div>
    </form>
  );
}
