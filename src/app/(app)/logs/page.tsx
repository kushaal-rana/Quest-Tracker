import { ScrollText } from "lucide-react";
import { ComingSoon } from "../_components/coming-soon";

export const metadata = { title: "Logs · Quest Tracker" };

export default function LogsPage() {
  return (
    <ComingSoon
      Icon={ScrollText}
      title="Logs"
      description="Raw, filterable session log across all quests. Search by note, filter by date or quest, export to CSV."
      arrives="Phase 4"
    />
  );
}
