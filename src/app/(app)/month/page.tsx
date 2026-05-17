import { CalendarRange } from "lucide-react";
import { ComingSoon } from "../_components/coming-soon";

export const metadata = { title: "This Month · Quest Tracker" };

export default function MonthPage() {
  return (
    <ComingSoon
      Icon={CalendarRange}
      title="This Month"
      description="Monthly rollup: total hours per quest, lessons completed, your monthly velocity vs target."
      arrives="Phase 4"
    />
  );
}
