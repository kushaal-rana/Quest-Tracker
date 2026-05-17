import { PieChart } from "lucide-react";
import { ComingSoon } from "../_components/coming-soon";

export const metadata = { title: "Quarter View · Quest Tracker" };

export default function QuarterPage() {
  return (
    <ComingSoon
      Icon={PieChart}
      title="Quarter View"
      description="Full quarter timeline, progress ring, scorecard tiles, and the end-of-quarter reflection editor."
      arrives="Phase 4 / 5"
    />
  );
}
