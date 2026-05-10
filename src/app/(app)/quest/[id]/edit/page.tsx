import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";
import { getQuestById } from "@/features/quests/queries";
import { QuestForm } from "@/features/quests/components/quest-form";

export const metadata = {
  title: "Edit quest · Quest Tracker",
};

type Params = Promise<{ id: string }>;

/**
 * Edit quest page — reuses QuestForm in edit mode.
 * Same form component as /quest/new; toggled by passing `quest` prop.
 */
export default async function EditQuestPage({ params }: { params: Params }) {
  const { id } = await params;
  const user = await requireUser();
  const quest = await getQuestById(user.id, id);
  if (!quest) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={ROUTES.questDetail(quest.id)}
        className="inline-flex items-center gap-1.5 text-[14px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Back to quest
      </Link>

      <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-[40px]">
        Edit quest
      </h1>
      <p className="mt-3 text-[17px] text-muted-foreground">
        Update the name, type, category, or target. Measure can&apos;t change once a quest exists.
      </p>

      <div className="mt-10">
        <QuestForm quest={quest} />
      </div>
    </div>
  );
}
