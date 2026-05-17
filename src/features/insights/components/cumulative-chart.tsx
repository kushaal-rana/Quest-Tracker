"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CumulativeQuestSeries } from "@/features/insights/queries";

type Props = {
  series: CumulativeQuestSeries[];
  quarterStart: string; // "YYYY-MM-DD"
  quarterEnd: string; // "YYYY-MM-DD"
};

/**
 * Multi-line chart showing cumulative quest progress over the quarter.
 * Each line is a quest; Y-axis is 0–100%.
 * Points only appear on days with activity; lines connect between them.
 */
export function CumulativeChart({ series, quarterStart, quarterEnd }: Props) {
  if (series.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border text-[13px] text-muted-foreground">
        No sessions logged yet this quarter
      </div>
    );
  }

  // Build unified date array from all series points
  const dateSet = new Set<string>();
  for (const s of series) {
    for (const p of s.points) dateSet.add(p.date);
  }
  // Add quarter start + today so lines extend from the beginning
  dateSet.add(quarterStart);
  const today = new Date().toISOString().slice(0, 10);
  if (today <= quarterEnd) dateSet.add(today);

  const sortedDates = [...dateSet].sort();

  // For each date, carry forward cumulative fraction per quest
  const questProgress = new Map<string, number>(series.map((s) => [s.questId, 0]));
  const questPointMap = new Map<string, Map<string, number>>();
  for (const s of series) {
    const m = new Map<string, number>(s.points.map((p) => [p.date, p.fraction]));
    questPointMap.set(s.questId, m);
  }

  const chartData = sortedDates.map((date) => {
    const entry: Record<string, string | number> = { date: formatDate(date) };
    for (const s of series) {
      const pointMap = questPointMap.get(s.questId)!;
      if (pointMap.has(date)) {
        questProgress.set(s.questId, pointMap.get(date)!);
      }
      entry[s.questId] = Math.round((questProgress.get(s.questId) ?? 0) * 100);
    }
    return entry;
  });

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          width={38}
        />
        <Tooltip
          formatter={(value, name) => {
            const label = series.find((s) => s.questId === name)?.name ?? String(name);
            return [`${value}%`, label];
          }}
          contentStyle={{
            background: "white",
            border: "1px solid #e5e5e5",
            borderRadius: 8,
            fontSize: 12,
            padding: "6px 10px",
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 11 }}
          formatter={(value) => series.find((s) => s.questId === value)?.name ?? value}
        />
        {series.map((s) => (
          <Line
            key={s.questId}
            type="monotone"
            dataKey={s.questId}
            stroke={s.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            isAnimationActive={true}
            animationDuration={600}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
