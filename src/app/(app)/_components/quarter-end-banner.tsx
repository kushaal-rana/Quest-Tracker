import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ROUTES } from "@/lib/constants";

interface QuarterEndBannerProps {
  quarterId: string;
  quarterLabel: string;
  daysRemaining: number;
  hasReflection: boolean;
}

export function QuarterEndBanner({
  quarterId,
  quarterLabel,
  daysRemaining,
  hasReflection,
}: QuarterEndBannerProps) {
  // Don't show once they've written a reflection
  if (hasReflection) return null;
  // Only show within 7 days of end
  if (daysRemaining > 7) return null;

  const ended = daysRemaining === 0;
  const message = ended
    ? `${quarterLabel} has ended.`
    : daysRemaining === 1
      ? `${quarterLabel} ends tomorrow.`
      : `${quarterLabel} ends in ${daysRemaining} days.`;

  return (
    <Link
      href={ROUTES.quarterReview(quarterId)}
      className="group mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 transition-colors hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/30 dark:hover:bg-amber-950/50"
    >
      <Sparkles
        className="h-4 w-4 shrink-0 text-amber-500"
        strokeWidth={1.75}
      />
      <div className="flex-1 text-[14px] text-amber-800 dark:text-amber-300">
        <span className="font-medium">{message}</span>
        <span className="ml-1 text-amber-600 dark:text-amber-400">
          Write your quarterly reflection →
        </span>
      </div>
    </Link>
  );
}
