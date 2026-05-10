import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName =
    (user?.user_metadata?.full_name as string) ||
    (user?.user_metadata?.name as string) ||
    "there";
  const firstName = displayName.split(" ")[0];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-3 font-mono text-[14px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Q2 2026 · Day 19 of 91
      </div>
      <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
        Good morning, {firstName}
      </h1>
      <p className="mt-3 text-[17px] text-muted-foreground">
        You&apos;re signed in. Phase 1 shell is live — quests, logging, and charts land in Phase 2.
      </p>

      <div className="mt-12 rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-muted text-xl text-muted-foreground">
          ◇
        </div>
        <h2 className="text-xl font-medium">No quests yet</h2>
        <p className="mt-2 text-[15px] text-muted-foreground">
          Phase 2 will add quest creation. For now, this confirms auth + shell are working.
        </p>
      </div>
    </div>
  );
}
