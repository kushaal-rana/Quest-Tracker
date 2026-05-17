import { Sun } from "lucide-react";
import { ComingSoon } from "../_components/coming-soon";

export const metadata = { title: "Today · Quest Tracker" };

export default function TodayPage() {
  return (
    <ComingSoon
      Icon={Sun}
      title="Today"
      description="A focused view of what you logged today, organized by quest. Quick reflection prompt at end of day."
      arrives="Phase 4"
    />
  );
}
