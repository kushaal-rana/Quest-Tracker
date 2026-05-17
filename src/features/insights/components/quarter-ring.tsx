"use client";

type Props = {
  /** 0..1 fraction of quarter elapsed */
  fraction: number;
  daysElapsed: number;
  totalDays: number;
  daysRemaining: number;
};

const RADIUS = 38;
const STROKE = 7;
const SIZE = 100;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Hand-rolled SVG circular ring showing quarter progress.
 * Indigo track, grey background ring.
 * Center: percentage. Below: "Day X / Y".
 */
export function QuarterRing({ fraction, daysElapsed, totalDays, daysRemaining }: Props) {
  const dashOffset = CIRCUMFERENCE * (1 - Math.min(fraction, 1));
  const pct = Math.round(fraction * 100);

  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card px-5 py-4">
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        aria-label={`Quarter ${pct}% complete`}
      >
        {/* Background track */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE}
          className="text-muted/60"
        />
        {/* Progress arc */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="#6366F1"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
        {/* Center percentage */}
        <text
          x={SIZE / 2}
          y={SIZE / 2 - 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="16"
          fontWeight="600"
          fontFamily="var(--font-mono)"
          fill="currentColor"
          className="text-foreground"
        >
          {pct}%
        </text>
        {/* Sub label */}
        <text
          x={SIZE / 2}
          y={SIZE / 2 + 14}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="9"
          fill="currentColor"
          className="text-muted-foreground"
          style={{ opacity: 0.7 }}
        >
          {daysRemaining}d left
        </text>
      </svg>

      <div className="text-center">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Quarter
        </div>
        <div className="font-mono text-[11px] text-muted-foreground">
          Day {daysElapsed} / {totalDays}
        </div>
      </div>
    </div>
  );
}
