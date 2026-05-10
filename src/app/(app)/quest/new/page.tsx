import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { QuestForm } from "@/features/quests/components/quest-form";

export const metadata = {
  title: "New quest · Quest Tracker",
};

export default function NewQuestPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={ROUTES.dashboard}
        className="inline-flex items-center gap-1.5 text-[14px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Back to dashboard
      </Link>

      <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-[40px]">
        New quest
      </h1>
      <p className="mt-3 text-[17px] text-muted-foreground">
        Define what you&apos;re working on this quarter and how you&apos;ll measure progress.
      </p>

      <div className="mt-10">
        <QuestForm />
      </div>
    </div>
  );
}
