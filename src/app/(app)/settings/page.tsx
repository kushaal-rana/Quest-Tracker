import { Settings } from "lucide-react";
import { ComingSoon } from "../_components/coming-soon";

export const metadata = { title: "Settings · Quest Tracker" };

export default function SettingsPage() {
  return (
    <ComingSoon
      Icon={Settings}
      title="Settings"
      description="Edit current quarter dates, time zone, archived quest list, profile, danger zone. The auto-detected calendar quarter works fine for now."
      arrives="Phase 4 / 5"
    />
  );
}
