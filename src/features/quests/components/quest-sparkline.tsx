"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatHours } from "@/lib/format/hours";

type Props = {
  /** Oldest-first array; one entry per day. */
  data: { date: string; hours: number }[];
  /** Hex color (matches the quest's category color). */
  color: string;
  /** Height in px (default 56) */
  height?: number;
};

/**
 * Sparkline of session activity over the last N days (default: 14).
 *
 * Recharts <AreaChart> with no axes — pure visual signal.
 * Tooltip on hover shows the exact day + hours.
 */
export function QuestSparkline({ data, color, height = 56 }: Props) {
  const totalHours = data.reduce((acc, d) => acc + d.hours, 0);
  const activeDays = data.filter((d) => d.hours > 0).length;

  if (totalHours === 0) {
    return (
      <div className="flex h-14 items-center justify-center rounded-md border border-dashed border-border bg-muted/20 text-[12px] text-muted-foreground">
        No activity in the last {data.length} days
      </div>
    );
  }

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-[12px] text-muted-foreground">
        <span>
          Last {data.length} days · <span className="font-medium text-foreground">{formatHours(totalHours)}</span>
        </span>
        <span>
          Active <span className="font-medium text-foreground">{activeDays}</span> /{" "}
          {data.length} days
        </span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`sparkfill-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Tooltip
            cursor={{ stroke: color, strokeOpacity: 0.3, strokeWidth: 1 }}
            contentStyle={{
              background: "white",
              border: "1px solid #e5e5e5",
              borderRadius: 8,
              fontSize: 12,
              padding: "6px 10px",
            }}
            formatter={(value) => [formatHours(Number(value)), "Logged"]}
            labelFormatter={(label) => formatTooltipDate(String(label))}
          />
          <Area
            type="monotone"
            dataKey="hours"
            stroke={color}
            strokeWidth={1.75}
            fill={`url(#sparkfill-${color.replace("#", "")})`}
            isAnimationActive={true}
            animationDuration={400}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatTooltipDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
