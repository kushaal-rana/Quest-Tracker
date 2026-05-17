"use client";

import { usePathname } from "next/navigation";
import { NAV_SECTIONS } from "@/lib/constants";

// Flat path → { section, label } lookup built from nav constants at module load.
const PATH_LABELS: Record<string, { section: string; label: string }> = {};
for (const section of NAV_SECTIONS) {
  for (const item of section.items) {
    PATH_LABELS[item.href] = { section: section.label, label: item.label };
  }
}

function getPageInfo(pathname: string): { section: string; label: string } {
  if (PATH_LABELS[pathname]) return PATH_LABELS[pathname];
  if (pathname === "/quest/new") return { section: "Workspace", label: "New Quest" };
  if (pathname.endsWith("/edit")) return { section: "Workspace", label: "Edit Quest" };
  if (pathname.startsWith("/quest/")) return { section: "Workspace", label: "Quest Detail" };
  if (pathname.includes("/review")) return { section: "Quarter", label: "Reflection" };
  return { section: "Workspace", label: "Dashboard" };
}

export function TopbarBreadcrumb() {
  const pathname = usePathname();
  const { section, label } = getPageInfo(pathname);

  return (
    <div className="text-[15px] text-muted-foreground">
      {section}
      <span className="mx-1.5 opacity-60">/</span>
      <span className="font-medium text-foreground">{label}</span>
    </div>
  );
}
