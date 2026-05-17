import { Flame } from "lucide-react";
import { ComingSoon } from "../_components/coming-soon";

export const metadata = { title: "Streaks · Quest Tracker" };

export default function StreaksPage() {
  return (
    <ComingSoon
      Icon={Flame}
      title="Streaks"
      description="Streak history, longest streaks, milestone awards (3, 7, 14, 30, 60, 90 days). For now: every session log shows your current streak in the toast."
      arrives="Phase 4"
    />
  );
}
