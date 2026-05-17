import { ScrollText } from "lucide-react";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getAllSessionsPaginated, getAllActiveQuests } from "@/features/insights/queries";
import { ROUTES } from "@/lib/constants";
import { formatHours } from "@/lib/format/hours";
import { formatRelativeTime } from "@/lib/format/date";

export const metadata = { title: "Logs · Quest Tracker" };

const PAGE_SIZE = 25;

type SearchParams = Promise<{ page?: string; questId?: string; search?: string }>;

export default async function LogsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const user = await requireUser();

  const page = Math.max(1, Number(params.page ?? 1));
  const questId = params.questId || undefined;
  const search = params.search || undefined;

  const [{ sessions, total }, allQuests] = await Promise.all([
    getAllSessionsPaginated(user.id, { page, limit: PAGE_SIZE, questId, search }),
    getAllActiveQuests(user.id),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="flex items-center gap-3 text-4xl font-semibold tracking-tight">
        <ScrollText className="h-9 w-9 text-violet-400" strokeWidth={1.5} />
        Logs
      </h1>
      <p className="mt-2 text-[15px] text-muted-foreground">
        {total.toLocaleString()} session{total === 1 ? "" : "s"} total
        {questId || search ? " (filtered)" : ""}
      </p>

      {/* Filter bar */}
      <form method="get" className="mt-6 flex flex-wrap gap-3">
        <select
          name="questId"
          defaultValue={questId ?? ""}
          className="rounded-md border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
        >
          <option value="">All quests</option>
          {allQuests.map((q) => (
            <option key={q.id} value={q.id}>
              {q.name}
            </option>
          ))}
        </select>
        <input
          name="search"
          type="text"
          defaultValue={search ?? ""}
          placeholder="Search notes…"
          className="min-w-[220px] rounded-md border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
        <button
          type="submit"
          className="rounded-md border border-border bg-background px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
        >
          Filter
        </button>
        {(questId || search) && (
          <Link
            href={ROUTES.logs}
            className="rounded-md px-4 py-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="mt-4 rounded-xl border border-border bg-card">
        {sessions.length === 0 ? (
          <div className="p-10 text-center text-[14px] text-muted-foreground">
            {questId || search ? "No sessions match this filter." : "No sessions logged yet."}
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="grid grid-cols-[1fr_auto_auto_minmax(0,2fr)_auto] gap-4 border-b border-border px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <div>Quest</div>
              <div>Hours</div>
              <div className="hidden sm:block">Lesson</div>
              <div>Note</div>
              <div className="text-right">When</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="grid grid-cols-[1fr_auto_auto_minmax(0,2fr)_auto] items-start gap-4 px-5 py-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: s.questColor }}
                    />
                    <span className="truncate text-[13px] font-medium text-foreground">
                      {s.questName}
                    </span>
                  </div>
                  <div className="font-mono text-[13px] text-foreground">
                    {formatHours(s.hours)}
                  </div>
                  <div className="hidden sm:block">
                    {s.lessonTitle ? (
                      <span className="text-[12px] text-emerald-600">✓ {s.lessonTitle}</span>
                    ) : (
                      <span className="text-[12px] text-muted-foreground">—</span>
                    )}
                  </div>
                  <div className="min-w-0 text-[13px] text-foreground/80">
                    {s.note ? (
                      <span className="line-clamp-2">{s.note}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                  <div className="text-right text-[12px] text-muted-foreground">
                    {formatRelativeTime(s.loggedAt)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-[13px]">
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildPageUrl({ page: page - 1, questId, search })}
                className="rounded-md border border-border bg-background px-3 py-1.5 font-medium text-foreground transition-colors hover:bg-muted"
              >
                ← Prev
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildPageUrl({ page: page + 1, questId, search })}
                className="rounded-md border border-border bg-background px-3 py-1.5 font-medium text-foreground transition-colors hover:bg-muted"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function buildPageUrl({
  page,
  questId,
  search,
}: {
  page: number;
  questId?: string;
  search?: string;
}): string {
  const p = new URLSearchParams();
  if (page > 1) p.set("page", String(page));
  if (questId) p.set("questId", questId);
  if (search) p.set("search", search);
  const qs = p.toString();
  return `${ROUTES.logs}${qs ? `?${qs}` : ""}`;
}
