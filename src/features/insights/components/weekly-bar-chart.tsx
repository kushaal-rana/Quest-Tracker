"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatHours } from "@/lib/format/hours";
import { cn } from "@/lib/utils";

export type BarChartDay = {
  day: string; // "Mon"
  date: string; // "YYYY-MM-DD"
  totalHours: number;
  byQuest: { questId: string; questName: string; questColor: string; hours: number }[];
};

type Props = {
  days: BarChartDay[];
};

/**
 * Weekly bar chart with stacked / flat toggle.
 *
 * Stacked: each bar is split by quest color.
 * Flat: single bar per day, total hours.
 */
export function WeeklyBarChart({ days }: Props) {
  const [stacked, setStacked] = useState(false);

  // Collect unique quests across all days
  const questMap = new Map<string, { name: string; color: string }>();
  for (const d of days) {
    for (const q of d.byQuest) {
      if (!questMap.has(q.questId)) {
        questMap.set(q.questId, { name: q.questName, color: q.questColor });
      }
    }
  }
  const quests = [...questMap.entries()].map(([id, meta]) => ({ id, ...meta }));

  // Shape data for Recharts
  const chartData = days.map((d) => {
    const entry: Record<string, number | string> = { day: d.day, totalHours: d.totalHours };
    for (const q of quests) {
      entry[q.id] = d.byQuest.find((bq) => bq.questId === q.id)?.hours ?? 0;
    }
    return entry;
  });

  const hasData = days.some((d) => d.totalHours > 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-foreground">Hours per day</span>
        <div className="flex items-center rounded-md border border-border bg-muted/30 p-0.5">
          <button
            onClick={() => setStacked(false)}
            className={cn(
              "rounded px-3 py-1 text-[12px] font-medium transition-colors",
              !stacked
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Flat
          </button>
          <button
            onClick={() => setStacked(true)}
            className={cn(
              "rounded px-3 py-1 text-[12px] font-medium transition-colors",
              stacked
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Stacked
          </button>
        </div>
      </div>

      {!hasData ? (
        <div className="flex h-36 items-center justify-center rounded-lg border border-dashed border-border text-[13px] text-muted-foreground">
          No sessions this week
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => (v === 0 ? "0" : formatHours(Number(v)))}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <Tooltip
              formatter={(value, name) => {
                const label = quests.find((q) => q.id === name)?.name ?? String(name);
                return [formatHours(Number(value)), label];
              }}
              contentStyle={{
                background: "white",
                border: "1px solid #e5e5e5",
                borderRadius: 8,
                fontSize: 12,
                padding: "6px 10px",
              }}
            />
            {stacked && quests.length > 1 && (
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                formatter={(value) => quests.find((q) => q.id === value)?.name ?? value}
              />
            )}

            {stacked ? (
              quests.map((q) => (
                <Bar key={q.id} dataKey={q.id} stackId="a" fill={q.color} radius={[0, 0, 0, 0]} />
              ))
            ) : (
              <Bar dataKey="totalHours" fill="#6366F1" radius={[4, 4, 0, 0]} />
            )}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
