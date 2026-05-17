import { CalendarDays } from "lucide-react";
import { ComingSoon } from "../_components/coming-soon";

export const metadata = { title: "This Week · Quest Tracker" };

export default function WeekPage() {
  return (
    <ComingSoon
      Icon={CalendarDays}
      title="This Week"
      description="Weekly hours bar chart, day-of-week heatmap, and the 'pin a focus quest' workflow you wanted."
      arrives="Phase 4"
    />
  );
}
