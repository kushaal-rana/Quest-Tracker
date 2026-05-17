import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getQuarterById } from "@/features/quarters/queries";
import { ReflectionForm } from "@/features/quarters/components/reflection-form";
import { ROUTES } from "@/lib/constants";

export async function generateMetadata({ params }: { params: Promise<{ quarterId: string }> }) {
  const { quarterId } = await params;
  return { title: `Reflection · ${quarterId} · Quest Tracker` };
}

export default async function QuarterReviewPage({
  params,
}: {
  params: Promise<{ quarterId: string }>;
}) {
  const { quarterId } = await params;
  const user = await requireUser();
  const quarter = await getQuarterById(user.id, quarterId);

  if (!quarter) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      {/* Back link */}
      <Link
        href={ROUTES.quarter}
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        {quarter.label} · Quarter view
      </Link>

      <div className="mt-6 flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-500/10">
          <BookOpen className="h-5 w-5 text-indigo-500" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Quarterly Reflection</h1>
          <p className="mt-0.5 text-[14px] text-muted-foreground">{quarter.label}</p>
        </div>
      </div>

      <p className="mt-4 text-[14px] text-muted-foreground">
        A place to capture wins, misses, and carry-forwards. Takes 5 minutes.
        Your main reflection lives in Notion — use this as a quick companion note or paste a link.
      </p>

      <div className="mt-6">
        <ReflectionForm
          quarterId={quarter.id}
          quarterLabel={quarter.label}
          savedReflection={quarter.reflection ?? null}
        />
      </div>
    </div>
  );
}
