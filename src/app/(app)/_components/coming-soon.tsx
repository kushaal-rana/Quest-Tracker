import { type LucideIcon } from "lucide-react";

type Props = {
  Icon: LucideIcon;
  title: string;
  description: string;
  arrives: string;
};

/**
 * Reusable "coming in Phase X" placeholder for sidebar links that don't have
 * real pages yet. Used by /today, /week, /month, /quarter, /streaks, /logs, /settings.
 */
export function ComingSoon({ Icon, title, description, arrives }: Props) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground">
          <Icon className="h-7 w-7" strokeWidth={1.75} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 text-[15px] text-muted-foreground">{description}</p>
        <p className="mt-6 inline-flex items-center rounded-full border border-border bg-background px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {arrives}
        </p>
      </div>
    </div>
  );
}
