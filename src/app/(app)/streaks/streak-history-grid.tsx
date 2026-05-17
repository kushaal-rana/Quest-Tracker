import { cn } from "@/lib/utils";
import type { StreakDay } from "@/features/streaks/queries";

type Props = {
  days: StreakDay[]; // 91 days, oldest first
};

/**
 * GitHub-style streak grid for the last 91 days.
 * 13 columns (weeks) × 7 rows (Mon–Sun).
 * Each cell: filled if there was a session that day, empty otherwise.
 */
export function StreakHistoryGrid({ days }: Props) {
  // Pad so grid starts on a Monday
  // days[0] is the oldest. Find its day-of-week.
  const firstDate = new Date(days[0].date + "T00:00:00Z");
  const firstDow = (firstDate.getUTCDay() + 6) % 7; // Mon=0

  // Build flat array: cells[col][row] where col=week, row=weekday
  // Pad the start with empty cells
  const totalCells = firstDow + days.length;
  const cols = Math.ceil(totalCells / 7);

  const grid: Array<Array<StreakDay | null>> = Array.from({ length: cols }, () =>
    Array(7).fill(null),
  );

  let idx = 0;
  for (let row = firstDow; row < totalCells; row++) {
    const col = Math.floor(row / 7);
    const r = row % 7;
    grid[col][r] = days[idx++] ?? null;
  }

  const monthLabels = buildMonthLabels(days, firstDow, cols);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-0">
        {/* Month labels */}
        <div
          className="mb-1 grid text-[10px] text-muted-foreground"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {monthLabels.map((label, i) => (
            <div key={i} className="truncate">
              {label}
            </div>
          ))}
        </div>

        {/* Grid: 7 rows of weekday dots */}
        <div className="flex flex-col gap-0.5">
          {Array.from({ length: 7 }, (_, row) => (
            <div
              key={row}
              className="grid gap-0.5"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            >
              {grid.map((col, colIdx) => {
                const cell = col[row];
                return (
                  <div
                    key={colIdx}
                    title={cell ? `${cell.date}${cell.hasSession ? " · logged" : ""}` : ""}
                    className={cn(
                      "aspect-square rounded-sm",
                      cell === null
                        ? "invisible"
                        : cell.hasSession
                          ? "bg-emerald-500"
                          : "bg-muted/60",
                    )}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Weekday labels */}
        <div className="mt-1 flex flex-col gap-0.5 text-[9px] text-muted-foreground sr-only">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <div key={i}>{d}</div>
          ))}
        </div>

        <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
          <div className="h-3 w-3 rounded-sm bg-muted/60" />
          <span>No session</span>
          <div className="ml-3 h-3 w-3 rounded-sm bg-emerald-500" />
          <span>Logged</span>
        </div>
      </div>
    </div>
  );
}

function buildMonthLabels(
  days: StreakDay[],
  firstDow: number,
  cols: number,
): string[] {
  const labels: string[] = Array(cols).fill("");
  let dayIdx = 0;

  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < 7; row++) {
      const cellIdx = col * 7 + row - firstDow;
      if (cellIdx < 0 || cellIdx >= days.length) continue;
      const day = days[cellIdx];
      if (!day) continue;
      dayIdx = cellIdx;

      const d = new Date(day.date + "T00:00:00Z");
      // Show month label at start of each new month
      if (d.getUTCDate() === 1 || (col === 0 && row === firstDow)) {
        if (labels[col] === "") {
          labels[col] = d.toLocaleDateString(undefined, { month: "short" });
        }
      }
    }
  }
  void dayIdx;
  return labels;
}
